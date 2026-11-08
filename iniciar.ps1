$ErrorActionPreference = 'Stop'

function Test-LocalMongoDb {
    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $connect = $client.BeginConnect('127.0.0.1', 27017, $null, $null)
        if (-not $connect.AsyncWaitHandle.WaitOne(750)) {
            return $false
        }
        $client.EndConnect($connect)
        return $true
    }
    catch {
        return $false
    }
    finally {
        $client.Close()
    }
}

function Start-DevWindow {
    param(
        [string]$Title,
        [string]$RelativePath,
        [string]$NpmScript,
        [hashtable]$Environment
    )

    $directory = Join-Path $projectRoot $RelativePath
    if (-not (Test-Path (Join-Path $directory 'node_modules'))) {
        throw "Faltan dependencias en $RelativePath. Ejecuta npm install en esa carpeta."
    }

    $escapedDirectory = $directory.Replace("'", "''")
    $commands = @(
        "`$Host.UI.RawUI.WindowTitle = '$Title'"
        "Set-Location -LiteralPath '$escapedDirectory'"
    )

    foreach ($key in $Environment.Keys) {
        $value = ([string]$Environment[$key]).Replace("'", "''")
        $commands += "`$env:$key = '$value'"
    }

    $commands += "npm.cmd run $NpmScript"
    $encodedCommand = [Convert]::ToBase64String(
        [Text.Encoding]::Unicode.GetBytes($commands -join '; ')
    )
    $currentPowerShell = (Get-Process -Id $PID).Path
    Start-Process -FilePath $currentPowerShell `
        -WorkingDirectory $directory `
        -ArgumentList @('-NoExit', '-EncodedCommand', $encodedCommand)
}

try {
    $projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

    if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
        throw 'Node.js no está instalado o no está disponible en PATH.'
    }
    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
        throw 'npm no está disponible en PATH.'
    }

    if (-not (Test-Path (Join-Path $projectRoot '.env'))) {
        $envExample = Join-Path $projectRoot '.env.example'
        if (-not (Test-Path $envExample)) {
            throw 'No se encontró .env.example para configurar JWT_SECRET.'
        }
        Copy-Item $envExample (Join-Path $projectRoot '.env')
        Write-Host 'Se creó .env desde .env.example.'
    }

    if (-not (Test-LocalMongoDb)) {
        $mongoService = Get-Service -Name 'MongoDB' -ErrorAction SilentlyContinue
        if ($null -eq $mongoService) {
            throw 'MongoDB no está disponible en localhost:27017. Instala MongoDB Community Server o inicia su servicio local.'
        }
        if ($mongoService.Status -ne 'Running') {
            Start-Service -Name $mongoService.Name
        }

        $ready = $false
        for ($attempt = 0; $attempt -lt 30; $attempt++) {
            if (Test-LocalMongoDb) {
                $ready = $true
                break
            }
            Start-Sleep -Seconds 1
        }
        if (-not $ready) {
            throw 'MongoDB no respondió en localhost:27017. Comprueba el servicio MongoDB.'
        }
    }

    Start-DevWindow -Title 'Univalle Shop - user-service' `
        -RelativePath 'services\user-service' `
        -NpmScript 'start:dev' `
        -Environment @{ MONGODB_URI = 'mongodb://127.0.0.1:27017/univalle_users' }
    Start-DevWindow -Title 'Univalle Shop - API Gateway' `
        -RelativePath 'api-gateway' `
        -NpmScript 'start:dev' `
        -Environment @{ USER_SERVICE_URL = 'http://localhost:3003' }
    Start-DevWindow -Title 'Univalle Shop - Frontend' `
        -RelativePath 'frontend' `
        -NpmScript 'dev' `
        -Environment @{}

    Write-Host 'Se abrieron las ventanas de user-service, API Gateway y frontend.'
    Write-Host 'Para detener cada servidor, presiona Ctrl+C en su ventana.'
}
catch {
    Write-Host "No se pudo completar el arranque: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
