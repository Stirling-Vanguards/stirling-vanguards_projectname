@echo off
REM Vanguard Atlas local server. Browsers block ES modules on file://, so use this.
cd /d "%~dp0"
start "" http://localhost:8000/index.html
where py >nul 2>nul && (py -m http.server 8000 & goto :eof)
python -m http.server 8000
