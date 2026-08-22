@echo off
chcp 65001 >nul
title SocialApp Admin - One-Click Publish
echo ============================================
echo   SocialApp Admin - One-Click Publish
echo ============================================
node "%~dp0sync-publish.js"
echo.
pause