@echo off
REM Simple Production Database Backup Script
REM Requires: PostgreSQL Tools installed

SET BACKUP_DIR=backups\production
SET RETENTION_DAYS=30

REM Supabase connection details
SET PROJECT_REF=dvgnucppetrogunjqiti
SET DB_HOST=db.%PROJECT_REF%.supabase.co
SET DB_PORT=5432
SET DB_NAME=postgres
SET DB_USER=postgres

REM Password will be prompted or set via environment
REM Get from: Supabase Dashboard -> Settings -> Database -> Connection String

REM Create timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set DATETIME=%datetime:~0,8%_%datetime:~8,6%
set BACKUP_FILE=%BACKUP_DIR%\backup_%DATETIME%.sql

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo ======================================
echo Production Database Backup
echo Digital Audit System
echo ======================================
echo Date: %date% %time%
echo Project: %PROJECT_REF%
echo Host: %DB_HOST%
echo.

echo [1/5] Checking pg_dump availability...

REM Find pg_dump
SET PG_DUMP="C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
if not exist %PG_DUMP% (
    SET PG_DUMP="C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
)
if not exist %PG_DUMP% (
    SET PG_DUMP=pg_dump.exe
)

%PG_DUMP% --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] pg_dump not found!
    echo Please install PostgreSQL client tools.
    pause
    exit /b 1
)

echo [OK] pg_dump found
echo.

echo [2/5] Enter database password...
echo.
echo Get password from: Supabase Dashboard -^> Settings -^> Database
echo Look for "Connection pooling" or "Direct connection" password
echo.
set /p DB_PASSWORD="Database Password: "

if "%DB_PASSWORD%"=="" (
    echo [ERROR] Password required!
    pause
    exit /b 1
)

echo.
echo [3/5] Creating backup...

REM Set password environment variable
SET PGPASSWORD=%DB_PASSWORD%

REM Create backup
%PG_DUMP% -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --no-owner --no-acl -F p -f "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo [OK] Backup created!
    
    echo.
    echo [4/5] Compressing...
    powershell Compress-Archive -Path "%BACKUP_FILE%" -DestinationPath "%BACKUP_FILE%.zip" -Force
    
    if exist "%BACKUP_FILE%.zip" (
        echo [OK] Compressed: %BACKUP_FILE%.zip
        for %%A in ("%BACKUP_FILE%") do set SIZE_SQL=%%~zA
        for %%A in ("%BACKUP_FILE%.zip") do set SIZE_ZIP=%%~zA
        echo Size: %SIZE_SQL% bytes -^> %SIZE_ZIP% bytes
        del "%BACKUP_FILE%"
    )
    
    echo.
    echo [5/5] Cleaning old backups (retention: %RETENTION_DAYS% days)...
    forfiles /P "%BACKUP_DIR%" /M backup_*.zip /D -%RETENTION_DAYS% /C "cmd /c del @path" 2>nul
    
    dir /b "%BACKUP_DIR%\backup_*.zip" 2>nul | find /c /v "" > temp_count.txt
    set /p BACKUP_COUNT=<temp_count.txt
    del temp_count.txt
    echo Total backups: %BACKUP_COUNT%
    
    echo.
    echo ======================================
    echo Backup completed successfully!
    echo ======================================
    echo Location: %BACKUP_DIR%
    echo File: backup_%DATETIME%.sql.zip
    echo.
) else (
    echo [ERROR] Backup failed!
    echo.
    echo Common issues:
    echo - Wrong password
    echo - Network connection problem
    echo - Firewall blocking port 5432
    echo.
)

REM Clear password
SET PGPASSWORD=
SET DB_PASSWORD=

pause
