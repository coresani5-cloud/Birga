@echo off
rem Buyruqlar uchun qisqa yo'l:  zavod.bat new sobir_osh  |  zavod.bat build --send  |  zavod.bat check
chcp 65001 >nul
cd /d "%~dp0"
set PYTHONUTF8=1
".venv\Scripts\python.exe" -m zavod %*
