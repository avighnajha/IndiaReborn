@echo off
node "%~dp0serve-game.cjs" --open
if errorlevel 1 pause
