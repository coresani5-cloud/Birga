@echo off
chcp 65001 >nul
rem Windows'ga kirganda zavod avtomatik ishga tushadi (Task Scheduler).
set TASK=AI_SARDORXOON zavodi
schtasks /Create /TN "%TASK%" /TR "\"%~dp0start.bat\"" /SC ONLOGON /RL LIMITED /F
if errorlevel 1 (
  echo.
  echo Xato. Bu faylni o'ng tugma bilan bosib "Run as administrator" ni tanlang.
) else (
  echo.
  echo Tayyor: "%TASK%" vazifasi yaratildi. Hozir ishga tushirilmoqda...
  schtasks /Run /TN "%TASK%"
)
pause
