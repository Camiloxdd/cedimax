const express = require('express');
const QRCode = require('qrcode');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function loadConfig() {
    const file = path.join(root, 'config.json');
    let fromFile = {};
    if (fs.existsSync(file)) {
        try {
            fromFile = JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (err) {
            console.log('[whatsapp-adapter] config.json invalido: ' + err.message);
        }
    }
    return {
        port: Number(process.env.PORT || fromFile.port || 3001),
        backendWebhookUrl: process.env.SYMFONY_WEBHOOK_URL || fromFile.backendWebhookUrl || 'http://127.0.0.1:8000',
        webhookToken: process.env.WEBHOOK_TOKEN || fromFile.webhookToken || '',
        internalToken: process.env.INTERNAL_TOKEN || fromFile.internalToken || '',
        businessNumber: (process.env.BUSINESS_WHATSAPP_NUMBER || fromFile.businessNumber || '').replace(/\D/g, ''),
    };
}

// Fail-closed: si un token esta vacio o es un placeholder conocido, se rechaza.
function isPlaceholder(value) {
    return !value || value.includes('PEGA_AQUI') || value.includes('cambiar-');
}

const cfg = loadConfig();
const PORT = cfg.port;
const SYMFONY_WEBHOOK_URL = cfg.backendWebhookUrl;
const WEBHOOK_TOKEN = cfg.webhookToken;
const INTERNAL_TOKEN = cfg.internalToken;
const BUSINESS_NUMBER = cfg.businessNumber;

const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
});

let sessionReady = false;
let lastQrAt = null;
let retryTimer = null;

client.on('qr', (qr) => {
    lastQrAt = Date.now();
    console.log('\n==================================');
    console.log(' ESCANEA este QR con WhatsApp ');
    console.log('  WhatsApp > Dispositivos > Vincular');
    console.log('==================================\n');
    qrcode.generate(qr, { small: true });
    saveQrPng(qr);
});

function saveQrPng(qr) {
    const target = path.join(__dirname, '..', 'qr.png');
    const tmp = path.join(__dirname, '..', 'qr.png.tmp');
    QRCode.toFile(tmp, qr, { width: 420, margin: 4 })
        .then(() => {
            try {
                fs.copyFileSync(tmp, target);
                fs.unlinkSync(tmp);
                log('QR listo en http://127.0.0.1:' + PORT + '/qr');
            } catch (err) {
                log('No se pudo refrescar qr.png: ' + err.message);
            }
        })
        .catch((err) => log('Error generando QR: ' + err.message));
}

client.on('ready', () => {
    sessionReady = true;
    lastQrAt = null;
    log(`Conectado como ${client.info.wid.user}`);
});

client.on('authenticated', () => log('Sesión autenticada.'));
client.on('auth_failure', (msg) => log('Falló la autenticación: ' + msg));
client.on('loading_screen', (pct) => log('Cargando WhatsApp Web... ' + pct + '%'));

client.on('disconnected', (reason) => {
    sessionReady = false;
    log('Desconectado: ' + reason);
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
        log('Reintentando…');
        client.initialize();
    }, 15000);
});

async function forwardToSymfony(waId, text, fromName) {
    const payload = { waId, text, fromName: fromName || null };
    const url = SYMFONY_WEBHOOK_URL.replace(/\/$/, '') + '/api/whatsapp/webhook';
    if (isPlaceholder(WEBHOOK_TOKEN)) {
        log('WEBHOOK_TOKEN sin configurar (fail-closed): no se reenvia.');
        return;
    }
    try {
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Token': WEBHOOK_TOKEN,
            },
            body: JSON.stringify(payload),
        });
        if (!resp.ok) log(`Webhook Symfony respondió ${resp.status}: ${await resp.text()}`);
        else log(`Mensaje reenviado a Symfony (${resp.status})`);
    } catch (err) {
        log('Error reenviando a Symfony: ' + err.message);
        setTimeout(() => forwardToSymfony(waId, text, fromName).catch(() => {}), 3000);
    }
}

client.on('message', async (message) => {
    if (message.fromMe) return;
    if (message.isGroup) return;
    const waId = message.from.replace(/@c\.us$/, '').replace(/\D/g, '');
    if (!waId) return;
    if (BUSINESS_NUMBER && BUSINESS_NUMBER !== waId && waId === BUSINESS_NUMBER) return;
    const text = (message.body || '').trim();
    if (!text) return;

    const fromName = message._data.notifyName || message._data.pushname || null;
    log(`Entrante de ${waId}${fromName ? ' (' + fromName + ')' : ''}: ${text.slice(0, 80)}`);
    await forwardToSymfony(waId, text, fromName);
});

