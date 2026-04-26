@echo off
chcp 65001 >nul
echo ========================================
echo   六合彩下注管理系统
echo ========================================
echo.
echo 正在启动系统...
echo.
echo 主程序: index.html
echo 测试程序: test.html
echo.
echo 请在浏览器中打开以下文件:
echo   1. 双击 index.html 使用完整系统
echo   2. 双击 test.html 测试解析功能
echo.
echo ========================================
start "" "%~dp0index.html"
timeout /t 2 /nobreak >nul
start "" "%~dp0test.html"
echo.
echo 已启动浏览器,祝您使用愉快!
echo.
pause
