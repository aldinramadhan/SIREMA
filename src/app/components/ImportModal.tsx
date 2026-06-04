import { useState, useRef, useCallback } from 'react';
import {
  X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle,
  AlertTriangle, ChevronRight, RotateCcw, Info, RefreshCw, SkipForward,
} from 'lucide-react';
import {
  downloadMahasiswaTemplate, downloadRetensiTemplate,
  parseMahasiswaExcel, parseRetensiExcel,
  ParsedMahasiswaRow, ParsedRetensiRow,
} from '../utils/exportExcel';
import { Mahasiswa, RetensiRecord, ImportLog, ImportMode } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────
type ImportType = 'mahasiswa' | 'retensi';
type Step = 'upload' | 'preview' | 'done';

export interface ImportResult {
  toAdd: Mahasiswa[] | RetensiRecord[];
  toUpdate: Mahasiswa[] | RetensiRecord[];
  logData: Omit<ImportLog, 'id'>;
}

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  type: ImportType;
  mahasiswaList: Mahasiswa[];
  retensiList: RetensiRecord[];
  onImportMahasiswa?: (toAdd: Mahasiswa[], toUpdate: Mahasiswa[], logData: Omit<ImportLog, 'id'>) => void;
  onImportRetensi?: (toAdd: RetensiRecord[], toUpdate: RetensiRecord[], logData: Omit<ImportLog, 'id'>) => void;
  operatorName?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  Aktif: 'bg-green-500',
  'Mengundurkan Diri': 'bg-orange-500',
  'Tidak Ada Kabar': 'bg-yellow-500',
  'Batal Kuliah': 'bg-red-500',
};

