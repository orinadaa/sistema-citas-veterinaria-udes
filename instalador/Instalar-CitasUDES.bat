@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Instalar-CitasUDES.ps1"
if errorlevel 1 pause
