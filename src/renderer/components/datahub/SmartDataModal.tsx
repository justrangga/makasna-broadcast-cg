import React, { useState } from 'react';
import { useCGStore } from '@/store/useCGStore';
import {
  X,
  Table,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface SmartDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartDataModal: React.FC<SmartDataModalProps> = ({ isOpen, onClose }) => {
  const {
    project,
    updateDataset,
    addDatasetRow,
    updateDatasetCell,
    deleteDatasetRow,
  } = useCGStore();

  const [activeDatasetId, setActiveDatasetId] = useState<string>(
    project.datasets[0]?.id || ''
  );
  const [newColumnName, setNewColumnName] = useState<string>('');

  if (!isOpen) return null;

  const dataset = project.datasets.find((d) => d.id === activeDatasetId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dataset) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);

      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        updateDataset(dataset.id, {
          headers,
          rows: data,
          sourceType: file.name.endsWith('.csv') ? 'csv' : 'xlsx',
          sourcePath: file.name,
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim() || !dataset) return;
    if (dataset.headers.includes(newColumnName.trim())) return;

    const updatedHeaders = [...dataset.headers, newColumnName.trim()];
    const updatedRows = dataset.rows.map((row) => ({
      ...row,
      [newColumnName.trim()]: '',
    }));

    updateDataset(dataset.id, {
      headers: updatedHeaders,
      rows: updatedRows,
    });
    setNewColumnName('');
  };

  const handleAddRow = () => {
    if (!dataset) return;
    const emptyRow: Record<string, string | number> = {};
    dataset.headers.forEach((h) => {
      emptyRow[h] = '';
    });
    addDatasetRow(dataset.id, emptyRow);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8 select-none">
      <div className="w-full max-w-5xl h-[85vh] bg-studio-900 border border-studio-750 rounded-xl shadow-2xl flex flex-col overflow-hidden text-xs text-slate-300">
        {/* Header */}
        <div className="h-14 bg-studio-850 border-b border-studio-800 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-bold text-white text-sm">SMART DATA HUB & REPEATER ENGINE</h2>
              <p className="text-[11px] text-slate-400">
                Manajemen tabel data internal, sinkronisasi file Excel/CSV, dan pemetaan kolom
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-studio-750 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dataset Tabs & Action Bar */}
        <div className="p-4 bg-studio-850/50 border-b border-studio-800 flex items-center justify-between">
          {/* Dataset selector tabs */}
          <div className="flex items-center space-x-2">
            {project.datasets.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDatasetId(d.id)}
                className={`px-3 py-1.5 rounded-md font-semibold text-xs transition ${
                  activeDatasetId === d.id
                    ? 'bg-cyan-500 text-black shadow'
                    : 'bg-studio-800 text-slate-300 hover:bg-studio-750'
                }`}
              >
                {d.name} ({d.rows.length} rows)
              </button>
            ))}
          </div>

          {/* Import / Add Actions */}
          <div className="flex items-center space-x-3">
            {/* Excel / CSV File Input */}
            <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-studio-750 hover:bg-studio-700 text-cyan-300 border border-studio-600 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Excel / CSV</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleAddRow}
              className="flex items-center space-x-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Baris</span>
            </button>
          </div>
        </div>

        {/* Main Spreadsheet Grid */}
        <div className="flex-1 overflow-auto p-4 bg-studio-950">
          {dataset ? (
            <div className="min-w-full inline-block align-middle">
              <table className="min-w-full divide-y divide-studio-800 border border-studio-800">
                <thead>
                  <tr className="bg-studio-900">
                    <th className="w-12 px-3 py-2 text-left text-[11px] font-mono text-slate-500">
                      #
                    </th>
                    {dataset.headers.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-2 text-left text-[11px] font-mono font-bold text-cyan-300 border-l border-studio-800"
                      >
                        <div className="flex items-center justify-between">
                          <span>[{col}]</span>
                          <span className="text-[9px] text-slate-500 font-normal ml-2">
                            (Drag chip)
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="w-16 px-3 py-2 text-center text-[11px] text-slate-500 border-l border-studio-800">
                      DEL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-studio-800/80 bg-studio-900/40 font-mono">
                  {dataset.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-studio-850/60">
                      <td className="px-3 py-2 text-slate-500 text-[11px]">
                        {rowIndex + 1}
                      </td>
                      {dataset.headers.map((col) => (
                        <td
                          key={col}
                          className="px-2 py-1 border-l border-studio-800"
                        >
                          <input
                            type="text"
                            value={row[col] ?? ''}
                            onChange={(e) =>
                              updateDatasetCell(dataset.id, rowIndex, col, e.target.value)
                            }
                            className="w-full bg-transparent px-2 py-1 text-slate-100 rounded outline-none focus:bg-studio-950 focus:ring-1 focus:ring-cyan-400 font-sans text-xs"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center border-l border-studio-800">
                        <button
                          onClick={() => deleteDatasetRow(dataset.id, rowIndex)}
                          className="p-1 hover:text-rose-400 text-slate-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add Column Bar */}
              <div className="mt-4 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Nama kolom baru..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="bg-studio-900 border border-studio-750 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleAddColumn}
                  className="px-3 py-1.5 rounded bg-studio-750 hover:bg-studio-700 text-slate-200 text-xs font-semibold"
                >
                  + Tambah Kolom
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Pilih atau buat dataset.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 bg-studio-850 border-t border-studio-800 px-6 flex items-center justify-between text-xs text-slate-400">
          <span>
            {dataset ? `Sumber: ${dataset.sourceType.toUpperCase()} | Terakhir diupdate: ${new Date(dataset.lastUpdated || Date.now()).toLocaleTimeString()}` : ''}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