// ── Component ─────────────────────────────────────────────────────────────────
export function ImportModal({
  open, onClose, type,
  mahasiswaList, retensiList,
  onImportMahasiswa, onImportRetensi,
  operatorName = 'Admin BAK',
}: ImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dupMode, setDupMode] = useState<ImportMode>('lewati');

  const [mhsRows, setMhsRows] = useState<ParsedMahasiswaRow[]>([]);
  const [retensiRows, setRetensiRows] = useState<ParsedRetensiRow[]>([]);
  const [importStats, setImportStats] = useState<{
    imported: number; updated: number; skipped: number; errors: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setFile(null);
    setParseError(null);
    setMhsRows([]);
    setRetensiRows([]);
    setImportStats(null);
    setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  // ── File handling ─────────────────────────────────────────────────────────
  const processFile = useCallback(async (f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setParseError('Format file tidak didukung. Gunakan file .xlsx atau .xls');
      return;
    }
    setFile(f);
    setParseError(null);
    setLoading(true);
    try {
      if (type === 'mahasiswa') {
        const rows = await parseMahasiswaExcel(f);
        if (rows.length === 0) { setParseError('File tidak mengandung data.'); setLoading(false); return; }
        setMhsRows(rows);
      } else {
        const rows = await parseRetensiExcel(f);
        if (rows.length === 0) { setParseError('File tidak mengandung data.'); setLoading(false); return; }
        setRetensiRows(rows);
      }
      setStep('preview');
    } catch {
      setParseError('Gagal membaca file. Pastikan format file sesuai dengan template.');
    }
    setLoading(false);
  }, [type]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = '';
  };

  // ── Lookup maps ───────────────────────────────────────────────────────────
  const nimToMhs = new Map(mahasiswaList.map((m) => [m.nim, m]));
  const retensiKeyToRecord = new Map(
    retensiList.map((r) => {
      const mhs = mahasiswaList.find((m) => m.id === r.mahasiswaId);
      return [`${mhs?.nim}|${r.periode}|${r.tahunAkademik}`, r];
    })
  );

  // ── Import logic ──────────────────────────────────────────────────────────
  const handleImport = () => {
    let imported = 0, updated = 0, skipped = 0, errors = 0;

    if (type === 'mahasiswa' && onImportMahasiswa) {
      const toAdd: Mahasiswa[] = [];
      const toUpdate: Mahasiswa[] = [];

      for (const row of mhsRows) {
        if (row.errors.length > 0) { errors++; continue; }
        const existing = nimToMhs.get(row.nim);
        if (existing) {
          if (dupMode === 'update') {
            toUpdate.push({ ...existing, nama: row.nama, programStudi: row.programStudi, angkatan: row.angkatan, jenisKelamin: row.jenisKelamin, noHP: row.noHP, email: row.email, alamat: row.alamat, namaOrtu: row.namaOrtu, noHPOrtu: row.noHPOrtu });
            updated++;
          } else {
            skipped++;
          }
        } else {
          toAdd.push({ id: `M${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, nim: row.nim, nama: row.nama, programStudi: row.programStudi, angkatan: row.angkatan, jenisKelamin: row.jenisKelamin, noHP: row.noHP, email: row.email, alamat: row.alamat, namaOrtu: row.namaOrtu, noHPOrtu: row.noHPOrtu });
          imported++;
        }
      }

      const logData: Omit<ImportLog, 'id'> = {
        tanggal: new Date().toISOString(), tipe: 'Mahasiswa', operator: operatorName,
        namaFile: file?.name ?? '-', mode: dupMode,
        jumlahDiimpor: imported, jumlahDiupdate: updated, jumlahDilewati: skipped, jumlahError: errors,
      };
      onImportMahasiswa(toAdd, toUpdate, logData);
      setImportStats({ imported, updated, skipped, errors });
    }

    if (type === 'retensi' && onImportRetensi) {
      const toAdd: RetensiRecord[] = [];
      const toUpdate: RetensiRecord[] = [];

      for (const row of retensiRows) {
        if (row.errors.length > 0) { errors++; continue; }
        const mhs = nimToMhs.get(row.nim);
        if (!mhs) { errors++; continue; }
        const key = `${row.nim}|${row.periode}|${row.tahunAkademik}`;
        const existing = retensiKeyToRecord.get(key);
        if (existing) {
          if (dupMode === 'update') {
            toUpdate.push({ ...existing, status: row.status as any, keterangan: row.keterangan, tanggalUpdate: row.tanggalUpdate });
            updated++;
          } else {
            skipped++;
          }
        } else {
          toAdd.push({ id: `R${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, mahasiswaId: mhs.id, periode: row.periode as any, tahunAkademik: row.tahunAkademik, status: row.status as any, keterangan: row.keterangan, tanggalUpdate: row.tanggalUpdate, updatedBy: operatorName });
          imported++;
        }
      }

      const logData: Omit<ImportLog, 'id'> = {
        tanggal: new Date().toISOString(), tipe: 'Retensi', operator: operatorName,
        namaFile: file?.name ?? '-', mode: dupMode,
        jumlahDiimpor: imported, jumlahDiupdate: updated, jumlahDilewati: skipped, jumlahError: errors,
      };
      onImportRetensi(toAdd, toUpdate, logData);
      setImportStats({ imported, updated, skipped, errors });
    }

    setStep('done');
  };

  // ── Preview stats ─────────────────────────────────────────────────────────
  const previewRows = type === 'mahasiswa' ? mhsRows : retensiRows;
  const errorCount = previewRows.filter((r) => r.errors.length > 0).length;

  const nimNotFoundCount = type === 'retensi'
    ? retensiRows.filter((r) => r.errors.length === 0 && !nimToMhs.has(r.nim)).length
    : 0;

  const dupCount = type === 'mahasiswa'
    ? mhsRows.filter((r) => r.errors.length === 0 && nimToMhs.has(r.nim)).length
    : retensiRows.filter((r) => {
        if (r.errors.length > 0 || !nimToMhs.has(r.nim)) return false;
        return retensiKeyToRecord.has(`${r.nim}|${r.periode}|${r.tahunAkademik}`);
      }).length;

  const newCount = previewRows.length - errorCount - nimNotFoundCount - dupCount;
  const actionableCount = newCount + (dupMode === 'update' ? dupCount : 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-gray-900" style={{ fontSize: '1rem' }}>
              Import {type === 'mahasiswa' ? 'Data Mahasiswa' : 'Data Retensi'}
            </h2>
            <p className="text-gray-400 text-xs">
              {step === 'upload' ? 'Unggah file Excel sesuai template' :
               step === 'preview' ? `${previewRows.length} baris terdeteksi · Periksa sebelum mengimpor` :
               'Import selesai'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-1 text-xs mr-3">
            {(['upload', 'preview', 'done'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                <span className={`px-2 py-0.5 rounded-full ${
                  step === s ? 'bg-blue-600 text-white' :
                  (['upload', 'preview', 'done'].indexOf(step) > i)
                    ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`} style={{ fontWeight: 500 }}>
                  {s === 'upload' ? '1. Unggah' : s === 'preview' ? '2. Preview' : '3. Selesai'}
                </span>
              </div>
            ))}
          </div>

          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── STEP 1: Upload ── */}
          {step === 'upload' && (
            <div className="p-6 space-y-5">
              {/* Template download */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-blue-800 text-sm" style={{ fontWeight: 500 }}>Belum punya template?</p>
                    <p className="text-blue-600 text-xs mt-0.5">
                      Download template berikut, isi data sesuai petunjuk, lalu unggah kembali di sini.
                    </p>
                  </div>
                  <button
                    onClick={() => type === 'mahasiswa' ? downloadMahasiswaTemplate() : downloadRetensiTemplate()}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-xs transition-colors flex-shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Template
                  </button>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-blue-700 text-xs mb-1.5" style={{ fontWeight: 500 }}>Kolom yang dibutuhkan:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(type === 'mahasiswa'
                      ? ['NIM*', 'Nama Lengkap*', 'Program Studi*', 'Angkatan*', 'Jenis Kelamin*', 'No. HP*', 'Email*', 'Alamat', 'Nama Orang Tua', 'No. HP Orang Tua']
                      : ['NIM*', 'Periode*', 'Tahun Akademik*', 'Status*', 'Keterangan', 'Tanggal Update*']
                    ).map((col) => (
                      <span key={col} className={`px-2 py-0.5 rounded text-xs font-mono ${col.endsWith('*') ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 text-blue-600'}`}>
                        {col.replace('*', '')}
                        {col.endsWith('*') && <span className="text-blue-500 ml-0.5">*</span>}
                      </span>
                    ))}
                  </div>
                  <p className="text-blue-500 text-xs mt-1.5">* Wajib diisi</p>
                </div>
              </div>

              {/* Dup mode selector - shown on upload step too so user can set before processing */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-gray-700 text-sm mb-2" style={{ fontWeight: 500 }}>Mode penanganan data duplikat</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDupMode('lewati')}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border-2 text-left transition-all ${
                      dupMode === 'lewati' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <SkipForward className={`w-4 h-4 mt-0.5 flex-shrink-0 ${dupMode === 'lewati' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <p className={`text-sm ${dupMode === 'lewati' ? 'text-blue-800' : 'text-gray-700'}`} style={{ fontWeight: 500 }}>
                        Lewati Duplikat
                      </p>
                      <p className={`text-xs mt-0.5 ${dupMode === 'lewati' ? 'text-blue-600' : 'text-gray-400'}`}>
                        Data yang sudah ada tidak akan diubah
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setDupMode('update')}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border-2 text-left transition-all ${
                      dupMode === 'update' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <RefreshCw className={`w-4 h-4 mt-0.5 flex-shrink-0 ${dupMode === 'update' ? 'text-orange-600' : 'text-gray-400'}`} />
                    <div>
                      <p className={`text-sm ${dupMode === 'update' ? 'text-orange-800' : 'text-gray-700'}`} style={{ fontWeight: 500 }}>
                        Update jika Ada
                      </p>
                      <p className={`text-xs mt-0.5 ${dupMode === 'update' ? 'text-orange-600' : 'text-gray-400'}`}>
                        Data yang sudah ada akan ditimpa dari file
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDragEnter={() => setDragging(true)}
                onDragLeave={() => setDragging(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
                {loading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">Membaca file…</p>
                  </div>
                ) : (
                  <>
                    <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center ${dragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Upload className={`w-6 h-6 ${dragging ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <p className="text-gray-700 text-sm" style={{ fontWeight: 500 }}>
                      {dragging ? 'Lepaskan file di sini' : 'Seret & lepas file Excel di sini'}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">atau klik untuk memilih file</p>
                    <p className="text-gray-300 text-xs mt-3">Format: .xlsx atau .xls</p>
                  </>
                )}
              </div>

              {parseError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {parseError}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Preview ── */}
          {step === 'preview' && (
            <div className="p-6 space-y-4">
              {/* Dup mode switcher */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-gray-600 text-xs flex-1">Mode duplikat:</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setDupMode('lewati')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                      dupMode === 'lewati' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <SkipForward className="w-3 h-3" /> Lewati Duplikat
                  </button>
                  <button
                    onClick={() => setDupMode('update')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                      dupMode === 'update' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <RefreshCw className="w-3 h-3" /> Update jika Ada
                  </button>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-gray-400 text-xs">Total</p>
                  <p className="text-gray-800 mt-0.5" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{previewRows.length}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-green-600 text-xs">Baru</p>
                  <p className="text-green-700 mt-0.5" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{Math.max(0, newCount)}</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${dupMode === 'update' ? 'bg-orange-50' : 'bg-yellow-50'}`}>
                  <p className={`text-xs ${dupMode === 'update' ? 'text-orange-600' : 'text-yellow-600'}`}>
                    {dupMode === 'update' ? 'Diperbarui' : 'Dilewati'}
                  </p>
                  <p className={`mt-0.5 ${dupMode === 'update' ? 'text-orange-700' : 'text-yellow-700'}`} style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                    {dupCount}
                  </p>
                </div>
                {type === 'retensi' && (
                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <p className="text-orange-600 text-xs">NIM Invalid</p>
                    <p className="text-orange-700 mt-0.5" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{nimNotFoundCount}</p>
                  </div>
                )}
                <div className={`bg-red-50 rounded-xl p-3 text-center ${type !== 'retensi' ? 'col-span-2 sm:col-span-1' : ''}`}>
                  <p className="text-red-500 text-xs">Error</p>
                  <p className="text-red-700 mt-0.5" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{errorCount}</p>
                </div>
              </div>

              {/* Warnings */}
              {nimNotFoundCount > 0 && (
                <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>{nimNotFoundCount} baris</strong> memiliki NIM yang tidak ditemukan di Data Mahasiswa dan akan dilewati.</span>
                </div>
              )}
              {dupMode === 'update' && dupCount > 0 && (
                <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                  <RefreshCw className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>{dupCount} data duplikat</strong> akan ditimpa dengan data dari file Excel.</span>
                </div>
              )}
              {dupMode === 'lewati' && dupCount > 0 && (
                <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>{dupCount} data duplikat</strong> akan dilewati (tidak diubah).</span>
                </div>
              )}

              {/* Preview table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                  <p className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Preview Data</p>
                  <p className="text-xs text-gray-400">Menampilkan {Math.min(50, previewRows.length)} dari {previewRows.length} baris</p>
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-500">Baris</th>
                        <th className="text-left px-3 py-2 text-gray-500">Aksi</th>
                        {type === 'mahasiswa' ? (
                          <>
                            <th className="text-left px-3 py-2 text-gray-500">NIM</th>
                            <th className="text-left px-3 py-2 text-gray-500">Nama</th>
                            <th className="text-left px-3 py-2 text-gray-500">Program Studi</th>
                            <th className="text-left px-3 py-2 text-gray-500">Angkatan</th>
                            <th className="text-left px-3 py-2 text-gray-500">Keterangan Error</th>
                          </>
                        ) : (
                          <>
                            <th className="text-left px-3 py-2 text-gray-500">NIM</th>
                            <th className="text-left px-3 py-2 text-gray-500">Periode</th>
                            <th className="text-left px-3 py-2 text-gray-500">Tahun</th>
                            <th className="text-left px-3 py-2 text-gray-500">Status</th>
                            <th className="text-left px-3 py-2 text-gray-500">Keterangan Error</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(type === 'mahasiswa' ? mhsRows : retensiRows).slice(0, 50).map((row) => {
                        const hasError = row.errors.length > 0;
                        const nimNotFound = !hasError && type === 'retensi' && !nimToMhs.has((row as ParsedRetensiRow).nim);
                        const isDup = !hasError && !nimNotFound && (
                          type === 'mahasiswa'
                            ? nimToMhs.has((row as ParsedMahasiswaRow).nim)
                            : retensiKeyToRecord.has(`${(row as ParsedRetensiRow).nim}|${(row as ParsedRetensiRow).periode}|${(row as ParsedRetensiRow).tahunAkademik}`)
                        );
                        const isUpdate = isDup && dupMode === 'update';

                        const rowBg = hasError ? 'bg-red-50' : nimNotFound ? 'bg-orange-50' : isUpdate ? 'bg-orange-50' : isDup ? 'bg-yellow-50' : '';

                        return (
                          <tr key={row.rowNum} className={rowBg}>
                            <td className="px-3 py-2 text-gray-400">{row.rowNum}</td>
                            <td className="px-3 py-2">
                              {hasError ? (
                                <span className="inline-flex items-center gap-1 text-red-600"><AlertCircle className="w-3 h-3" />Error</span>
                              ) : nimNotFound ? (
                                <span className="inline-flex items-center gap-1 text-orange-600"><AlertTriangle className="w-3 h-3" />NIM?</span>
                              ) : isUpdate ? (
                                <span className="inline-flex items-center gap-1 text-orange-600"><RefreshCw className="w-3 h-3" />Update</span>
                              ) : isDup ? (
                                <span className="inline-flex items-center gap-1 text-yellow-600"><SkipForward className="w-3 h-3" />Lewati</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" />Tambah</span>
                              )}
                            </td>
                            {type === 'mahasiswa' ? (() => {
                              const r = row as ParsedMahasiswaRow;
                              return (
                                <>
                                  <td className="px-3 py-2 font-mono text-gray-700">{r.nim || <span className="text-red-400">—</span>}</td>
                                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.nama || <span className="text-red-400">—</span>}</td>
                                  <td className="px-3 py-2 text-gray-600">{r.programStudi || <span className="text-red-400">—</span>}</td>
                                  <td className="px-3 py-2 text-gray-600">{r.angkatan || <span className="text-red-400">—</span>}</td>
                                  <td className="px-3 py-2 text-red-600 max-w-[180px]">{r.errors.join(', ') || <span className="text-gray-300">—</span>}</td>
                                </>
                              );
                            })() : (() => {
                              const r = row as ParsedRetensiRow;
                              return (
                                <>
                                  <td className="px-3 py-2 font-mono text-gray-700">{r.nim || <span className="text-red-400">—</span>}</td>
                                  <td className="px-3 py-2 text-gray-600">{r.periode}</td>
                                  <td className="px-3 py-2 text-gray-600">{r.tahunAkademik}</td>
                                  <td className="px-3 py-2">
                                    {r.status ? (
                                      <span className="inline-flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status] ?? 'bg-gray-400'}`} />
                                        {r.status}
                                      </span>
                                    ) : <span className="text-red-400">—</span>}
                                  </td>
                                  <td className="px-3 py-2 text-red-600 max-w-[180px]">
                                    {r.errors.length > 0 ? r.errors.join(', ')
                                      : nimNotFound ? <span className="text-orange-500">NIM tidak ditemukan</span>
                                      : <span className="text-gray-300">—</span>}
                                  </td>
                                </>
                              );
                            })()}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Done ── */}
          {step === 'done' && importStats && (
            <div className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-gray-900">Import Berhasil!</h3>
                <p className="text-gray-500 text-sm mt-1">Data telah diproses dan riwayat import tersimpan.</p>
              </div>
              <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-green-700 text-xs">Ditambah</p>
                  <p className="text-green-800 mt-0.5" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{importStats.imported}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-orange-700 text-xs">Diperbarui</p>
                  <p className="text-orange-800 mt-0.5" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{importStats.updated}</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3">
                  <p className="text-yellow-700 text-xs">Dilewati</p>
                  <p className="text-yellow-800 mt-0.5" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{importStats.skipped}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-red-600 text-xs">Error</p>
                  <p className="text-red-700 mt-0.5" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{importStats.errors}</p>
                </div>
              </div>
              <p className="text-gray-400 text-xs">
                Riwayat import ini tersimpan di halaman <span className="text-blue-500">Log Import</span>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50 rounded-b-2xl">
          {step === 'upload' && (
            <button onClick={handleClose} className="flex-1 border border-gray-200 bg-white rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Batal
            </button>
          )}
          {step === 'preview' && (
            <>
              <button onClick={reset} className="flex items-center gap-2 border border-gray-200 bg-white rounded-lg px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Ganti File
              </button>
              <button
                onClick={handleImport}
                disabled={actionableCount <= 0 && newCount <= 0}
                className={`flex-1 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm transition-colors ${
                  dupMode === 'update' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {actionableCount > 0 || newCount > 0
                  ? `${dupMode === 'update' ? 'Import & Update' : 'Import'} ${Math.max(0, newCount + (dupMode === 'update' ? dupCount : 0))} Data`
                  : 'Tidak Ada Data yang Bisa Diimpor'}
              </button>
            </>
          )}
          {step === 'done' && (
            <>
              <button onClick={reset} className="flex items-center gap-2 border border-gray-200 bg-white rounded-lg px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                <RotateCcw className="w-3.5 h-3.5" /> Import Lagi
              </button>
              <button onClick={handleClose} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm transition-colors">
                Selesai
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
