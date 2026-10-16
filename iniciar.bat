@echo off
cd /d "%~dp0"
echo Painel do restaurante: http://127.0.0.1:4173/admin.html
echo Cardapio do cliente: http://127.0.0.1:4173/
echo Mantenha esta janela aberta. Para encerrar, pressione Ctrl+C.
start "" "http://127.0.0.1:4173/admin.html"
python -m http.server 4173 --bind 127.0.0.1
if errorlevel 1 pause
