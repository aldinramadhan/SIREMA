import { useState, useMemo } from 'react';
import {
  History, FileSpreadsheet, Users, RefreshCw, SkipForward,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Trash2,
  Filter, Search, Download,
} from 'lucide-react';
import { ImportLog } from '../types';
import * as XLSX from 'xlsx';

interface ImportLogPageProps {
  logs: ImportLog[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const TIPE_ICON = {
  Mahasiswa: Users,
  Retensi: FileSpreadsheet,
};

const TIPE_COLOR = {
  Mahasiswa: 'bg-blue-100 text-blue-700',
  Retensi: 'bg-purple-100 text-purple-700',
};

const MODE_BADGE = {
  lewati: { label: 'Lewati Duplikat', cls: 'bg-yellow-100 text-yellow-700', icon: SkipForward },
  update: { label: 'Update jika Ada', cls: 'bg-orange-100 text-orange-700', icon: RefreshCw },
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function exportLogsToExcel(logs: ImportLog[]) {
  const wb = XLSX.utils.book_new();
  const rows = logs.map((l, i) => ({
    'No.': i + 1,
    'Tanggal': formatDateTime(l.tanggal),
    'Tipe': l.tipe,
    'Operator': l.operator,
    'Nama File': l.namaFile,
    'Mode': l.mode === 'lewati' ? 'Lewati Duplikat' : 'Update jika Ada',
    'Ditambah': l.jumlahDiimpor,
    'Diperbarui': l.jumlahDiupdate,
    'Dilewati': l.jumlahDilewati,
    'Error': l.jumlahError,
    'Total Diproses': l.jumlahDiimpor + l.jumlahDiupdate + l.jumlahDilewati + l.jumlahError,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 20 },
    { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Log Import');
  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Log_Import_SIREMA_${timestamp}.xlsx`);
}

export function ImportLogPage({ logs, onDelete, onClearAll }: ImportLogPageProps) {
  const [search, setSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState<'Semua' | 'Mahasiswa' | 'Retensi'>('Semua');
  const [filterMode, setFilterMode] = useState<'Semua' | 'lewati' | 'update'>('Semua');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    return logs
      .filter((l) => {
        if (filterTipe !== 'Semua' && l.tipe !== filterTipe) return false;
        if (filterMode !== 'Semua' && l.mode !== filterMode) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            l.namaFile.toLowerCase().includes(q) ||
            l.operator.toLowerCase().includes(q) ||
            l.tipe.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [logs, search, filterTipe, filterMode]);

  // Aggregate stats
  const totalDitambah = filtered.reduce((s, l) => s + l.jumlahDiimpor, 0);
  const totalDiperbarui = filtered.reduce((s, l) => s + l.jumlahDiupdate, 0);
  const totalDilewati = filtered.reduce((s, l) => s + l.jumlahDilewati, 0);
  const totalError = filtered.reduce((s, l) => s + l.jumlahError, 0);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Log Riwayat Import
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Rekam jejak semua aktivitas import data ke sistem SIREMA
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {filtered.length > 0 && (
            <button
              onClick={() => exportLogsToExcel(filtered)}
              className="flex items-center gap-2 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Log
            </button>
          )}
          {logs.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-2 border border-red-200 bg-white rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* Aggregate stats */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Sesi Import', value: filtered.length, cls: 'bg-blue-50', val: 'text-blue-800', lbl: 'text-blue-500' },
            { label: 'Total Ditambah', value: totalDitambah, cls: 'bg-green-50', val: 'text-green-800', lbl: 'text-green-500' },
            { label: 'Total Diperbarui', value: totalDiperbarui, cls: 'bg-orange-50', val: 'text-orange-800', lbl: 'text-orange-500' },
            { label: 'Total Error', value: totalError, cls: 'bg-red-50', val: 'text-red-800', lbl: 'text-red-500' },
          ].map((s) => (
            <div key={s.label} className={`${s.cls} rounded-xl p-4`}>
              <p className={`text-xs ${s.lbl}`}>{s.label}</p>
              <p className={`mt-1 ${s.val}`} style={{ fontSize: '1.6rem', fontWeight: 700 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama file atau operator…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterTipe}
            onChange={(e) => setFilterTipe(e.target.value as any)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua">Semua Tipe</option>
            <option value="Mahasiswa">Mahasiswa</option>
            <option value="Retensi">Retensi</option>
          </select>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua">Semua Mode</option>
            <option value="lewati">Lewati Duplikat</option>
            <option value="update">Update jika Ada</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500">Belum ada riwayat import</p>
          <p className="text-gray-400 text-sm mt-1">
            Setiap kali melakukan import data, aktivitasnya akan tercatat di sini.
          </p>
        </div>
      )}

      {filtered.length === 0 && logs.length > 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <Filter className="w-8 h-8 text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">Tidak ada log yang sesuai filter.</p>
        </div>
      )}

      {/* Log list */}
      <div className="space-y-3">
        {filtered.map((log) => {
          const Icon = TIPE_ICON[log.tipe];
          const modeBadge = MODE_BADGE[log.mode];
          const ModeIcon = modeBadge.icon;
          const isExpanded = expandedId === log.id;
          const total = log.jumlahDiimpor + log.jumlahDiupdate + log.jumlahDilewati + log.jumlahError;

          return (
            <div
              key={log.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
            >
              {/* Main row */}
              <div className="flex items-center gap-3 p-4">
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${TIPE_COLOR[log.tipe]}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TIPE_COLOR[log.tipe]}`} style={{ fontWeight: 500 }}>
                      {log.tipe}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${modeBadge.cls}`}>
                      <ModeIcon className="w-2.5 h-2.5" />
                      {modeBadge.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mt-0.5 truncate" style={{ fontWeight: 500 }}>
                    {log.namaFile}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {log.operator} · {formatDateTime(log.tanggal)}
                  </p>
                </div>

                {/* Stats summary */}
                <div className="hidden sm:flex items-center gap-3 text-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="text-green-700" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{log.jumlahDiimpor}</span>
                    <span className="text-xs text-gray-400">Tambah</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-orange-600" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{log.jumlahDiupdate}</span>
                    <span className="text-xs text-gray-400">Update</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-yellow-600" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{log.jumlahDilewati}</span>
                    <span className="text-xs text-gray-400">Lewati</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-red-600" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{log.jumlahError}</span>
                    <span className="text-xs text-gray-400">Error</span>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div className="flex flex-col items-center">
                    <span className="text-gray-700" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{total}</span>
                    <span className="text-xs text-gray-400">Total</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                    title="Detail"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => onDelete(log.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Hapus log ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Nama File</p>
                      <p className="text-sm text-gray-700 mt-0.5 break-all">{log.namaFile}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Diimport Oleh</p>
                      <p className="text-sm text-gray-700 mt-0.5">{log.operator}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Waktu Import</p>
                      <p className="text-sm text-gray-700 mt-0.5">{formatDateTime(log.tanggal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Tipe Data</p>
                      <p className="text-sm text-gray-700 mt-0.5">{log.tipe}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Mode Duplikat</p>
                      <p className="text-sm text-gray-700 mt-0.5">{modeBadge.label}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Baris Diproses</p>
                      <p className="text-sm text-gray-700 mt-0.5">{total} baris</p>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="mt-4 space-y-2">
                    {[
                      { label: 'Berhasil Ditambah', val: log.jumlahDiimpor, color: 'bg-green-500', textColor: 'text-green-700' },
                      { label: 'Berhasil Diperbarui', val: log.jumlahDiupdate, color: 'bg-orange-400', textColor: 'text-orange-700' },
                      { label: 'Dilewati (duplikat)', val: log.jumlahDilewati, color: 'bg-yellow-400', textColor: 'text-yellow-700' },
                      { label: 'Gagal (error)', val: log.jumlahError, color: 'bg-red-400', textColor: 'text-red-700' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <p className="text-xs text-gray-500 w-36 flex-shrink-0">{item.label}</p>
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.color} transition-all`}
                            style={{ width: total > 0 ? `${(item.val / total) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className={`text-xs w-8 text-right ${item.textColor}`} style={{ fontWeight: 600 }}>
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Success rate */}
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs text-gray-500">
                      Tingkat keberhasilan:{' '}
                      <span className="text-green-600" style={{ fontWeight: 600 }}>
                        {total > 0 ? (((log.jumlahDiimpor + log.jumlahDiupdate) / total) * 100).toFixed(1) : 0}%
                      </span>
                      {log.jumlahError > 0 && (
                        <span className="text-red-500 ml-2">
                          · <AlertCircle className="w-3 h-3 inline" /> {log.jumlahError} baris tidak dapat diimpor karena error validasi
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Clear all confirm */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-gray-900">Hapus Semua Log?</h3>
              <p className="text-gray-500 text-sm mt-1">
                Seluruh <strong>{logs.length}</strong> riwayat import akan dihapus permanen dan tidak bisa dikembalikan.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmClear(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={() => { onClearAll(); setConfirmClear(false); }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm transition-colors"
              >
                Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
