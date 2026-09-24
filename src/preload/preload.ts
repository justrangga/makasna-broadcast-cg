import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  openSecondaryOutput: (displayId?: number) => ipcRenderer.invoke('open-secondary-output', displayId),
  closeSecondaryOutput: () => ipcRenderer.invoke('close-secondary-output'),
  watchSpreadsheetFile: (filePath: string) => ipcRenderer.invoke('watch-spreadsheet-file', filePath),
  onFileWatcherUpdated: (callback: (payload: any) => void) => {
    ipcRenderer.on('file-watcher-updated', (_event, value) => callback(value));
  },
  onSecondaryOutputClosed: (callback: () => void) => {
    ipcRenderer.on('secondary-output-closed', () => callback());
  },
});
