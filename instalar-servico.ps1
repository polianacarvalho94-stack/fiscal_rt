# Executar como Administrador
# Registra o sync silencioso como tarefa do Windows (sem janelas)

$wscript = "C:\Windows\System32\wscript.exe"
$vbs     = "C:\Users\polia\OneDrive\Área de Trabalho\meu-site\sync-silencioso.vbs"
$usuario = $env:USERNAME

$action    = New-ScheduledTaskAction -Execute $wscript -Argument "`"$vbs`""
$trigger   = New-ScheduledTaskTrigger -AtLogOn -User $usuario
$settings  = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0 -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable $true
$principal = New-ScheduledTaskPrincipal -UserId $usuario -LogonType Interactive -RunLevel Highest

Register-ScheduledTask `
  -TaskName   "FiscalRT-Sync" `
  -Action     $action `
  -Trigger    $trigger `
  -Settings   $settings `
  -Principal  $principal `
  -Description "Sync silencioso bidirecional GitHub fiscal_rt" `
  -Force

Write-Host ""
Write-Host "Servico instalado! Sync iniciara silenciosamente no proximo login." -ForegroundColor Green
pause
