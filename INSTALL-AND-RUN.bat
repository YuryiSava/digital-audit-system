@echo off
title Digital Audit System - Installer & Runner
color 0b

echo ===================================================
echo    DIGITAL AUDIT SYSTEM - АВТОМАТИЧЕСКИЙ ЗАПУСК
echo ===================================================
echo.

:: 1. Проверка Node.js
echo [1/3] Проверка окружения...
node -v >node_ver.txt 2>&1
if %errorlevel% neq 0 (
    color 0c
    echo ОШИБКА: Node.js не установлен!
    echo Пожалуйста, установите Node.js с сайта https://nodejs.org/
    echo Рекомендуемая версия: 18 или 20 LTS.
    del node_ver.txt
    pause
    exit /b
)
set /p NODE_VERSION=<node_ver.txt
echo OK: Найдена версия %NODE_VERSION%
del node_ver.txt

:: 2. Установка зависимостей (только если папки нет)
if not exist "node_modules\" (
    echo.
    echo [2/3] Папка библиотек не найдена. Начинаю установку...
    echo Это может занять 2-3 минуты (зависит от интернета).
    call npm install
    if %errorlevel% neq 0 (
        color 0c
        echo ОШИБКА при установке библиотек! Проверьте интернет.
        pause
        exit /b
    )
    echo Библиотеки успешно установлены.
) else (
    echo [2/3] Библиотеки уже установлены. Пропускаю...
)

:: 3. Проверка .env файла
if not exist ".env" (
    color 0e
    echo ПРЕДУПРЕЖДЕНИЕ: Файл .env не найден!
    echo Программа может запуститься, но не подключится к базе и ИИ.
    echo Убедитесь, что вы скопировали .env файл.
    pause
)

:: 4. Запуск сервера
echo.
echo [3/3] Запуск программы...
echo ---------------------------------------------------
echo ПРИЛОЖЕНИЕ БУДЕТ ДОСТУПНО ПО АДРЕСУ:
echo http://localhost:3000
echo ---------------------------------------------------
echo.
npm run dev

pause
