# Запускает сайт и публичный туннель Cloudflare, печатает ссылку.
# Использование: правой кнопкой -> "Выполнить с помощью PowerShell"
#   или:  powershell -ExecutionPolicy Bypass -File tools\start-public.ps1

$tools = $PSScriptRoot
$site  = Split-Path -Parent $tools
$log   = Join-Path $tools 'tunnel.log'

Write-Host 'Запускаю сервер...' -ForegroundColor Cyan
Start-Process -FilePath 'node' -ArgumentList 'server.mjs' -WorkingDirectory $site -WindowStyle Hidden
Start-Sleep -Seconds 3

try { Invoke-WebRequest -Uri 'http://127.0.0.1:3000/healthz' -UseBasicParsing -TimeoutSec 5 | Out-Null; Write-Host 'Сервер работает: http://127.0.0.1:3000' -ForegroundColor Green }
catch { Write-Host 'Сервер не поднялся — проверьте, установлен ли Node.js' -ForegroundColor Red; exit 1 }

Write-Host 'Открываю туннель...' -ForegroundColor Cyan
Remove-Item $log -ErrorAction SilentlyContinue
Start-Process -FilePath (Join-Path $tools 'cloudflared.exe') `
  -ArgumentList @('tunnel','--url','http://127.0.0.1:3000','--no-autoupdate','--logfile',$log,'--loglevel','info') `
  -WindowStyle Hidden

for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Seconds 1
  if (Test-Path $log) {
    $url = (Get-Content $log -ErrorAction SilentlyContinue | Select-String -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -AllMatches |
            ForEach-Object { $_.Matches.Value } | Select-Object -First 1)
    if ($url) {
      Write-Host ''
      Write-Host 'Публичная ссылка (живёт, пока запущен компьютер):' -ForegroundColor Yellow
      Write-Host "  $url" -ForegroundColor White
      Write-Host ''
      Write-Host 'Админка:  ' -NoNewline; Write-Host "$url/admin" -ForegroundColor White
      exit 0
    }
  }
}

Write-Host 'Ссылка не появилась. Откройте tools\tunnel.log и посмотрите ошибку.' -ForegroundColor Red
