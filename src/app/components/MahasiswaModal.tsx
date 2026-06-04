import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Mahasiswa, JenisKelamin } from '../types';
import { PROGRAM_STUDI_LIST } from '../data/mockData';

interface MahasiswaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (m: Mahasiswa) => void;
  existing?: Mahasiswa | null;
}

const emptyForm = (): Omit<Mahasiswa, 'id'> => ({
  nim: '',
  nama: '',
  programStudi: PROGRAM_STUDI_LIST[0],
  angkatan: new Date().getFullYear(),
  jenisKelamin: 'L',
  noHP: '',
  email: '',
  alamat: '',
  namaOrtu: '',
  noHPOrtu: '',
});

export function MahasiswaModal({ open, onClose, onSave, existing }: MahasiswaModalProps) {
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(existing ? { ...existing } : emptyForm());
      setErrors({});
    }
  }, [open, existing]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nim.trim()) e.nim = 'NIM wajib diisi.';
    if (!form.nama.trim()) e.nama = 'Nama wajib diisi.';
    if (!form.noHP.trim()) e.noHP = 'No. HP wajib diisi.';
    if (!form.email.trim()) e.email = 'Email wajib diisi.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Format email tidak valid.';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const mhs: Mahasiswa = {
      ...form,
      id: existing?.id ?? `M${Date.now()}`,
    };
    onSave(mhs);
    onClose();
  };

  const set = (key: keyof Omit<Mahasiswa, 'id'>, val: string | number) =>
    setForm((f) => ({ ...f, [key]: val }));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-gray-900" style={{ fontSize: '1rem' }}>
            {existing ? 'Edit Data Mahasiswa' : 'Tambah Mahasiswa Baru'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-4">
            {/* NIM + Angkatan */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">NIM *</label>
                <input
                  value={form.nim}
                  onChange={(e) => set('nim', e.target.value)}
                  placeholder="e.g. 2025310001"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.nim && <p className="text-red-500 text-xs mt-1">{errors.nim}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Angkatan *</label>
                <input
                  type="number"
                  value={form.angkatan}
                  onChange={(e) => set('angkatan', parseInt(e.target.value))}
                  min={2000}
                  max={2099}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Nama */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Nama Lengkap *</label>
              <input
                value={form.nama}
                onChange={(e) => set('nama', e.target.value)}
                placeholder="Nama lengkap mahasiswa"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
            </div>

            {/* Prodi + JK */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Program Studi *</label>
                <select
                  value={form.programStudi}
                  onChange={(e) => set('programStudi', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PROGRAM_STUDI_LIST.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Jenis Kelamin *</label>
                <div className="flex gap-2 mt-1">
                  {(['L', 'P'] as JenisKelamin[]).map((jk) => (
                    <label
                      key={jk}
                      className={`flex-1 flex items-center justify-center gap-2 border rounded-lg py-2 cursor-pointer text-sm transition-colors ${
                        form.jenisKelamin === jk
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="jk"
                        value={jk}
                        checked={form.jenisKelamin === jk}
                        onChange={() => set('jenisKelamin', jk)}
                        className="sr-only"
                      />
                      {jk === 'L' ? '♂ Laki-laki' : '♀ Perempuan'}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* No HP + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">No. HP *</label>
                <input
                  value={form.noHP}
                  onChange={(e) => set('noHP', e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.noHP && <p className="text-red-500 text-xs mt-1">{errors.noHP}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="nama@mhs.univ.ac.id"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Alamat</label>
              <textarea
                value={form.alamat}
                onChange={(e) => set('alamat', e.target.value)}
                rows={2}
                placeholder="Alamat lengkap mahasiswa"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Data orang tua */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Data Orang Tua / Wali</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Nama Orang Tua</label>
                  <input
                    value={form.namaOrtu}
                    onChange={(e) => set('namaOrtu', e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">No. HP Orang Tua</label>
                  <input
                    value={form.noHPOrtu}
                    onChange={(e) => set('noHPOrtu', e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 px-6 pb-6">
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
              {existing ? 'Simpan Perubahan' : 'Tambah Mahasiswa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
