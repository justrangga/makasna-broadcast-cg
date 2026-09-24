import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { OutputServer } from './output-server';
import { DeckLinkController } from './decklink-controller';
import { FSWatcher, watch } from 'chokidar';
import * as XLSX from 'xlsx';

// Optimize Chromium for 60fps Broadcast Graphics & Alpha Video Hardware Decoding
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-hardware-overlays', 'single-fullscreen,underlay');

let mainWindow: BrowserWindow | null = null;
let outputWindow: BrowserWindow | null = null;
let outputServer: OutputServer | null = null;
let fileWatcher: FSWatcher | null = null;
const decklinkController = new DeckLinkController();

const isDev = process.env.NODE_ENV === 'development';

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: '#090a0f',
    title: 'Makasna Broadcast CG Studio',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows local asset loading (png, webm)
    },
  });

  // Start internal broadcast server
  const distRendererPath = path.join(__dirname, '../renderer');
  outputServer = new OutputServer();
  await outputServer.start(distRendererPath, 4989);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(distRendererPath, 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (outputWindow) {
      outputWindow.close();
    }
  });
}

// Open secondary fullscreen transparent window (HDMI / DisplayPort output)
function openSecondaryOutputWindow(displayId?: number, testPattern: string = 'none') {
  if (outputWindow) {
    outputWindow.focus();
    return;
  }

  const displays = screen.getAllDisplays();
  // Target requested display if available, else second display, else primary
  const targetDisplay =
    (displayId !== undefined ? displays.find((d) => d.id === displayId) : displays[1]) || displays[0];

  outputWindow = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    fullscreen: true,
    hasShadow: false,
    skipTaskbar: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  outputWindow.setIgnoreMouseEvents(true);

  const queryParams = new URLSearchParams({
    output: 'pgm',
    pattern: testPattern,
  }).toString();

  const url = isDev
    ? `http://localhost:5173?${queryParams}`
    : `file://${path.join(__dirname, '../renderer/index.html')}?${queryParams}`;

  outputWindow.loadURL(url);

  outputWindow.on('closed', () => {
    outputWindow = null;
    if (mainWindow) {
      mainWindow.webContents.send('secondary-output-closed');
    }
  });
}

function closeSecondaryOutputWindow() {
  if (outputWindow) {
    outputWindow.close();
    outputWindow = null;
  }
}

// IPC Handlers
ipcMain.handle('get-displays', () => {
  return screen.getAllDisplays().map((d) => ({
    id: d.id,
    bounds: d.bounds,
    label: d.label || `Display ${d.id}`,
    isPrimary: d.id === screen.getPrimaryDisplay().id,
  }));
});

ipcMain.handle('open-secondary-output', (_event, displayId?: number, testPattern?: string) => {
  openSecondaryOutputWindow(displayId, testPattern);
  return true;
});

ipcMain.handle('close-secondary-output', () => {
  closeSecondaryOutputWindow();
  return true;
});

ipcMain.handle('get-decklink-devices', () => {
  return decklinkController.getDevices();
});

ipcMain.handle('start-decklink-output', (_event, config) => {
  return decklinkController.startOutput(config);
});

ipcMain.handle('stop-decklink-output', () => {
  return decklinkController.stopOutput();
});

ipcMain.handle('get-decklink-status', () => {
  return decklinkController.getStatus();
});

ipcMain.handle('watch-spreadsheet-file', (_event, filePath: string) => {
  if (fileWatcher) {
    fileWatcher.close();
  }

  fileWatcher = watch(filePath, { persistent: true });
  fileWatcher.on('change', () => {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      if (mainWindow) {
        mainWindow.webContents.send('file-watcher-updated', { filePath, data });
      }
    } catch (e) {
      console.error('File watch parse error', e);
    }
  });

  return true;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (outputServer) outputServer.stop();
  if (fileWatcher) fileWatcher.close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
