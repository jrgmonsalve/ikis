Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RootDir = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$RuntimeDir = Join-Path $RootDir '.local-runtime'
$PidFile = Join-Path $RuntimeDir 'dev.pid'
$LogFile = Join-Path $RuntimeDir 'dev.log'
$ErrLogFile = Join-Path $RuntimeDir 'dev.err.log'
$DevScript = Join-Path $RootDir 'scripts\dev.ps1'

function Add-PathEntry {
  param([Parameter(Mandatory = $true)][string]$PathEntry)

  if ((Test-Path $PathEntry) -and (($env:PATH -split ';') -notcontains $PathEntry)) {
    $env:PATH = "$PathEntry;$env:PATH"
  }
}

function Use-LocalWindowsTools {
  $npmPrefix = npm config get prefix 2>$null
  if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($npmPrefix)) {
    Add-PathEntry $npmPrefix.Trim()
  }

  if ([string]::IsNullOrWhiteSpace($env:JAVA_HOME)) {
    $adoptiumJava = Get-ChildItem 'C:\Program Files\Eclipse Adoptium' -Recurse -Filter java.exe -ErrorAction SilentlyContinue |
      Sort-Object FullName -Descending |
      Select-Object -First 1

    if ($null -ne $adoptiumJava) {
      $env:JAVA_HOME = Split-Path -Parent (Split-Path -Parent $adoptiumJava.FullName)
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($env:JAVA_HOME)) {
    Add-PathEntry (Join-Path $env:JAVA_HOME 'bin')
  }
}

Use-LocalWindowsTools

function Get-ManagedProcess {
  if (-not (Test-Path $PidFile)) {
    return $null
  }

  $rawPid = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
  if ($rawPid -notmatch '^\d+$') {
    return $null
  }

  return Get-Process -Id ([int]$rawPid) -ErrorAction SilentlyContinue
}

function Stop-ProcessTree {
  param([Parameter(Mandatory = $true)][int]$ProcessId)

  $children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$ProcessId" -ErrorAction SilentlyContinue
  foreach ($child in $children) {
    Stop-ProcessTree -ProcessId ([int]$child.ProcessId)
  }

  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if ($null -ne $process) {
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
  }
}

function Test-LocalReady {
  try {
    Invoke-WebRequest -Uri 'http://localhost:4200/' -TimeoutSec 2 -UseBasicParsing | Out-Null
    Invoke-WebRequest -Uri 'http://127.0.0.1:4400/emulators' -TimeoutSec 2 -UseBasicParsing | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Start-Local {
  $process = Get-ManagedProcess
  if ($null -ne $process) {
    Write-Host "IKIS local ya esta activo (PID $($process.Id))."
    Show-Status
    return
  }

  New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
  Set-Content -Path $LogFile -Value ''
  Set-Content -Path $ErrLogFile -Value ''

  $arguments = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', $DevScript
  )

  $process = Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -WorkingDirectory $RootDir -WindowStyle Hidden -RedirectStandardOutput $LogFile -RedirectStandardError $ErrLogFile -PassThru
  Set-Content -Path $PidFile -Value $process.Id

  Write-Host "Iniciando IKIS local (PID $($process.Id))..."
  for ($i = 0; $i -lt 90; $i++) {
    if ($process.HasExited) {
      Write-Error 'El entorno no pudo iniciar. Ultimas lineas del log:'
      Get-Content $LogFile -Tail 40 -ErrorAction SilentlyContinue
      Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
      exit 1
    }

    if (Test-LocalReady) {
      Write-Host 'IKIS local esta listo.'
      Show-Status
      return
    }

    Start-Sleep -Seconds 1
    $process.Refresh()
  }

  Write-Error 'El entorno no estuvo listo dentro de 90 segundos. Revisa: npm run local:logs:win'
  exit 1
}

function Stop-Local {
  $process = Get-ManagedProcess
  if ($null -eq $process) {
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    Write-Host 'IKIS local no esta activo mediante el controlador.'
    return
  }

  Write-Host "Deteniendo IKIS local (PID $($process.Id))..."
  Stop-ProcessTree -ProcessId $process.Id
  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
  Write-Host 'IKIS local fue detenido.'
}

function Show-Status {
  $process = Get-ManagedProcess
  if ($null -ne $process) {
    Write-Host "Estado: activo (PID $($process.Id))"
    Write-Host 'Aplicacion: http://localhost:4200/'
    Write-Host 'Emuladores: http://localhost:4000/'
    Write-Host "Log: $LogFile"
    Write-Host "Errores: $ErrLogFile"
  } else {
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    Write-Host 'Estado: detenido'
  }
}

function Show-Logs {
  New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
  if (-not (Test-Path $LogFile)) {
    Set-Content -Path $LogFile -Value ''
  }
  if (-not (Test-Path $ErrLogFile)) {
    Set-Content -Path $ErrLogFile -Value ''
  }

  Get-Content $LogFile, $ErrLogFile -Wait -Tail 80
}

$command = if ($args.Count -gt 0) { $args[0] } else { '' }

switch ($command) {
  'start' { Start-Local }
  'stop' { Stop-Local }
  'restart' {
    Stop-Local
    Start-Local
  }
  'status' { Show-Status }
  'logs' { Show-Logs }
  default {
    Write-Error 'Uso: .\scripts\local-env.ps1 {start|stop|restart|status|logs}'
    exit 1
  }
}
