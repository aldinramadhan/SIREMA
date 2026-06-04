import { useState, useMemo } from 'react';
import {
  Search, Plus, Download, Filter, Pencil, Trash2, ChevronLeft, ChevronRight, Upload,
} from 'lucide-react';
import { Mahasiswa, RetensiRecord, FilterState, StatusMahasiswa, ImportLog } from '../types';
import { TAHUN_AKADEMIK_LIST, PROGRAM_STUDI_LIST } from '../data/mockData';
import { RetensiModal } from './RetensiModal';
import { ImportModal } from './ImportModal';
import { exportRetensiToExcel } from '../utils/exportExcel';

interface RetensiPageProps {
  mahasiswa: Mahasiswa[];
  retensi: RetensiRecord[];
  onAdd: (r: RetensiRecord) => void;
  onEdit: (r: RetensiRecord) => void;
  onDelete: (id: string) => void;
  onImport: (toAdd: RetensiRecord[], toUpdate: RetensiRecord[], logData: Omit<ImportLog, 'id'>) => void;
  currentUserName?: string;
}

const STATUS_BADGE: Record<StatusMahasiswa, { bg: string; text: string; dot: string }> = {
  Aktif: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'Mengundurkan Diri': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Tidak Ada Kabar': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'Batal Kuliah': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const PAGE_SIZE = 15;

export function RetensiPage({ mahasiswa, retensi, onAdd, onEdit, onDelete, onImport, currentUserName }: RetensiPageProps) {
  const [filter, setFilter] = useState<FilterState>({
    periode: 'Semua',
    tahunAkademik: '2025/2026',
    status: 'Semua',
    programStudi: '',
    angkatan: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<RetensiRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const mhsMap = useMemo(() => new Map(mahasiswa.map((m) => [m.id, m])), [mahasiswa]);

  const filtered = useMemo(() => {
    return retensi.filter((r) => {
      const mhs = mhsMap.get(r.mahasiswaId);
      if (!mhs) return false;

      if (filter.tahunAkademik && r.tahunAkademik !== filter.tahunAkademik) return false;
      if (filter.periode !== 'Semua' && r.periode !== filter.periode) return false;
      if (filter.status !== 'Semua' && r.status !== filter.status) return false;
      if (filter.programStudi && mhs.programStudi !== filter.programStudi) return false;
      if (filter.angkatan && mhs.angkatan !== parseInt(filter.angkatan)) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        if (!mhs.nama.toLowerCase().includes(q) && !mhs.nim.includes(q)) return false;
      }
      return true;
    });
  }, [retensi, filter, mhsMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (key: keyof FilterState, value: string) => {
    setFilter((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleOpen = (record?: RetensiRecord) => {
    setEditRecord(record ?? null);
    setModalOpen(true);
  };

  const handleSave = (record: RetensiRecord) => {
    if (editRecord) onEdit(record);
    else onAdd(record);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirm(null);
  };

  const angkatanOptions = [...new Set(mahasiswa.map((m) => m.angkatan))].sort((a, b) => a - b);

  // Summary for current filter
  const summary = useMemo(() => {
    const aktif = filtered.filter((r) => r.status === 'Aktif').length;
    const nonAktif = filtered.length - aktif;
    return { aktif, nonAktif, total: filtered.length };
  }, [filtered]);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-gray-900">Data Retensi</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kelola data retensi mahasiswa per semester</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportRetensiToExcel(filtered, mahasiswa)}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={() => handleOpen()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {/* Primary filters */}
        <div className="flex flex-wrap gap-2">
          {/* Tahun Akademik */}
          <select
            value={filter.tahunAkademik}
            onChange={(e) => handleFilter('tahunAkademik', e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Tahun</option>
            {TAHUN_AKADEMIK_LIST.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Periode */}
          <select
            value={filter.periode}
            onChange={(e) => handleFilter('periode', e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua">Semua Periode</option>
            <option value="Gasal">Gasal</option>
            <option value="Genap">Genap</option>
          </select>

          {/* Status */}
          <select
            value={filter.status}
            onChange={(e) => handleFilter('status', e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Mengundurkan Diri">Mengundurkan Diri</option>
            <option value="Tidak Ada Kabar">Tidak Ada Kabar</option>
            <option value="Batal Kuliah">Batal Kuliah</option>
          </select>

          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-1.5 border rounded-lg px-3 py-2 text-sm transition-colors ${
              showFilter || filter.programStudi || filter.angkatan
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter Lanjutan
          </button>
        </div>

        {/* Advanced filters */}
        {showFilter && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <select
              value={filter.programStudi}
              onChange={(e) => handleFilter('programStudi', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Program Studi</option>
              {PROGRAM_STUDI_LIST.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={filter.angkatan}
              onChange={(e) => handleFilter('angkatan', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Angkatan</option>
              {angkatanOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau NIM mahasiswa…"
            value={filter.search}
            onChange={(e) => handleFilter('search', e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
            Total: <strong>{summary.total}</strong>
          </span>
          <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
            Aktif: <strong>{summary.aktif}</strong>
          </span>
          <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full">
            Non-Aktif: <strong>{summary.nonAktif}</strong>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase tracking-wider">No.</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase tracking-wider">NIM</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase tracking-wider">Nama</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Program Studi</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Angkatan</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase tracking-wider">Periode</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase tracking-wider">T.A.</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase tracking-wider hidden xl:table-cell">Keterangan</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">
                    Tidak ada data yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginated.map((r, idx) => {
                  const mhs = mhsMap.get(r.mahasiswaId);
                  const badge = STATUS_BADGE[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{mhs?.nim ?? '-'}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-800" style={{ fontWeight: 500 }}>{mhs?.nama ?? '-'}</p>
                        <p className="text-gray-400 text-xs lg:hidden">{mhs?.programStudi}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{mhs?.programStudi ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{mhs?.angkatan ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          r.periode === 'Gasal'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-teal-50 text-teal-700'
                        }`} style={{ fontWeight: 500 }}>
                          {r.periode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{r.tahunAkademik}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${badge.bg} ${badge.text}`} style={{ fontWeight: 500 }}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate hidden xl:table-cell">
                        {r.keterangan || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpen(r)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(r.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">
            Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} data
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs border transition-colors ${
                    page === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 hover:bg-white text-gray-600'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 5 && <span className="text-gray-400 text-xs px-1">…</span>}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Retensi Modal */}
      <RetensiModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        mahasiswaList={mahasiswa}
        existing={editRecord}
        currentUserName={currentUserName}
      />

      {/* Import Modal */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        type="retensi"
        mahasiswaList={mahasiswa}
        retensiList={retensi}
        onImportRetensi={onImport}
        operatorName={currentUserName}
      />

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-gray-900 mb-2">Hapus Record?</h3>
            <p className="text-gray-500 text-sm mb-5">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}