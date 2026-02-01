@echo off
echo ==========================================
echo      ATUALIZADOR DE DADOS DO DASHBOARD
echo ==========================================
echo.
echo 1. Lendo planilha Excel...
python convert_to_json.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha ao converter a planilha. Verifique se o arquivo Excel esta fechado.
    pause
    exit /b
)

echo.
echo 2. Movendo dados para o site...
move /Y dados.json dashboard-react\public\dados.json

echo.
echo ==========================================
echo      SUCESSO! DADOS ATUALIZADOS.
echo ==========================================
echo.
echo Pode atualizar a pagina do navegador (F5).
pause