export type JenisKelamin = 'L' | 'P';

export type StatusMahasiswa =
  | 'Aktif'
  | 'Mengundurkan Diri'
  | 'Tidak Ada Kabar'
  | 'Batal Kuliah';

export type Periode = 'Gasal' | 'Genap';

export interface Mahasiswa {
  id: string;
  nim: string;
  nama: string;
  programStudi: string;
  angkatan: number;
  jenisKelamin: JenisKelamin;
  noHP: string;
  email: string;
  alamat: string;
  namaOrtu: string;
  noHPOrtu: string;
}

export interface RetensiRecord {
  id: string;
  mahasiswaId: string;
  periode: Periode;
  tahunAkademik: string;
  status: StatusMahasiswa;
  keterangan: string;
  tanggalUpdate: string;
  updatedBy: string;
}

export interface FilterState {
  periode: Periode | 'Semua';
  tahunAkademik: string;
  status: StatusMahasiswa | 'Semua';
  programStudi: string;
  angkatan: string;
  search: string;
}

// ── Import Log ────────────────────────────────────────────────────────────────
export type ImportTipe = 'Mahasiswa' | 'Retensi';
export type ImportMode = 'lewati' | 'update';

export interface ImportLog {
  id: string;
  tanggal: string;        // ISO datetime string
  tipe: ImportTipe;
  operator: string;
  namaFile: string;
  mode: ImportMode;
  jumlahDiimpor: number;
  jumlahDiupdate: number;
  jumlahDilewati: number;
  jumlahError: number;
}