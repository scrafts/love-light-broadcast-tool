import { app, BrowserWindow, Menu, dialog, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let isCheckingForUpdate = false;

const releaseUrl = 'https://github.com/scrafts/love-light-broadcast-tool/releases';

const showUpdateMessage = (type: 'info' | 'error', title: string, message: string) => {
    if (!mainWindow) return;

    dialog.showMessageBox(mainWindow, {
        type,
        title,
        message,
        buttons: ['확인'],
    });
};

const getUpdateErrorMessage = (error: Error) => {
    const message = error.message || String(error);

    if (message.includes('404') && message.includes('releases.atom')) {
        return [
            'GitHub 릴리즈 정보를 가져오지 못했습니다.',
            '',
            '현재 업데이트 저장소가 비공개(private)라서 설치된 프로그램이 인증 없이 릴리즈 정보를 읽을 수 없습니다.',
            '',
            '해결 방법:',
            '1. GitHub 저장소를 public으로 변경합니다.',
            '2. 또는 업데이트 배포용 public 저장소를 따로 만들고 publish 설정을 그 저장소로 바꿉니다.',
            '',
            '앱 안에 GitHub 토큰을 넣는 방식은 토큰 유출 위험이 있어 권장하지 않습니다.',
        ].join('\n');
    }

    if (message.includes('ERR_INTERNET_DISCONNECTED') || message.includes('ENOTFOUND')) {
        return '네트워크 연결을 확인한 뒤 다시 시도해주세요.';
    }

    return `업데이트 확인 중 오류가 발생했습니다.\n\n${message}`;
};

const manualUpdateCheck = () => {
    if (!app.isPackaged) {
        showUpdateMessage(
            'info',
            '업데이트 확인',
            '개발 실행 중에는 자동 업데이트를 확인할 수 없습니다. 배포된 프로그램에서는 GitHub Releases를 기준으로 업데이트를 확인합니다.'
        );
        return;
    }

    if (isCheckingForUpdate) {
        showUpdateMessage('info', '업데이트 확인', '이미 업데이트를 확인하고 있습니다.');
        return;
    }

    isCheckingForUpdate = true;
    autoUpdater.checkForUpdates().catch((error) => {
        const shouldShowError = isCheckingForUpdate;
        isCheckingForUpdate = false;
        if (shouldShowError) {
            showUpdateMessage('error', '업데이트 오류', getUpdateErrorMessage(error));
        }
    });
};

const createMenu = () => {
    const menu = Menu.buildFromTemplate([
        {
            label: '파일',
            submenu: [
                {
                    label: '업데이트 확인',
                    click: manualUpdateCheck,
                },
                {
                    label: 'GitHub 릴리즈 열기',
                    click: () => shell.openExternal(releaseUrl),
                },
                { type: 'separator' },
                {
                    label: '종료',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => app.quit(),
                },
            ],
        },
        {
            label: '편집',
            submenu: [
                { label: '실행 취소', role: 'undo' },
                { label: '다시 실행', role: 'redo' },
                { type: 'separator' },
                { label: '잘라내기', role: 'cut' },
                { label: '복사', role: 'copy' },
                { label: '붙여넣기', role: 'paste' },
                { label: '전체 선택', role: 'selectAll' },
            ],
        },
        {
            label: '보기',
            submenu: [
                { label: '확대', role: 'zoomIn' },
                { label: '축소', role: 'zoomOut' },
                { label: '실제 크기', role: 'resetZoom' },
                { type: 'separator' },
                { label: '새로고침', role: 'reload' },
            ],
        },
        {
            label: '도움말',
            submenu: [
                {
                    label: '현재 버전 보기',
                    click: () => showUpdateMessage('info', '버전 정보', `현재 버전: ${app.getVersion()}`),
                },
                {
                    label: 'GitHub 저장소 열기',
                    click: () => shell.openExternal('https://github.com/scrafts/love-light-broadcast-tool'),
                },
            ],
        },
    ]);

    Menu.setApplicationMenu(menu);
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 860,
        minWidth: 600,
        maxWidth: 600,
        minHeight: 720,
        resizable: false,
        maximizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: false,
        icon: path.join(__dirname, '../public/icon.png') // 아이콘 경로 (추후 추가 필요)
    });

    // 개발 모드와 프로덕션 모드 분기
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        // 개발 모드에서만 개발자 도구 열기
        // mainWindow.webContents.openDevTools(); 
    } else {
        // 빌드된 파일 로드
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createMenu();
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

autoUpdater.on('checking-for-update', () => {
    // Background checks should stay quiet. Manual checks set isCheckingForUpdate before calling autoUpdater.
});

autoUpdater.on('update-available', () => {
    if (isCheckingForUpdate) {
        showUpdateMessage('info', '업데이트 확인', '새 업데이트가 있습니다. 다운로드가 완료되면 설치 여부를 다시 묻겠습니다.');
    }
});

autoUpdater.on('update-not-available', () => {
    if (isCheckingForUpdate) {
        showUpdateMessage('info', '업데이트 확인', '현재 최신 버전을 사용하고 있습니다.');
    }
    isCheckingForUpdate = false;
});

autoUpdater.on('update-downloaded', (info) => {
    isCheckingForUpdate = false;
    if (!mainWindow) return;

    const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        title: '업데이트 준비 완료',
        message: `새 버전 ${info.version} 다운로드가 완료되었습니다.\n지금 설치하고 프로그램을 다시 시작할까요?`,
        buttons: ['지금 설치', '나중에'],
        defaultId: 0,
        cancelId: 1,
    });

    if (response === 0) {
        autoUpdater.quitAndInstall();
    }
});

autoUpdater.on('error', (error) => {
    if (isCheckingForUpdate) {
        showUpdateMessage('error', '업데이트 오류', getUpdateErrorMessage(error));
    }
    isCheckingForUpdate = false;
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
