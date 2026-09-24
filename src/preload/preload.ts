import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  openSecondaryOutput: (displayId?: number, testPattern?: string) =>
    ipcRenderer.invoke('open-secondary-output', displayId, testPattern),
  closeSecondaryOutput: () => ipcRenderer.invoke('close-secondary-output'),
  getDeckLinkDevices: () => ipcRenderer.invoke('get-decklink-devices'),
  startDeckLinkOutput: (config: any) => ipcRenderer.invoke('start-decklink-output', config),
  stopDeckLinkOutput: () => ipcRenderer.invoke('stop-decklink-output'),
  getDeckLinkStatus: () => ipcRenderer.invoke('get-decklink-status'),
  watchSpreadsheetFile: (filePath: string) => ipcRenderer.invoke('watch-spreadsheet-file', filePath),
  onFileWatcherUpdated: (callback: (payload: any) => void) => {
    ipcRenderer.on('file-watcher-updated', (_event, value) => callback(value));
  },
  onSecondaryOutputClosed: (callback: () => void) => {
    ipcRenderer.on('secondary-output-closed', () => callback());
  },
});
