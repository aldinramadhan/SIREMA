import * as XLSX from 'xlsx';
import { Mahasiswa, RetensiRecord } from '../types';
import { PROGRAM_STUDI_LIST, TAHUN_AKADEMIK_LIST } from '../data/mockData';

export function exportRetensiToExcel(
  retensiList: RetensiRecord[],
  mahasiswaList: Mahasiswa[],
  filename: string = 'Retensi_Mahasiswa'
) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Data Retensi ──────────────────────────────────────────────────
  const mhsMap = new Map(mahasiswaList.map((m) => [m.id, m]));

  const retensiRows = retensiList.map((r) => {
    const mhs = mhsMap.get(r.mahasiswaId);
    return {
      'No.': '',
      'NIM': mhs?.nim ?? '-',
      'Nama Mahasiswa': mhs?.nama ?? '-',
      'Program Studi': mhs?.programStudi ?? '-',
      'Angkatan': mhs?.angkatan ?? '-',
      'Jenis Kelamin': mhs?.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      'Periode': r.periode,
      'Tahun Akademik': r.tahunAkademik,
      'Status': r.status,
      'Keterangan': r.keterangan,
      'Tanggal Update': r.tanggalUpdate,
      'Diperbarui Oleh': r.updatedBy,
    };
  });

  // Add row numbers
  retensiRows.forEach((row, i) => {
    row['No.'] = String(i + 1);
  });

  const wsRetensi = XLSX.utils.json_to_sheet(retensiRows);

  // Set column widths
  wsRetensi['!cols'] = [
    { wch: 5 },   // No.
    { wch: 14 },  // NIM
    { wch: 25 },  // Nama
    { wch: 22 },  // Prodi
    { wch: 10 },  // Angkatan
    { wch: 14 },  // JK
    { wch: 10 },  // Periode
    { wch: 14 },  // Tahun Akademik
    { wch: 20 },  // Status
    { wch: 40 },  // Keterangan
    { wch: 16 },  // Tanggal Update
    { wch: 18 },  // Diperbarui Oleh
  ];

  XLSX.utils.book_append_sheet(wb, wsRetensi, 'Data Retensi');

  // ── Sheet 2: Data Mahasiswa ────────────────────────────────────────────────
  const mahasiswaRows = mahasiswaList.map((m, i) => ({
    'No.': i + 1,
    'NIM': m.nim,
    'Nama': m.nama,
    'Program Studi': m.programStudi,
    'Angkatan': m.angkatan,
    'Jenis Kelamin': m.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
    'No. HP': m.noHP,
    'Email': m.email,
    'Alamat': m.alamat,
    'Nama Orang Tua': m.namaOrtu,
    'No. HP Orang Tua': m.noHPOrtu,
  }));

  const wsMahasiswa = XLSX.utils.json_to_sheet(mahasiswaRows);
  wsMahasiswa['!cols'] = [
    { wch: 5 }, { wch: 14 }, { wch: 25 }, { wch: 22 }, { wch: 10 },
    { wch: 14 }, { wch: 16 }, { wch: 30 }, { wch: 35 }, { wch: 25 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMahasiswa, 'Data Mahasiswa');

  // ── Sheet 3: Ringkasan ─────────────────────────────────────────────────────
  const tahunSet = [...new Set(retensiList.map((r) => r.tahunAkademik))].sort();
  const summaryRows: Record<string, string | number>[] = [];

  tahunSet.forEach((tahun) => {
    (['Gasal', 'Genap'] as const).forEach((periode) => {
      const filtered = retensiList.filter(
        (r) => r.tahunAkademik === tahun && r.periode === periode
      );
      if (filtered.length === 0) return;

      const aktif = filtered.filter((r) => r.status === 'Aktif').length;
      const mundur = filtered.filter((r) => r.status === 'Mengundurkan Diri').length;
      const tidakKabar = filtered.filter((r) => r.status === 'Tidak Ada Kabar').length;
      const batal = filtered.filter((r) => r.status === 'Batal Kuliah').length;
      const total = filtered.length;

      summaryRows.push({
        'Tahun Akademik': tahun,
        'Periode': periode,
        'Total Mahasiswa': total,
        'Aktif': aktif,
        '% Aktif': total > 0 ? `${((aktif / total) * 100).toFixed(1)}%` : '0%',
        'Mengundurkan Diri': mundur,
        'Tidak Ada Kabar': tidakKabar,
        'Batal Kuliah': batal,
        'Total Non-Aktif': mundur + tidakKabar + batal,
        '% Non-Aktif': total > 0 ? `${(((mundur + tidakKabar + batal) / total) * 100).toFixed(1)}%` : '0%',
      });
    });
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 16 }, { wch: 10 }, { wch: 18 }, { wch: 8 }, { wch: 10 },
    { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // ── Download ───────────────────────────────────────────────────────────────
  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
}

// ── Template: Data Mahasiswa ───────────────────────────────────────────────────
export function downloadMahasiswaTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Template isi data
  const headers = [
    'NIM', 'Nama Lengkap', 'Program Studi', 'Angkatan',
    'Jenis Kelamin', 'No. HP', 'Email', 'Alamat',
    'Nama Orang Tua', 'No. HP Orang Tua',
  ];

  const contoh = [
    ['2025310001', 'Ahmad Fauzi', 'Teknik Informatika', 2025,
     'L', '081234567890', 'ahmad@mhs.univ.ac.id', 'Jl. Merdeka No. 1, Surabaya',
     'Budi Santoso', '081298765432'],
    ['2025310002', 'Siti Rahayu', 'Sistem Informasi', 2025,
     'P', '082345678901', 'siti@mhs.univ.ac.id', 'Jl. Pahlawan No. 5, Malang',
     'Hadi Susanto', '082187654321'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...contoh]);
  ws['!cols'] = [
    { wch: 14 }, { wch: 25 }, { wch: 22 }, { wch: 10 },
    { wch: 14 }, { wch: 16 }, { wch: 30 }, { wch: 35 },
    { wch: 25 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Data Mahasiswa');

  // Sheet 2: Petunjuk
  const petunjuk = [
    ['PETUNJUK PENGISIAN TEMPLATE DATA MAHASISWA'],
    [''],
    ['Kolom', 'Keterangan', 'Wajib', 'Contoh'],
    ['NIM', 'Nomor Induk Mahasiswa (unik)', 'Ya', '2025310001'],
    ['Nama Lengkap', 'Nama lengkap mahasiswa', 'Ya', 'Ahmad Fauzi'],
    ['Program Studi', `Salah satu dari: ${PROGRAM_STUDI_LIST.join(', ')}`, 'Ya', 'Teknik Informatika'],
    ['Angkatan', 'Tahun angkatan (4 digit)', 'Ya', '2025'],
    ['Jenis Kelamin', 'L = Laki-laki, P = Perempuan', 'Ya', 'L'],
    ['No. HP', 'Nomor HP aktif (format 08xx)', 'Ya', '081234567890'],
    ['Email', 'Alamat email aktif', 'Ya', 'ahmad@mhs.univ.ac.id'],
    ['Alamat', 'Alamat lengkap', 'Tidak', 'Jl. Merdeka No. 1, Surabaya'],
    ['Nama Orang Tua', 'Nama orang tua/wali', 'Tidak', 'Budi Santoso'],
    ['No. HP Orang Tua', 'No. HP orang tua/wali', 'Tidak', '081298765432'],
    [''],
    ['Catatan:'],
    ['- Hapus baris contoh sebelum mengisi data asli, atau isi langsung di bawah baris contoh.'],
    ['- Jangan mengubah nama kolom pada baris pertama.'],
    ['- NIM yang sudah ada di sistem akan dilewati (tidak duplikat).'],
  ];

  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjuk);
  wsPetunjuk['!cols'] = [{ wch: 20 }, { wch: 55 }, { wch: 8 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk');

  // Sheet 3: Referensi Program Studi
  const refProdi = [
    ['Program Studi yang Valid'],
    ...PROGRAM_STUDI_LIST.map((p) => [p]),
  ];
  const wsRef = XLSX.utils.aoa_to_sheet(refProdi);
  wsRef['!cols'] = [{ wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi');

  XLSX.writeFile(wb, 'Template_Import_Mahasiswa.xlsx');
}

// ── Template: Data Retensi ────────────────────────────────────────────────────
export function downloadRetensiTemplate() {
  const wb = XLSX.utils.book_new();

  const headers = [
    'NIM', 'Periode', 'Tahun Akademik', 'Status', 'Keterangan', 'Tanggal Update',
  ];

  const contoh = [
    ['2025310001', 'Gasal', '2025/2026', 'Aktif', '', '2025-09-01'],
    ['2025310002', 'Gasal', '2025/2026', 'Mengundurkan Diri', 'Mahasiswa menyatakan ingin bekerja.', '2025-10-15'],
    ['2025310003', 'Gasal', '2025/2026', 'Tidak Ada Kabar', 'Tidak hadir sejak minggu ke-3, HP tidak aktif.', '2025-10-20'],
    ['2025310004', 'Gasal', '2025/2026', 'Batal Kuliah', 'Tidak herregistrasi selama 2 semester berturut-turut.', '2025-11-01'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...contoh]);
  ws['!cols'] = [
    { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 22 }, { wch: 45 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Data Retensi');

  // Petunjuk
  const petunjuk = [
    ['PETUNJUK PENGISIAN TEMPLATE DATA RETENSI'],
    [''],
    ['Kolom', 'Keterangan', 'Wajib', 'Nilai yang Valid'],
    ['NIM', 'NIM mahasiswa (harus sudah ada di Data Mahasiswa)', 'Ya', '2025310001'],
    ['Periode', 'Semester perkuliahan', 'Ya', 'Gasal / Genap'],
    ['Tahun Akademik', `Tahun akademik: ${TAHUN_AKADEMIK_LIST.join(', ')}`, 'Ya', '2025/2026'],
    ['Status', 'Status retensi mahasiswa', 'Ya', 'Aktif / Mengundurkan Diri / Tidak Ada Kabar / Batal Kuliah'],
    ['Keterangan', 'Penjelasan detail (wajib jika Non-Aktif)', 'Kondisional', 'Teks bebas'],
    ['Tanggal Update', 'Tanggal pencatatan (format YYYY-MM-DD)', 'Ya', '2025-09-01'],
    [''],
    ['Status Non-Aktif yang tersedia:'],
    ['- Mengundurkan Diri : Mahasiswa mengajukan pengunduran diri'],
    ['- Tidak Ada Kabar   : Mahasiswa tidak hadir & tidak bisa dihubungi'],
    ['- Batal Kuliah      : Status dibatalkan secara administratif'],
    [''],
    ['Catatan:'],
    ['- NIM yang tidak ditemukan di sistem akan ditolak.'],
    ['- Duplikat (NIM + Periode + Tahun Akademik yang sama) akan dilewati.'],
    ['- Keterangan WAJIB diisi jika status bukan Aktif.'],
  ];

  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjuk);
  wsPetunjuk['!cols'] = [{ wch: 20 }, { wch: 55 }, { wch: 12 }, { wch: 55 }];
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk');

  XLSX.writeFile(wb, 'Template_Import_Retensi.xlsx');
}

// ── Parse imported Mahasiswa Excel ────────────────────────────────────────────
export interface ParsedMahasiswaRow {
  rowNum: number;
  nim: string;
  nama: string;
  programStudi: string;
  angkatan: number;
  jenisKelamin: 'L' | 'P';
  noHP: string;
  email: string;
  alamat: string;
  namaOrtu: string;
  noHPOrtu: string;
  errors: string[];
}

export function parseMahasiswaExcel(file: File): Promise<ParsedMahasiswaRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const parsed: ParsedMahasiswaRow[] = rows.map((row, i) => {
          const errors: string[] = [];
          const nim = String(row['NIM'] ?? '').trim();
          const nama = String(row['Nama Lengkap'] ?? '').trim();
          const prodi = String(row['Program Studi'] ?? '').trim();
          const angkatanRaw = String(row['Angkatan'] ?? '').trim();
          const jkRaw = String(row['Jenis Kelamin'] ?? '').trim().toUpperCase();
          const noHP = String(row['No. HP'] ?? '').trim();
          const email = String(row['Email'] ?? '').trim();
          const alamat = String(row['Alamat'] ?? '').trim();
          const namaOrtu = String(row['Nama Orang Tua'] ?? '').trim();
          const noHPOrtu = String(row['No. HP Orang Tua'] ?? '').trim();

          if (!nim) errors.push('NIM kosong');
          if (!nama) errors.push('Nama kosong');
          if (!prodi) errors.push('Program Studi kosong');
          else if (!PROGRAM_STUDI_LIST.includes(prodi)) errors.push(`Program Studi "${prodi}" tidak valid`);
          const angkatan = parseInt(angkatanRaw);
          if (!angkatanRaw || isNaN(angkatan)) errors.push('Angkatan tidak valid');
          const jk = jkRaw === 'L' || jkRaw === 'P' ? jkRaw : null;
          if (!jk) errors.push('Jenis Kelamin harus L atau P');
          if (!noHP) errors.push('No. HP kosong');
          if (!email) errors.push('Email kosong');
          else if (!/\S+@\S+\.\S+/.test(email)) errors.push('Format email tidak valid');

          return {
            rowNum: i + 2,
            nim,
            nama,
            programStudi: prodi,
            angkatan: isNaN(angkatan) ? 0 : angkatan,
            jenisKelamin: (jk ?? 'L') as 'L' | 'P',
            noHP,
            email,
            alamat,
            namaOrtu,
            noHPOrtu,
            errors,
          };
        });

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// ── Parse imported Retensi Excel ──────────────────────────────────────────────
export interface ParsedRetensiRow {
  rowNum: number;
  nim: string;
  periode: string;
  tahunAkademik: string;
  status: string;
  keterangan: string;
  tanggalUpdate: string;
  errors: string[];
}

const VALID_STATUS = ['Aktif', 'Mengundurkan Diri', 'Tidak Ada Kabar', 'Batal Kuliah'];
const VALID_PERIODE = ['Gasal', 'Genap'];

export function parseRetensiExcel(file: File): Promise<ParsedRetensiRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const parsed: ParsedRetensiRow[] = rows.map((row, i) => {
          const errors: string[] = [];
          const nim = String(row['NIM'] ?? '').trim();
          const periode = String(row['Periode'] ?? '').trim();
          const tahunAkademik = String(row['Tahun Akademik'] ?? '').trim();
          const status = String(row['Status'] ?? '').trim();
          const keterangan = String(row['Keterangan'] ?? '').trim();
          const tanggalUpdate = String(row['Tanggal Update'] ?? '').trim();

          if (!nim) errors.push('NIM kosong');
          if (!VALID_PERIODE.includes(periode)) errors.push(`Periode "${periode}" tidak valid (Gasal/Genap)`);
          if (!tahunAkademik) errors.push('Tahun Akademik kosong');
          else if (!TAHUN_AKADEMIK_LIST.includes(tahunAkademik)) errors.push(`Tahun Akademik "${tahunAkademik}" tidak dikenali`);
          if (!VALID_STATUS.includes(status)) errors.push(`Status "${status}" tidak valid`);
          else if (status !== 'Aktif' && !keterangan) errors.push('Keterangan wajib diisi untuk status non-aktif');
          if (!tanggalUpdate) errors.push('Tanggal Update kosong');

          return { rowNum: i + 2, nim, periode, tahunAkademik, status, keterangan, tanggalUpdate, errors };
        });

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}