const app = express();
app.use(express.json());

function internalAuth(req, res, next) {
    if (isPlaceholder(INTERNAL_TOKEN) || req.headers['x-internal-token'] !== INTERNAL_TOKEN) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    next();
}

app.get('/health', (_req, res) => {
    res.json({
        ok: true,
        ready: sessionReady,
        whatsappNumber: client.info?.wid?.user ? client.info.wid.user : null,
        state: client.info ? 'connected' : (lastQrAt ? 'waiting_for_qr' : 'starting'),
        uptime: Math.round(process.uptime()),
    });
});

app.get('/qr', (_req, res) => {
    res.type('html').send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Cedimax · Vincular WhatsApp</title>
<style>
  body{font-family:Segoe UI,Arial,sans-serif;background:#f4f5f7;display:flex;flex-direction:column;align-items:center;padding:32px 16px;margin:0}
  .card{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);padding:32px;text-align:center;max-width:480px;width:100%}
  h1{font-size:22px;color:#0f172a;margin:0 0 4px}
  p{color:#64748b;font-size:14px;margin:6px 0}
  #status{display:inline-flex;align-items:center;gap:8px;margin-top:12px;padding:6px 14px;border-radius:999px;font-size:13px;font-weight:600;color:#15803d;background:#dcfce7}
  #status.warn{color:#92400e;background:#fef3c7}
  img{margin:20px 0;border:1px solid #e2e8f0;border-radius:12px;max-width:100%}
  .step{text-align:left;background:#f8fafc;border-radius:12px;padding:14px 16px;font-size:13px;color:#334155;margin-top:8px}
  .step b{color:#0f172a}
</style></head><body>
<div class="card">
  <h1>Cedimax · Vincular WhatsApp</h1>
  <p>Escanea el código con tu celular</p>
  <img id="qr" alt="QR de WhatsApp"/>
  <div id="status" class="warn">Conectando…</div>
  <div class="step">
    <b>Cómo escanearlo:</b><br/>
    1. Abre WhatsApp en tu celular.<br/>
    2. Menú (⋮) → <b>Dispositivos vinculados</b> → <b>Vincular dispositivo</b>.<br/>
    3. Apunta la cámara al código y espera la confirmación.<br/>
    El código se renueva automáticamente cada pocos segundos.
  </div>
</div>
<script>
  const img=document.getElementById('qr');
  const st=document.getElementById('status');
  function refresh(){
    img.src='/qr/image?_='+Date.now();
    fetch('/health').then(r=>r.json()).then(h=>{
      if(h.ready && h.whatsappNumber){ st.textContent='Conectado ✅ · '+(h.whatsappNumber||''); st.className=''; }
      else st.textContent='Esperando escaneo del código…'; st.className='warn';
    }).catch(()=>{});
  }
  setInterval(refresh, 2500);
  refresh();
</script>
</body></html>`);
});

app.get('/qr/image', (_req, res) => {
    const file = path.join(__dirname, '..', 'qr.png');
    if (!fs.existsSync(file)) {
        return res.status(404).send('Todavía no hay QR generado.').end();
    }
    res.set('Cache-Control', 'no-store, max-age=0');
    res.sendFile(file);
});

app.post('/send', internalAuth, async (req, res) => {
    const waId = String(req.body.waId || '').replace(/\D/g, '');
    const text = String(req.body.text || '').trim();
    if (!waId || !text) return res.status(422).json({ error: 'waId y text son obligatorios' });
    if (!sessionReady) return res.status(503).json({ error: 'WhatsApp no conectado aún' });

    try {
        await client.sendMessage(waId + '@c.us', text);
        res.json({ ok: true });
    } catch (err) {
        log('Error enviando a ' + waId + ': ' + err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => log(`Adapter escuchando en http://127.0.0.1:${PORT}`));

client.initialize().catch((err) => {
    log('Error en initialize: ' + err.message);
    process.exit(1);
});

process.on('SIGINT', async () => {
    await client.destroy();
    process.exit(0);
});

process.on('unhandledRejection', (err) => log('Promesa no manejada: ' + (err && err.message ? err.message : err)));
process.on('uncaughtException', (err) => log('Excepción no capturada: ' + (err && err.stack ? err.stack : err)));