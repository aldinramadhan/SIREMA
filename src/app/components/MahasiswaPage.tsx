import { useState, useMemo } from 'react';
import React from 'react';
import { Search, Plus, Pencil, Trash2, Users, ChevronLeft, ChevronRight, Phone, Mail, Upload } from 'lucide-react';
import { Mahasiswa, RetensiRecord, ImportLog } from '../types';
import { PROGRAM_STUDI_LIST } from '../data/mockData';
import { MahasiswaModal } from './MahasiswaModal';
import { ImportModal } from './ImportModal';

interface MahasiswaPageProps {
  mahasiswa: Mahasiswa[];
  retensi: RetensiRecord[];
  onAdd: (m: Mahasiswa) => void;
  onEdit: (m: Mahasiswa) => void;
  onDelete: (id: string) => void;
  onImport: (toAdd: Mahasiswa[], toUpdate: Mahasiswa[], logData: Omit<ImportLog, 'id'>) => void;
  currentUserName?: string;
}

const PAGE_SIZE = 12;

export function MahasiswaPage({ mahasiswa, retensi, onAdd, onEdit, onDelete, onImport, currentUserName }: MahasiswaPageProps) {
  const [search, setSearch] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMhs, setEditMhs] = useState<Mahasiswa | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const angkatanOptions = [...new Set(mahasiswa.map((m) => m.angkatan))].sort((a, b) => a - b);

  const filtered = useMemo(() => {
    return mahasiswa.filter((m) => {
      if (filterProdi && m.programStudi !== filterProdi) return false;
      if (filterAngkatan && m.angkatan !== parseInt(filterAngkatan)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!m.nama.toLowerCase().includes(q) && !m.nim.includes(q)) return false;
      }
      return true;
    });
  }, [mahasiswa, search, filterProdi, filterAngkatan]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Get latest status per mahasiswa
  const latestStatus = useMemo(() => {
    const map = new Map<string, string>();
    const sorted = [...retensi].sort((a, b) =>
      b.tahunAkademik.localeCompare(a.tahunAkademik) ||
      (b.periode === 'Genap' ? 1 : -1)
    );
    for (const r of sorted) {
      if (!map.has(r.mahasiswaId)) map.set(r.mahasiswaId, r.status);
    }
    return map;
  }, [retensi]);

  const handleOpen = (m?: Mahasiswa) => {
    setEditMhs(m ?? null);
    setModalOpen(true);
  };

  const handleSave = (m: Mahasiswa) => {
    if (editMhs) onEdit(m);
    else onAdd(m);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-gray-900">Data Mahasiswa</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kelola data pribadi mahasiswa</p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Mahasiswa
        </button>
        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-2 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import Excel
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PROGRAM_STUDI_LIST.slice(0, 4).map((prodi) => {
          const count = mahasiswa.filter((m) => m.programStudi === prodi).length;
          return (
            <div
              key={prodi}
              onClick={() => { setFilterProdi(filterProdi === prodi ? '' : prodi); setPage(1); }}
              className={`bg-white border rounded-xl p-3 cursor-pointer transition-all ${
                filterProdi === prodi ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className={`text-xs truncate ${filterProdi === prodi ? 'text-blue-700' : 'text-gray-500'}`}>{prodi}</p>
              <p className={`mt-0.5 ${filterProdi === prodi ? 'text-blue-900' : 'text-gray-800'}`} style={{ fontSize: '1.25rem', fontWeight: 700 }}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau NIM…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterProdi}
          onChange={(e) => { setFilterProdi(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Prodi</option>
          {PROGRAM_STUDI_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={filterAngkatan}
          onChange={(e) => { setFilterAngkatan(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Angkatan</option>
          {angkatanOptions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
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
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase tracking-wider hidden xl:table-cell">Kontak</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase tracking-wider">Status Terakhir</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400">Tidak ada mahasiswa yang sesuai.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((m, idx) => {
                  const status = latestStatus.get(m.id) ?? '—';
                  const statusColor =
                    status === 'Aktif' ? { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' } :
                    status === 'Mengundurkan Diri' ? { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' } :
                    status === 'Tidak Ada Kabar' ? { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' } :
                    status === 'Batal Kuliah' ? { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' } :
                    { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };

                  const isExpanded = expandedId === m.id;

                  return (
                    <React.Fragment key={m.id}>
                      <tr
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : m.id)}
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{m.nim}</td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800" style={{ fontWeight: 500 }}>{m.nama}</p>
                          <p className="text-gray-400 text-xs">{m.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{m.programStudi}</td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{m.angkatan}</td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <div className="text-xs space-y-0.5">
                            <div className="flex items-center gap-1 text-gray-500">
                              <Phone className="w-3 h-3" /> {m.noHP}
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                              <Mail className="w-3 h-3" /> {m.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {status !== '—' ? (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${statusColor.bg} ${statusColor.text}`} style={{ fontWeight: 500 }}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`} />
                              {status}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">Belum ada data</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpen(m)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(m.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-blue-50/30">
                          <td colSpan={8} className="px-8 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                              <div>
                                <p className="text-gray-400 mb-0.5">No. HP</p>
                                <p className="text-gray-700">{m.noHP}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">Email</p>
                                <p className="text-gray-700 break-all">{m.email}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">Alamat</p>
                                <p className="text-gray-700">{m.alamat || '—'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">Nama Orang Tua</p>
                                <p className="text-gray-700">{m.namaOrtu || '—'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">No. HP Orang Tua</p>
                                <p className="text-gray-700">{m.noHPOrtu || '—'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">Jumlah Record Retensi</p>
                                <p className="text-gray-700">{retensi.filter((r) => r.mahasiswaId === m.id).length} semester</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">
            {filtered.length} mahasiswa · Halaman {page} dari {totalPages}
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

      <MahasiswaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        existing={editMhs}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        type="mahasiswa"
        mahasiswaList={mahasiswa}
        retensiList={retensi}
        onImportMahasiswa={onImport}
        operatorName={currentUserName}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-gray-900 mb-2">Hapus Mahasiswa?</h3>
            <p className="text-gray-500 text-sm mb-1">
              Data mahasiswa dan semua record retensinya akan dihapus.
            </p>
            <p className="text-red-500 text-xs mb-5">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => { onDelete(deleteConfirm); setDeleteConfirm(null); }}
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