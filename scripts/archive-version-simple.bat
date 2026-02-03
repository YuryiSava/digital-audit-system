@echo off
set "SOURCE=d:\digital-audit-system"
set "DEST=d:\digital-audit-system\backups\release_v0.5.4_snapshot"
set "TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "ARCHIVE_NAME=DAS_v0.5.4_Source_Only_%TIMESTAMP%.zip"

echo ==========================================
echo Creating Source Code Snapshot v0.5.4
echo ==========================================

if not exist "%DEST%" mkdir "%DEST%"

echo [1/2] Archiving source files...
echo Excluding node_modules, .next, .git
echo.

powershell Compress-Archive -Path "%SOURCE%\app", "%SOURCE%\components", "%SOURCE%\lib", "%SOURCE%\public", "%SOURCE%\scripts", "%SOURCE%\supabase", "%SOURCE%\*.json", "%SOURCE%\*.js", "%SOURCE%\*.ts", "%SOURCE%\*.md", "%SOURCE%\*.css", "%SOURCE%\.env*" -DestinationPath "%DEST%\%ARCHIVE_NAME%" -Force

echo.
echo [2/2] Verify...
if exist "%DEST%\%ARCHIVE_NAME%" (
    echo [SUCCESS] Archive created successfully!
    echo Location: %DEST%\%ARCHIVE_NAME%
    
    for %%A in ("%DEST%\%ARCHIVE_NAME%") do echo Size: %%~zA bytes
) else (
    echo [ERROR] Archive creation failed!
)

pause
