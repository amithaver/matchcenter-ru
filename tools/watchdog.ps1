# Сторож: проверяет сайт каждые 2 минуты и поднимает сервер, если он упал.
$site = Split-Path -Parent $PSScriptRoot
$log  = Join-Path $PSScriptRoot 'watchdog.log'
while ($true) {
  try {
    Invoke-WebRequest -Uri 'http://127.0.0.1:3000/healthz' -UseBasicParsing -TimeoutSec 5 | Out-Null
  } catch {
    "$(Get-Date -Format s) сервер не отвечает — перезапуск" | Add-Content $log
    Start-Process -FilePath 'node' -ArgumentList 'server.mjs' -WorkingDirectory $site -WindowStyle Hidden
    Start-Sleep -Seconds 5
  }
  Start-Sleep -Seconds 120
}
