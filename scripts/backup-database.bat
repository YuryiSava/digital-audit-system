@echo off
REM Database Backup Script for Windows
REM Auto-backup Supabase database with retention policy

SET BACKUP_DIR=backups\database
SET RETENTION_DAYS=30

REM Create timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set DATETIME=%datetime:~0,8%_%datetime:~8,6%
set BACKUP_FILE=%BACKUP_DIR%\backup_%DATETIME%.sql

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo ======================================
echo Database Backup - Digital Audit System
echo ======================================
echo Date: %date% %time%
echo.

echo [1/4] Dumping database...
call npx supabase db dump --local > "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo [OK] Backup created successfully!
    echo File: %BACKUP_FILE%
    
    echo.
    echo [2/4] Compressing backup...
    REM Compress using PowerShell (built-in on Windows)
    powershell Compress-Archive -Path "%BACKUP_FILE%" -DestinationPath "%BACKUP_FILE%.zip" -Force
    
    if exist "%BACKUP_FILE%.zip" (
        echo [OK] Compressed to: %BACKUP_FILE%.zip
        del "%BACKUP_FILE%"
    )
    
    echo.
    echo [3/4] Cleaning old backups...
    REM Delete files older than RETENTION_DAYS
    forfiles /P "%BACKUP_DIR%" /M backup_*.zip /D -%RETENTION_DAYS% /C "cmd /c del @path" 2>nul
    
    echo.
    echo [4/4] Counting backups...
    dir /b "%BACKUP_DIR%\backup_*.zip" 2>nul | find /c /v "" > temp_count.txt
    set /p BACKUP_COUNT=<temp_count.txt
    del temp_count.txt
    echo Total backups: %BACKUP_COUNT%
    
    echo.
    echo ======================================
    echo Backup completed successfully!
    echo ======================================
) else (
    echo [ERROR] Backup failed!
    exit /b 1
)
