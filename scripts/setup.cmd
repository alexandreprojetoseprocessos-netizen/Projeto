@echo off
setlocal

echo ==^> Verificando instala^cao do Node.js
node -v >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao foi encontrado. Instale a versao 20 ou superior antes de continuar.
  exit /b 1
)

if not exist ".env" (
  echo [ERRO] Arquivo .env nao encontrado. Copie .env.example para .env e configure antes de executar.
  exit /b 1
)

echo ==^> Carregando variaveis de ambiente do .env
for /f "usebackq tokens=1* delims==" %%A in (`powershell -NoProfile -NonInteractive -Command ^
  "(Get-Content '.env' | Where-Object { $_ -and -not $_.StartsWith('#') } | ForEach-Object { $_.Trim() })"`) do (
  if not "%%~A"=="" (
    set "%%~A=%%~B"
  )
)

if "%DATABASE_URL%"=="" (
  if not "%SUPABASE_DB_USER%"=="" (
    set "DATABASE_URL=postgresql://%SUPABASE_DB_USER%:%SUPABASE_DB_PASSWORD%@%SUPABASE_DB_HOST%:%SUPABASE_DB_PORT%/%SUPABASE_DB_NAME%"
  ) else (
    echo [ERRO] Variavel DATABASE_URL nao definida no .env.
    exit /b 1
  )
)

echo ==^> Instalando dependencias NPM
call npm install
if errorlevel 1 goto :error

if exist "node_modules\.prisma\client" (
  echo ==^> Limpando client Prisma anterior
  rmdir /s /q "node_modules\.prisma\client"
)

echo ==^> Gerando Prisma Client
call npm --workspace apps/database run generate
if errorlevel 1 goto :error

echo ==^> Executando migrations de desenvolvimento
call npm --workspace apps/database run migrate:dev -- --name init
if errorlevel 1 goto :error

echo ==^> Compilando pacote @gestao/database
call npm --workspace apps/database run build
if errorlevel 1 goto :error

echo.
echo Setup concluido com sucesso!
exit /b 0

:error
echo.
echo Houve uma falha durante a execucao. Reveja as mensagens acima.
exit /b 1
