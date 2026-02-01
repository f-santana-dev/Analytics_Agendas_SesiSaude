@echo off
title SERVIDOR DASHBOARD - NAO FECHE ESSA JANELA
color 0A

echo ===================================================
echo      INICIANDO SERVIDOR DO DASHBOARD
echo ===================================================
echo.
echo Para acessar de outros computadores, use o IP abaixo:
echo ---------------------------------------------------
ipconfig | findstr "IPv4"
echo ---------------------------------------------------
echo.
echo O link sera algo como: http://192.168.X.X:5173/
echo.
echo [AVISO] Se voce fechar esta janela, o site sai do ar.
echo Pode minimizar a janela.
echo.

cd dashboard-react
npm run dev:host