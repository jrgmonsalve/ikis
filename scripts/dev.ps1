Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RootDir = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $RootDir

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

function Get-FirebaseCommand {
  $npmPrefix = npm config get prefix 2>$null
  if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($npmPrefix)) {
    $firebaseCmd = Join-Path $npmPrefix.Trim() 'firebase.cmd'
    if (Test-Path $firebaseCmd) {
      return $firebaseCmd
    }
  }

  $firebaseCommand = Get-Command firebase.cmd -ErrorAction SilentlyContinue
  if ($null -ne $firebaseCommand) {
    return $firebaseCommand.Source
  }

  $firebaseCommand = Get-Command firebase -ErrorAction SilentlyContinue
  if ($null -ne $firebaseCommand) {
    return $firebaseCommand.Source
  }

  throw 'Firebase CLI no esta disponible. Instala firebase-tools y confirma que firebase --version funcione.'
}

function Start-FirebaseEmulators {
  param([Parameter(Mandatory = $true)][string]$FirebaseCommand)

  if ([IO.Path]::GetExtension($FirebaseCommand) -ieq '.cmd') {
    $command = "`"`"$FirebaseCommand`" emulators:start --only auth,firestore,functions`""
    return Start-Process -FilePath 'cmd.exe' -ArgumentList @('/d', '/s', '/c', $command) -NoNewWindow -PassThru
  }

  return Start-Process -FilePath $FirebaseCommand -ArgumentList @('emulators:start', '--only', 'auth,firestore,functions') -NoNewWindow -PassThru
}

function Start-Npm {
  param([Parameter(Mandatory = $true)][string[]]$NpmArguments)

  $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if ($null -ne $npmCommand) {
    $command = "`"`"$($npmCommand.Source)`" $($NpmArguments -join ' ')`""
    return Start-Process -FilePath 'cmd.exe' -ArgumentList @('/d', '/s', '/c', $command) -NoNewWindow -PassThru
  }

  return Start-Process -FilePath 'npm' -ArgumentList $NpmArguments -NoNewWindow -PassThru
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

function Test-EmulatorsReady {
  try {
    $status = Invoke-RestMethod -Uri 'http://127.0.0.1:4400/emulators' -TimeoutSec 2
    $ready = $status.auth -and $status.firestore -and $status.functions
    if (-not $ready) {
      return $false
    }

    try {
      Invoke-WebRequest -Uri 'http://127.0.0.1:5001/ikis-5fed9/us-central1/createFamily' -TimeoutSec 2 -UseBasicParsing | Out-Null
    } catch [System.Net.WebException] {
      if ($null -eq $_.Exception.Response) {
        return $false
      }
    }

    return $true
  } catch {
    return $false
  }
}

$emulatorsProcess = $null
$webProcess = $null

try {
  $firebaseCommand = Get-FirebaseCommand

  npm --prefix functions run build
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  $emulatorsProcess = Start-FirebaseEmulators -FirebaseCommand $firebaseCommand

  Write-Host 'Waiting for Firebase emulators...'
  $ready = $false
  for ($i = 0; $i -lt 60; $i++) {
    if ($emulatorsProcess.HasExited) {
      throw 'Firebase emulators exited before becoming ready.'
    }

    if (Test-EmulatorsReady) {
      $ready = $true
      break
    }

    Start-Sleep -Seconds 1
  }

  if (-not $ready) {
    throw 'Firebase emulators did not become ready within 60 seconds.'
  }

  Write-Host 'Firebase emulators are ready.'
  Start-Sleep -Seconds 2

  $webProcess = Start-Npm -NpmArguments @('start')
  Wait-Process -Id $webProcess.Id
  exit $webProcess.ExitCode
} finally {
  if ($null -ne $webProcess -and -not $webProcess.HasExited) {
    Stop-ProcessTree -ProcessId $webProcess.Id
  }

  if ($null -ne $emulatorsProcess -and -not $emulatorsProcess.HasExited) {
    Stop-ProcessTree -ProcessId $emulatorsProcess.Id
  }
}
