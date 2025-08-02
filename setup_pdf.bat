@echo off
echo ====================================
echo Bohemika PDF Setup - Windows
echo ====================================
echo.

echo [1/3] Kontrola Python instalace...
py --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python nenalezen! Nainstalujte Python z https://python.org
    pause
    exit /b 1
)
echo ✅ Python nalezen

echo.
echo [2/3] Instalace Python závislostí...
cd /d "%~dp0scripts"
py -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Chyba při instalaci závislostí
    pause
    exit /b 1
)
echo ✅ Závislosti nainstalovány

echo.
echo [3/3] Test PDF skriptu...
py test_pdf_fill.py
if %errorlevel% neq 0 (
    echo ⚠️  Test skončil s varováním (pravděpodobně chybí PDF template)
    echo 📝 Nahrajte PDF šablonu do public/bohemika_template.pdf
) else (
    echo ✅ Test úspěšný!
)

echo.
echo ====================================
echo Setup dokončen!
echo ====================================
echo.
echo Zbývající kroky:
echo 1. Nahrát PDF template: public/bohemika_template.pdf
echo 2. Spustit dev server: npm run dev
echo 3. Otestovat Bohemika tab
echo.
pause
