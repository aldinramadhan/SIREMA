import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Mahasiswa, RetensiRecord, Periode, StatusMahasiswa } from '../types';
import { TAHUN_AKADEMIK_LIST } from '../data/mockData';

interface RetensiModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (record: RetensiRecord) => void;
  mahasiswaList: Mahasiswa[];
  existing?: RetensiRecord | null;
  defaultMahasiswaId?: string;
  currentUserName?: string;
}

const STATUS_OPTIONS: StatusMahasiswa[] = [
  'Aktif',
  'Mengundurkan Diri',
  'Tidak Ada Kabar',
  'Batal Kuliah',
];

const empty = (userName = 'Admin BAK'): Omit<RetensiRecord, 'id'> => ({
  mahasiswaId: '',
  periode: 'Gasal',
  tahunAkademik: '2025/2026',
  status: 'Aktif',
  keterangan: '',
  tanggalUpdate: new Date().toISOString().slice(0, 10),
  updatedBy: userName,
});

export function RetensiModal({
  open,
  onClose,
  onSave,
  mahasiswaList,
  existing,
  defaultMahasiswaId,
  currentUserName,
}: RetensiModalProps) {
  const [form, setForm] = useState(empty(currentUserName));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (existing) {
        setForm({ ...existing });
      } else {
        setForm({ ...empty(currentUserName), mahasiswaId: defaultMahasiswaId ?? '' });
      }
      setErrors({});
    }
  }, [open, existing, defaultMahasiswaId, currentUserName]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.mahasiswaId) e.mahasiswaId = 'Pilih mahasiswa.';
    if (!form.tahunAkademik) e.tahunAkademik = 'Pilih tahun akademik.';
    if (form.status !== 'Aktif' && !form.keterangan.trim())
      e.keterangan = 'Keterangan wajib diisi untuk status non-aktif.';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const record: RetensiRecord = {
      ...form,
      id: existing?.id ?? `R${Date.now()}`,
    };
    onSave(record);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-gray-900" style={{ fontSize: '1rem' }}>
            {existing ? 'Edit Record Retensi' : 'Tambah Record Retensi'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mahasiswa */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Mahasiswa *</label>
            <select
              value={form.mahasiswaId}
              onChange={(e) => setForm({ ...form, mahasiswaId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Mahasiswa --</option>
              {mahasiswaList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nim} – {m.nama} ({m.programStudi}, {m.angkatan})
                </option>
              ))}
            </select>
            {errors.mahasiswaId && <p className="text-red-500 text-xs mt-1">{errors.mahasiswaId}</p>}
          </div>

          {/* Periode + Tahun */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Periode *</label>
              <select
                value={form.periode}
                onChange={(e) => setForm({ ...form, periode: e.target.value as Periode })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Gasal">Gasal</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Tahun Akademik *</label>
              <select
                value={form.tahunAkademik}
                onChange={(e) => setForm({ ...form, tahunAkademik: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TAHUN_AKADEMIK_LIST.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.tahunAkademik && <p className="text-red-500 text-xs mt-1">{errors.tahunAkademik}</p>}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Status *</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                    form.status === s
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={form.status === s}
                    onChange={() => setForm({ ...form, status: s })}
                    className="sr-only"
                  />
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0`}
                    style={{
                      backgroundColor:
                        s === 'Aktif' ? '#22c55e' :
                        s === 'Mengundurkan Diri' ? '#f97316' :
                        s === 'Tidak Ada Kabar' ? '#eab308' : '#ef4444',
                    }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Keterangan {form.status !== 'Aktif' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              rows={3}
              placeholder={
                form.status === 'Aktif'
                  ? 'Opsional untuk status aktif…'
                  : 'Jelaskan alasan atau kronologi non-aktif…'
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {errors.keterangan && <p className="text-red-500 text-xs mt-1">{errors.keterangan}</p>}
          </div>

          {/* Tanggal Update */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Tanggal Update *</label>
            <input
              type="date"
              value={form.tanggalUpdate}
              onChange={(e) => setForm({ ...form, tanggalUpdate: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm transition-colors"
            >
              {existing ? 'Simpan Perubahan' : 'Tambah Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
