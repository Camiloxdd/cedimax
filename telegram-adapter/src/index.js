'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const root = path.join(__dirname, '..');

function loadConfig() {
  const file = path.join(root, 'config.json');
  let fromFile = {};
  if (fs.existsSync(file)) {
    try {
      fromFile = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      console.error('[telegram-adapter] config.json invalido:', e.message);
    }
  }
  return {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || fromFile.telegramBotToken || '',
    backendWebhookUrl: process.env.BACKEND_WEBHOOK_URL || fromFile.backendWebhookUrl || 'http://127.0.0.1:8000/api/whatsapp/webhook',
    backendWebhookToken: process.env.BACKEND_WEBHOOK_TOKEN || fromFile.backendWebhookToken || '',
    internalToken: process.env.INTERNAL_TOKEN || fromFile.internalToken || '',
    port: Number(process.env.PORT || fromFile.port || 3002),
  };
}

// Fail-closed: si un token esta vacio o es un placeholder conocido, se rechaza.
function isPlaceholder(value) {
  return !value || value.includes('PEGA_AQUI') || value.includes('cambiar-');
}

const cfg = loadConfig();
const app = express();
app.use(express.json());

let bot = null;
let botInfo = null;
let lastWhId = '';
let lastError = '';

function telegramToPlain(text) {
  return String(text).replace(/<([^>]+)>/g, '$1');
}

async function forwardToBackend(chatId, text, fromName) {
  if (isPlaceholder(cfg.backendWebhookToken)) {
    lastError = 'backendWebhookToken sin configurar (fail-closed).';
    throw new Error(lastError);
  }
  const res = await fetch(cfg.backendWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Token': cfg.backendWebhookToken,
    },
    body: JSON.stringify({
      waId: String(chatId),
      text,
      fromName: fromName || '',
      channel: 'telegram',
    }),
  });
  if (!res.ok) {
    throw new Error('backend webhook ' + res.status + ': ' + (await res.text()).slice(0, 300));
  }
  return res.json();
}

function startBot() {
  if (!cfg.telegramBotToken || cfg.telegramBotToken.includes('PEGA_AQUI')) {
    lastError = 'Sin TELEGRAM_BOT_TOKEN: crea un bot en @BotFather y pega el token en telegram-adapter/config.json';
    console.error('[telegram-adapter]', lastError);
    return;
  }

  bot = new TelegramBot(cfg.telegramBotToken, {
    polling: { params: { timeout: 30 } },
  });

  bot.getMe().then((me) => {
    botInfo = me;
    lastError = '';
    console.log('[telegram-adapter] Bot conectado: @' + me.username);
  }).catch((e) => {
    lastError = 'Error de token: ' + e.message;
    console.error('[telegram-adapter]', lastError);
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const textMsg = msg.text;
    const fromName = [msg.from && msg.from.first_name, msg.from && msg.from.last_name].filter(Boolean).join(' ').trim();
    lastWhId = String(chatId);

    if (!textMsg) {
      return;
    }
    if (textMsg === '/start') {
      try {
        await bot.sendMessage(chatId, '¡Hola! 👋 Soy el asistente de CEDIMAX · Centro de Imágenes Diagnósticas. Nuestra prioridad eres tú. Escríbeme qué estudio necesitas (p. ej. "quiero agendar una ecografía abdominal") y te ayudo a reservar tu cita.');
      } catch (ignored) {}
      return;
    }

    try {
      const result = await forwardToBackend(chatId, textMsg, fromName);
      console.log('[telegram-adapter] -> backend ok, waId=' + chatId + ' result=' + JSON.stringify(result));
    } catch (e) {
      lastError = 'forward: ' + e.message;
      console.error('[telegram-adapter]', lastError);
      try {
        await bot.sendMessage(chatId, 'Ups, hubo un problema al procesar tu mensaje. Inténtalo de nuevo en un momento.');
      } catch (ignored) {}
      try {
        await forwardToBackend(chatId, textMsg, fromName);
      } catch (ignored) {}
    }
  });

  bot.on('polling_error', (e) => {
    lastError = 'polling: ' + (e && e.message ? e.message : String(e));
    console.error('[telegram-adapter]', lastError);
  });
}

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    configured: Boolean(bot) && Boolean(botInfo),
    bot: botInfo ? '@' + botInfo.username : null,
    lastWhId: lastWhId || null,
    lastError: lastError || null,
    time: Math.floor(Date.now() / 1000),
  });
});

app.post('/send', async (req, res) => {
  const token = req.headers['x-internal-token'] || '';
  if (isPlaceholder(cfg.internalToken) || !token || token !== cfg.internalToken) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  const waId = String(req.body.waId || '').trim();
  const text = String(req.body.text || '').trim();
  if (!waId || !text) {
    return res.status(422).json({ error: 'Faltan waId/text.' });
  }
  if (!bot || !botInfo) {
    return res.status(503).json({ error: 'Bot no conectado.' });
  }

  const buttonLabel = req.body.buttonLabel || '';
  const url = req.body.url || '';
  const opts = {};
  if (buttonLabel && url) {
    opts.reply_markup = { inline_keyboard: [[{ text: buttonLabel, url: String(url) }]] };
  }

  try {
    await bot.sendMessage(waId, telegramToPlain(text), opts);
    res.json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: 'Telegram API: ' + (e && e.message ? e.message : String(e)) });
  }
});

app.listen(cfg.port, () => {
  console.log('[telegram-adapter] escuchando en http://127.0.0.1:' + cfg.port);
  console.log('[telegram-adapter] backend:', cfg.backendWebhookUrl);
  startBot();
});

process.on('SIGINT', () => {
  console.log('[telegram-adapter] apagando...');
  if (bot) {
    try { bot.stopPolling(); } catch (ignored) {}
  }
  process.exit(0);
});