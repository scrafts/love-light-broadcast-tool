import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 850,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true, // 메뉴바 숨김 (깔끔한 UI)
        icon: path.join(__dirname, '../public/icon.png') // 아이콘 경로 (추후 추가 필요)
    });

    // 개발 모드와 프로덕션 모드 분기
    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
        // 개발 모드에서만 개발자 도구 열기
        // win.webContents.openDevTools(); 
    } else {
        // 빌드된 파일 로드
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
