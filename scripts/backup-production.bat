@echo off
REM Production Database Backup Script for Windows
REM Backs up production Supabase database

SET BACKUP_DIR=backups\production
SET RETENTION_DAYS=30

REM Get Supabase credentials from .env.local
for /f "tokens=2 delims==" %%a in ('findstr "NEXT_PUBLIC_SUPABASE_URL" .env.local') do set SUPABASE_URL=%%a
for /f "tokens=2 delims==" %%a in ('findstr "SUPABASE_SERVICE_ROLE_KEY" .env.local') do set SERVICE_KEY=%%a

REM Extract database connection details from Supabase URL
REM Format: https://PROJECT_REF.supabase.co
for /f "tokens=1 delims=." %%a in ("%SUPABASE_URL:~8%") do set PROJECT_REF=%%a

SET DB_HOST=db.%PROJECT_REF%.supabase.co
SET DB_PORT=5432
SET DB_NAME=postgres
SET DB_USER=postgres

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
echo.

echo [1/5] Checking pg_dump availability...

REM Try with full path first  
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
    echo.
    echo Please install PostgreSQL client tools:
    echo https://www.postgresql.org/download/windows/
    echo.
    echo Or restart PowerShell for PATH to update.
    pause
    exit /b 1
)

echo [OK] pg_dump found
echo.

echo [2/5] Connecting to production database...
echo Host: %DB_HOST%

REM Set password environment variable
SET PGPASSWORD=%SERVICE_KEY%

REM Create backup using pg_dump
%PG_DUMP% -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --no-owner --no-acl -F p -f "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo [OK] Backup created successfully!
    echo File: %BACKUP_FILE%
    
    echo.
    echo [3/5] Compressing backup...
    powershell Compress-Archive -Path "%BACKUP_FILE%" -DestinationPath "%BACKUP_FILE%.zip" -Force
    
    if exist "%BACKUP_FILE%.zip" (
        echo [OK] Compressed to: %BACKUP_FILE%.zip
        
        REM Get file sizes
        for %%A in ("%BACKUP_FILE%") do set SIZE_SQL=%%~zA
        for %%A in ("%BACKUP_FILE%.zip") do set SIZE_ZIP=%%~zA
        
        echo Original: %SIZE_SQL% bytes
        echo Compressed: %SIZE_ZIP% bytes
        
        del "%BACKUP_FILE%"
    )
    
    echo.
    echo [4/5] Cleaning old backups (retention: %RETENTION_DAYS% days)...
    forfiles /P "%BACKUP_DIR%" /M backup_*.zip /D -%RETENTION_DAYS% /C "cmd /c del @path" 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [INFO] No old backups to clean
    ) else (
        echo [OK] Old backups cleaned
    )
    
    echo.
    echo [5/5] Counting backups...
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
    echo Possible issues:
    echo - Wrong database credentials
    echo - Network connection problem
    echo - Insufficient permissions
    echo.
    pause
    exit /b 1
)

REM Clear password
SET PGPASSWORD=

pause
