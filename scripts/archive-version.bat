@echo off
set "SOURCE=d:\digital-audit-system"
set "DEST=d:\digital-audit-system\backups\release_v0.5.4_snapshot"
set "TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "ARCHIVE_NAME=DAS_v0.5.4_Full_Source_%TIMESTAMP%.zip"

echo ==========================================
echo Creating Full Source Code Snapshot v0.5.4
echo ==========================================

if not exist "%DEST%" mkdir "%DEST%"

echo [1/3] Dumping database schema...
call npx supabase db dump --local > "%SOURCE%\supabase\migrations\20260202_full_schema_v0.5.4.sql"

echo [2/3] Archiving source files...
powershell Compress-Archive -Path "%SOURCE%\app", "%SOURCE%\components", "%SOURCE%\lib", "%SOURCE%\public", "%SOURCE%\scripts", "%SOURCE%\supabase", "%SOURCE%\types", "%SOURCE%\*.json", "%SOURCE%\*.js", "%SOURCE%\*.ts", "%SOURCE%\*.md", "%SOURCE%\*.css", "%SOURCE%\.env*" -DestinationPath "%DEST%\%ARCHIVE_NAME%" -Force

echo [3/3] Verify...
if exist "%DEST%\%ARCHIVE_NAME%" (
    echo [SUCCESS] Archive created:
    echo %DEST%\%ARCHIVE_NAME%
) else (
    echo [ERROR] Archive creation failed
)

pause
