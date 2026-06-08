# Executar como Administrador — instala o sync como serviço do Windows
$nodePath  = "C:\Program Files\nodejs\node.exe"
$syncScript = "C:\Users\polia\OneDrive\Área de Trabalho\meu-site\sync.js"
$workDir    = "C:\Users\polia\OneDrive\Área de Trabalho\meu-site"
$usuario    = $env:USERNAME

$action    = New-ScheduledTaskAction -Execute $nodePath -Argument "`"$syncScript`"" -WorkingDirectory $workDir
$trigger   = New-ScheduledTaskTrigger -AtLogOn -User $usuario
$settings  = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0 -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable $true
$principal = New-ScheduledTaskPrincipal -UserId $usuario -LogonType Interactive -RunLevel Highest

Register-ScheduledTask `
  -TaskName   "FiscalRT-Sync" `
  -Action     $action `
  -Trigger    $trigger `
  -Settings   $settings `
  -Principal  $principal `
  -Description "Sincronizacao bidirecional GitHub fiscal_rt — inicia automaticamente no login" `
  -Force

Write-Host ""
Write-Host "✅ Servico instalado com sucesso!" -ForegroundColor Green
Write-Host "   O sync iniciara automaticamente sempre que voce fizer login no Windows." -ForegroundColor Cyan
Write-Host ""
Write-Host "Comandos uteis:" -ForegroundColor Yellow
Write-Host "  Verificar status:  Get-ScheduledTask -TaskName FiscalRT-Sync"
Write-Host "  Parar o sync:      Stop-ScheduledTask -TaskName FiscalRT-Sync"
Write-Host "  Iniciar manual:    Start-ScheduledTask -TaskName FiscalRT-Sync"
Write-Host "  Remover servico:   Unregister-ScheduledTask -TaskName FiscalRT-Sync -Confirm:`$false"
pause
