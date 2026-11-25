@echo off
chcp 65001 >nul
title AI_SARDORXOON video zavodi
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo [1/2] Birinchi ishga tushirish: virtual muhit yaratilmoqda...
  py -3 -m venv .venv || python -m venv .venv
  if not exist ".venv\Scripts\python.exe" (
    echo Python topilmadi. README.md dagi 1-qadamni bajaring.
    pause
    exit /b 1
  )
  echo [2/2] Kutubxonalar o'rnatilmoqda...
  ".venv\Scripts\python.exe" -m pip install --upgrade pip
  ".venv\Scripts\python.exe" -m pip install -r requirements.txt
)

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo .env fayli yaratildi. Notepad'da kalitlarni kiriting, saqlang va start.bat ni qayta ishga tushiring.
  notepad ".env"
  pause
  exit /b 1
)

set PYTHONUTF8=1
:loop
".venv\Scripts\python.exe" -m zavod run
echo.
echo Zavod to'xtadi. 15 soniyadan keyin qayta ishga tushadi (chiqish uchun oynani yoping)...
timeout /t 15 >nul
goto loop
