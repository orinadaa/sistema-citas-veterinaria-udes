[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$productoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendPath = Join-Path $productoRoot 'backend'
$frontendPath = Join-Path $productoRoot 'frontend'
$envPath = Join-Path $backendPath '.env'

function Convertir-Secreto([Security.SecureString] $secreto) {
  if (-not $secreto) { return '' }
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secreto)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

function Valor-DotEnv([string] $valor) {
  $escapado = $valor.Replace('\', '\\').Replace('"', '\"').Replace("`r", '').Replace("`n", '\n')
  return '"' + $escapado + '"'
}

function Valor-Sql([string] $valor) {
  return "'" + $valor.Replace("'", "''") + "'"
}

function Exigir-Exito([string] $operacion) {
  if ($LASTEXITCODE -ne 0) { throw "$operacion falló (código $LASTEXITCODE)." }
}

function Actualizar-RutaProceso {
  $rutas = @(
    [Environment]::GetEnvironmentVariable('Path', 'Machine'),
    [Environment]::GetEnvironmentVariable('Path', 'User'),
    $env:Path,
    (Join-Path $env:ProgramFiles 'nodejs')
  ) | Where-Object { $_ }
  $env:Path = $rutas -join ';'
}

function Buscar-Psql {
  $directorio = Join-Path $env:ProgramFiles 'PostgreSQL'
  if (Test-Path -LiteralPath $directorio) {
    $instalaciones = Get-ChildItem -LiteralPath $directorio -Directory -ErrorAction SilentlyContinue |
      Sort-Object { try { [version]$_.Name } catch { [version]'0.0' } } -Descending
    foreach ($instalacion in $instalaciones) {
      $psqlPath = Join-Path $instalacion.FullName 'bin\psql.exe'
      if (Test-Path -LiteralPath $psqlPath) { return Get-Item -LiteralPath $psqlPath }
    }
  }
  return Get-Command psql.exe -ErrorAction SilentlyContinue
}

function Esperar-PostgreSQL([string] $pgIsReadyPath, [string] $port) {
  if (-not (Test-Path -LiteralPath $pgIsReadyPath)) {
    throw 'PostgreSQL quedó instalado, pero no se encontró pg_isready.exe para comprobar que el servicio esté listo.'
  }
  $limite = (Get-Date).AddSeconds(90)
  do {
    & $pgIsReadyPath -h localhost -p $port -t 3 *> $null
    if ($LASTEXITCODE -eq 0) { return }
    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $limite)
  throw 'PostgreSQL no quedó disponible en localhost:5432 después de instalarse. Compruebe el servicio de Windows y vuelva a ejecutar el instalador.'
}

function Instalar-PaqueteWinget([string] $id, [string] $nombre, [string[]] $argumentosExtra = @()) {
  $winget = Get-Command winget.exe -ErrorAction SilentlyContinue
  if (-not $winget) {
    throw "No se encontró WinGet para instalar $nombre. Instale WinGet desde Microsoft Store o instale $nombre manualmente y vuelva a ejecutar este archivo."
  }
  Write-Host "Instalando $nombre desde WinGet..." -ForegroundColor Yellow
  & $winget.Source install --id $id --exact --source winget --silent --accept-source-agreements --accept-package-agreements --disable-interactivity @argumentosExtra
  Exigir-Exito "Instalación de $nombre"
  Actualizar-RutaProceso
}

function Obtener-NodeVersion {
  $node = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $node) { return $null }
  $texto = (& $node.Source -p 'process.versions.node').Trim()
  Exigir-Exito 'Verificación de Node.js'
  try { return [version]$texto } catch { return $null }
}

function Node-Compatible([version] $version) {
  if (-not $version) { return $false }
  return ($version.Major -eq 20 -and $version.Minor -ge 19) -or
    ($version.Major -ge 22 -and ($version.Major -gt 22 -or $version.Minor -ge 12))
}

$envCreadoAhora = $false
try {
  Write-Host 'Instalación local de la Plataforma de Citas UDES' -ForegroundColor Cyan
  if (Test-Path -LiteralPath $envPath) {
    throw 'Ya existe backend/.env. Se conserva para no sobrescribir claves ni credenciales. Revise docs/instalacion.md o renombre el archivo si desea volver a configurar.'
  }

  $nodeVersion = Obtener-NodeVersion
  if (-not (Node-Compatible $nodeVersion)) {
    Instalar-PaqueteWinget 'OpenJS.NodeJS.LTS' 'Node.js LTS'
    $nodeVersion = Obtener-NodeVersion
  }
  if (-not (Node-Compatible $nodeVersion)) {
    throw "Node.js $nodeVersion no es compatible con Vite. Se requiere 20.19 o superior de la rama 20, o 22.12 o superior. Cierre esta ventana y vuelva a ejecutar el instalador después de actualizar Node.js."
  }
  $node = Get-Command node.exe -ErrorAction SilentlyContinue
  $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if (-not $node -or -not $npm) { throw 'No se encontró npm después de instalar Node.js. Cierre esta ventana, vuelva a abrir el instalador y compruebe Node.js.' }

  $psql = Buscar-Psql
  $postgresAutomatico = $false
  if (-not $psql) {
    # El paquete de WinGet no documenta una contraseña inicial: se instala con
    # una temporal aleatoria (solo letras y números, sin problemas de comillas)
    # y más abajo se reemplaza por la que defina la persona que instala.
    $clavePostgresTemporal = [guid]::NewGuid().ToString('N')
    Instalar-PaqueteWinget 'PostgreSQL.PostgreSQL.18' 'PostgreSQL 18' @('--custom', "--superpassword $clavePostgresTemporal --serverport 5432")
    $psql = Buscar-Psql
    $postgresAutomatico = $true
  }
  if (-not $psql) { throw 'No se encontró psql.exe después de instalar PostgreSQL. Cierre esta ventana y vuelva a ejecutarla.' }
  $psqlPath = if ($psql.Source) { $psql.Source } else { $psql.FullName }
  $psqlVersionTexto = (& $psqlPath --version).Trim()
  Exigir-Exito 'Verificación de PostgreSQL'
  $versionEncontrada = [regex]::Match($psqlVersionTexto, '\d+(?:\.\d+)+').Value
  if (-not $versionEncontrada -or [int]($versionEncontrada.Split('.')[0]) -lt 17) {
    throw "Se encontró $psqlVersionTexto. Se necesita PostgreSQL 17 o superior. Actualice PostgreSQL conservando sus bases y vuelva a ejecutar el instalador."
  }

  $dbHost = (Read-Host 'Host PostgreSQL [localhost]').Trim()
  if (-not $dbHost) { $dbHost = 'localhost' }
  if ($dbHost -notin @('localhost', '127.0.0.1', '::1')) { throw 'El instalador solo permite PostgreSQL local.' }
  if ($postgresAutomatico) {
    $dbPort = '5432'
    $pgIsReadyPath = Join-Path (Split-Path -Parent $psqlPath) 'pg_isready.exe'
    Esperar-PostgreSQL $pgIsReadyPath $dbPort
  } else {
    $dbPort = (Read-Host 'Puerto PostgreSQL [5432]').Trim()
  }
  if (-not $dbPort) { $dbPort = '5432' }
  if ($dbPort -notmatch '^\d{1,5}$' -or [int]$dbPort -lt 1 -or [int]$dbPort -gt 65535) { throw 'El puerto PostgreSQL no es válido.' }
  $dbName = (Read-Host 'Nombre de la base de datos [clinica_veterinaria_udes]').Trim()
  if (-not $dbName) { $dbName = 'clinica_veterinaria_udes' }
  if ($dbName -notmatch '^[A-Za-z0-9_]+$') { throw 'El nombre de la base solo puede contener letras, números y guion bajo.' }
  if ($postgresAutomatico) {
    $dbUser = 'postgres'
    $dbPassword = Convertir-Secreto (Read-Host 'Defina una contraseña nueva para PostgreSQL en este computador' -AsSecureString)
    if (-not $dbPassword) { throw 'La contraseña nueva de PostgreSQL es obligatoria.' }
    $confirmacionDbPassword = Convertir-Secreto (Read-Host 'Confirme la contraseña nueva de PostgreSQL' -AsSecureString)
    if ($dbPassword -cne $confirmacionDbPassword) { throw 'Las contraseñas de PostgreSQL no coinciden.' }

    # La sentencia va en un archivo temporal UTF-8: por tubería, Windows
    # PowerShell 5.1 la enviaría en ASCII y dañaría tildes o eñes de la clave.
    $env:PGPASSWORD = $clavePostgresTemporal
    $archivoCambioClave = Join-Path $env:TEMP ("citas-udes-" + [guid]::NewGuid().ToString('N') + '.sql')
    try {
      $sqlCambioClave = "SET client_encoding = 'UTF8';`nALTER ROLE postgres WITH PASSWORD $(Valor-Sql $dbPassword);"
      [IO.File]::WriteAllText($archivoCambioClave, $sqlCambioClave, [Text.UTF8Encoding]::new($false))
      & $psqlPath -h localhost -p $dbPort -U postgres -d postgres -v ON_ERROR_STOP=1 -f $archivoCambioClave
      Exigir-Exito 'Cambio de la contraseña inicial de PostgreSQL'
    } finally {
      Remove-Item -LiteralPath $archivoCambioClave -Force -ErrorAction SilentlyContinue
      Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
      $clavePostgresTemporal = $null
    }
  } else {
    $dbUser = (Read-Host 'Usuario PostgreSQL [postgres]').Trim()
    if (-not $dbUser) { $dbUser = 'postgres' }
    $dbPassword = Convertir-Secreto (Read-Host 'Contraseña de PostgreSQL' -AsSecureString)
  }
  if (-not $dbPassword) { throw 'La contraseña de PostgreSQL es obligatoria.' }

  $smtpUser = (Read-Host 'Correo SMTP (opcional; Enter para omitir)').Trim()
  $smtpPassword = ''
  if ($smtpUser) { $smtpPassword = Convertir-Secreto (Read-Host 'Contraseña de aplicación SMTP' -AsSecureString) }
  $jwt = (& node -e "process.stdout.write(require('crypto').randomBytes(48).toString('hex'))").Trim()
  Exigir-Exito 'Generación de la clave de sesión'

  $envContent = @(
    'PORT=4000',
    'TZ=America/Bogota',
    "DB_HOST=$(Valor-DotEnv $dbHost)",
    "DB_PORT=$(Valor-DotEnv $dbPort)",
    "DB_NAME=$(Valor-DotEnv $dbName)",
    "DB_USER=$(Valor-DotEnv $dbUser)",
    "DB_PASSWORD=$(Valor-DotEnv $dbPassword)",
    "JWT_SECRET=$(Valor-DotEnv $jwt)",
    'JWT_EXPIRACION=8h',
    'SMTP_HOST=smtp.gmail.com',
    'SMTP_PORT=465',
    "SMTP_USER=$(Valor-DotEnv $smtpUser)",
    "SMTP_APP_PASSWORD=$(Valor-DotEnv $smtpPassword)",
    'SMTP_FROM_NAME=Clínica Veterinaria UDES'
  ) -join "`r`n"
  [IO.File]::WriteAllText($envPath, $envContent + "`r`n", [Text.UTF8Encoding]::new($false))
  # Si algo falla más adelante, el catch borra este .env para poder reintentar.
  $envCreadoAhora = $true

  $env:PGPASSWORD = $dbPassword
  try {
    # Sin filas, psql no imprime nada; -join '' convierte ese $null en texto vacío.
    $baseExistente = ((& $psqlPath -h $dbHost -p $dbPort -U $dbUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$dbName'") -join '').Trim()
    Exigir-Exito 'Conexión con PostgreSQL'
    if (-not $baseExistente) {
      & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE `"$dbName`""
      Exigir-Exito 'Creación de la base de datos'
    } else {
      $tablas = ((& $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'") -join '').Trim()
      Exigir-Exito 'Inspección de la base de datos existente'
      if ([int]$tablas -gt 0) { throw 'La base de datos ya contiene tablas. El instalador no modifica bases existentes; consulte docs/instalacion.md para aplicar migraciones.' }
    }
    & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -f (Join-Path $productoRoot 'database\esquema.sql')
    Exigir-Exito 'Creación del esquema'
    & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -f (Join-Path $productoRoot 'database\datos_iniciales.sql')
    Exigir-Exito 'Carga de catálogos iniciales'
  } finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  }

  Push-Location $backendPath
  try {
    & $npm.Source ci
    Exigir-Exito 'Instalación de dependencias del servidor'
    & $npm.Source run demo:usuarios-evaluacion
    Exigir-Exito 'Creación de cuentas ficticias de evaluación'
  } finally { Pop-Location }

  Push-Location $frontendPath
  try {
    & $npm.Source ci
    Exigir-Exito 'Instalación de dependencias de la interfaz'
    & $npm.Source run build
    Exigir-Exito 'Compilación de la interfaz'
  } finally { Pop-Location }

  $acceso = Join-Path $PSScriptRoot 'Abrir-CitasUDES.bat'
  $escritorio = [Environment]::GetFolderPath('Desktop')
  $accesoDirecto = Join-Path $escritorio 'Citas Veterinaria UDES.lnk'
  $shell = New-Object -ComObject WScript.Shell
  $lnk = $shell.CreateShortcut($accesoDirecto)
  $lnk.TargetPath = $acceso
  $lnk.WorkingDirectory = $productoRoot
  $lnk.Description = 'Iniciar la plataforma local de citas de la Clínica Veterinaria UDES'
  $lnk.Save()

  Write-Host ''
  Write-Host 'Instalación finalizada. Abre el acceso directo «Citas Veterinaria UDES» del escritorio.' -ForegroundColor Green
  Write-Host 'Cuentas de evaluación local: clienteprueba@demo.udes.co, medicoprueba@demo.udes.co, adminprueba@demo.udes.co y superadminprueba@demo.udes.co; contraseña 1234.'
  if (-not $smtpUser) { Write-Warning 'No configuraste SMTP: el sistema abre, pero no enviará correos ni permitirá completar el registro público.' }
  Write-Host 'La configuración y las claves están en backend/.env; no compartas ni subas ese archivo.'
} catch {
  if ($envCreadoAhora) {
    Remove-Item -LiteralPath $envPath -Force -ErrorAction SilentlyContinue
    Write-Host 'Se retiró el backend/.env de este intento para que pueda volver a ejecutar el instalador.' -ForegroundColor Yellow
  }
  Write-Error $_.Exception.Message
  exit 1
} finally {
  $dbPassword = $null
  $smtpPassword = $null
  $jwt = $null
}
