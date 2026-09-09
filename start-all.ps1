$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Backend Symfony (8000) - escucha en 0.0.0.0 para llegar desde el celular en la LAN
if (-not (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath "C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe" `
        -ArgumentList "-S","0.0.0.0:8000","-t","public" `
        -WorkingDirectory "$root\backend" -WindowStyle Hidden `
        -RedirectStandardOutput "$root\backend\server.out.log" -RedirectStandardError "$root\backend\server.err.log"
}

# Worker de Messenger: procesa en segundo plano los webhooks entrantes (IA + respuestas)
Start-Process -FilePath "C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe" `
    -ArgumentList "bin/console","messenger:consume","async","--time-limit=86400" `
    -WorkingDirectory "$root\backend" -WindowStyle Hidden `
    -RedirectStandardOutput "$root\backend\worker.out.log" -RedirectStandardError "$root\backend\worker.err.log"

# Telegram Adapter (3002) - WhatsApp adapter queda pausado (sin tocar la carpeta)
$tgConfig = "$root\telegram-adapter\config.json"
if ((Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue) -eq $null) {
    if (Test-Path $tgConfig) {
        Start-Process -FilePath "C:\Program Files\nodejs\node.exe" `
            -ArgumentList "src/index.js" `
            -WorkingDirectory "$root\telegram-adapter" -WindowStyle Hidden `
            -RedirectStandardOutput "$root\telegram-adapter\adapter.out.log" -RedirectStandardError "$root\telegram-adapter\adapter.err.log"
    } else {
        Write-Output "AVISO: falta telegram-adapter/config.json (crea el bot y copia config.example.json) - no se inicia el adapter."
    }
}

# Next.js frontend (3000)
if (-not (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath "C:\Program Files\nodejs\npm.cmd" `
        -ArgumentList "run","dev" `
        -WorkingDirectory "$root\frontend" -WindowStyle Hidden `
        -RedirectStandardOutput "$root\frontend\next.out.log" -RedirectStandardError "$root\frontend\next.err.log"
}

Write-Output "Esperando que levanten…"; Start-Sleep -Seconds 18
Write-Output ("symfony:" + (curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:8000/api/services))
Write-Output ("frontend:" + (curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/))
Write-Output ("adapter-telegram:" + (curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002/health))