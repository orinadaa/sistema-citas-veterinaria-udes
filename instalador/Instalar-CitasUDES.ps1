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

function Exigir-Exito([string] $operacion) {
  if ($LASTEXITCODE -ne 0) { throw "$operacion falló (código $LASTEXITCODE)." }
}

try {
  Write-Host 'Instalación local de la Plataforma de Citas UDES' -ForegroundColor Cyan
  if (Test-Path -LiteralPath $envPath) {
    throw 'Ya existe backend/.env. Se conserva para no sobrescribir claves ni credenciales. Revise docs/instalacion.md o renombre el archivo si desea volver a configurar.'
  }

  $node = Get-Command node -ErrorAction SilentlyContinue
  $npm = Get-Command npm -ErrorAction SilentlyContinue
  $psql = Get-Command psql -ErrorAction SilentlyContinue
  if (-not $node -or -not $npm) { throw 'Instale Node.js 20 o superior antes de ejecutar este instalador.' }
  if (-not $psql) { throw 'No se encontró psql. Instale PostgreSQL 17 o superior y agréguelo al PATH.' }
  $nodeVersion = [version]((& node -p 'process.versions.node').Trim())
  if ($nodeVersion.Major -lt 20) { throw "Node.js $nodeVersion no cumple el mínimo 20." }

  $dbHost = (Read-Host 'Host PostgreSQL [localhost]').Trim()
  if (-not $dbHost) { $dbHost = 'localhost' }
  if ($dbHost -notin @('localhost', '127.0.0.1', '::1')) { throw 'El instalador solo permite PostgreSQL local.' }
  $dbPort = (Read-Host 'Puerto PostgreSQL [5432]').Trim()
  if (-not $dbPort) { $dbPort = '5432' }
  if ($dbPort -notmatch '^\d{1,5}$' -or [int]$dbPort -lt 1 -or [int]$dbPort -gt 65535) { throw 'El puerto PostgreSQL no es válido.' }
  $dbName = (Read-Host 'Nombre de la base de datos [clinica_veterinaria_udes]').Trim()
  if (-not $dbName) { $dbName = 'clinica_veterinaria_udes' }
  if ($dbName -notmatch '^[A-Za-z0-9_]+$') { throw 'El nombre de la base solo puede contener letras, números y guion bajo.' }
  $dbUser = (Read-Host 'Usuario PostgreSQL [postgres]').Trim()
  if (-not $dbUser) { $dbUser = 'postgres' }
  $dbPassword = Convertir-Secreto (Read-Host 'Contraseña de PostgreSQL' -AsSecureString)
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

  $env:PGPASSWORD = $dbPassword
  try {
    $baseExistente = (& $psql.Source -h $dbHost -p $dbPort -U $dbUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$dbName'").Trim()
    Exigir-Exito 'Conexión con PostgreSQL'
    if (-not $baseExistente) {
      & $psql.Source -h $dbHost -p $dbPort -U $dbUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE `"$dbName`""
      Exigir-Exito 'Creación de la base de datos'
    } else {
      $tablas = (& $psql.Source -h $dbHost -p $dbPort -U $dbUser -d $dbName -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'").Trim()
      Exigir-Exito 'Inspección de la base de datos existente'
      if ([int]$tablas -gt 0) { throw 'La base de datos ya contiene tablas. El instalador no modifica bases existentes; consulte docs/instalacion.md para aplicar migraciones.' }
    }
    & $psql.Source -h $dbHost -p $dbPort -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -f (Join-Path $productoRoot 'database\esquema.sql')
    Exigir-Exito 'Creación del esquema'
    & $psql.Source -h $dbHost -p $dbPort -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -f (Join-Path $productoRoot 'database\datos_iniciales.sql')
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
  Write-Error $_.Exception.Message
  exit 1
} finally {
  $dbPassword = $null
  $smtpPassword = $null
  $jwt = $null
}
