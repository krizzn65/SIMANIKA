@echo off
setlocal
title SIMANIKA Development Server (Frontend + Backend)
for %%P in (php.exe) do set "SIMANIKA_PHP=%%~$PATH:P"
if not defined SIMANIKA_PHP (
  echo PHP tidak ditemukan di PATH.
  exit /b 1
)
for %%P in ("%SIMANIKA_PHP%") do set "SIMANIKA_EXT=%%~dpPext"
set "PHPRC=%TEMP%\simanika-php"
if not exist "%PHPRC%" mkdir "%PHPRC%"
(
  echo extension_dir="%SIMANIKA_EXT%"
  echo extension=mbstring
  echo extension=openssl
  echo extension=pdo_pgsql
  echo extension=pdo_sqlite
  echo extension=pgsql
  echo extension=fileinfo
  echo extension=intl
  echo extension=curl
  echo extension=zip
) > "%PHPRC%\php.ini"
echo ========================================================
echo   Starting SIMANIKA Fullstack (Next.js + Laravel)...
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000
echo ========================================================
echo.
npm run dev
endlocal
