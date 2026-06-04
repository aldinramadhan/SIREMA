import { useState, useEffect } from 'react';
import { useLocation, NavLink } from 'react-router';
import {
  LayoutDashboard, Users, FileSpreadsheet, Menu, X, GraduationCap, ChevronRight,
  History, AlertCircle, Loader2, RefreshCw, LogOut, UserPlus,
} from 'lucide-react';
import { Mahasiswa, RetensiRecord, ImportLog } from '../types';
import { initialMahasiswa, initialRetensi } from '../data/mockData';
import * as api from '../utils/api';
import type { AuthUser } from '../App';
import { Dashboard } from './Dashboard';
import { RetensiPage } from './RetensiPage';
import { MahasiswaPage } from './MahasiswaPage';
import { ImportLogPage } from './ImportLogPage';
import { UserManagementPage } from './UserManagementPage';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/retensi', label: 'Data Retensi', icon: FileSpreadsheet },
  { to: '/mahasiswa', label: 'Data Mahasiswa', icon: Users },
  { to: '/log-import', label: 'Log Import', icon: History },
  { to: '/pengguna', label: 'Manajemen Pengguna', icon: UserPlus },
];

interface MainAppProps {
  user: AuthUser;
  onLogout: () => void;
  onRegisterUser: (p: { email: string; password: string; name: string }) => Promise<void>;
}

export function MainApp({ user, onLogout, onRegisterUser }: MainAppProps) {
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>([]);
  const [retensi, setRetensi] = useState<RetensiRecord[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const location = useLocation();

  // Load all data from Supabase on mount; seed mock data if DB is empty
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        await api.seedData(initialMahasiswa, initialRetensi);
        const [mhs, ret, logs] = await Promise.all([
          api.getMahasiswa(),
          api.getRetensi(),
          api.getImportLogs(),
        ]);
        if (!cancelled) {
          setMahasiswa(mhs);
          setRetensi(ret);
          setImportLogs(logs);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Gagal memuat data dari server');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [retryCount]);

  // Fire-and-forget helper: runs async API call, shows error banner on failure
  const sync = (fn: () => Promise<unknown>) => {
    fn().catch((err) => {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan ke server';
      setSyncError(msg);
      setTimeout(() => setSyncError(null), 7000);
    });
  };

  // ── Mahasiswa CRUD ────────────────────────────────────────────────────────
  const addMahasiswa = (m: Mahasiswa) => {
    setMahasiswa((prev) => [...prev, m]);
    sync(() => api.createMahasiswa(m));
  };
  const editMahasiswa = (m: Mahasiswa) => {
    setMahasiswa((prev) => prev.map((x) => (x.id === m.id ? m : x)));
    sync(() => api.updateMahasiswa(m));
  };
  const deleteMahasiswa = (id: string) => {
    setMahasiswa((prev) => prev.filter((x) => x.id !== id));
    setRetensi((prev) => prev.filter((r) => r.mahasiswaId !== id));
    sync(() => api.deleteMahasiswaById(id));
  };
  const importMahasiswa = (
    toAdd: Mahasiswa[],
    toUpdate: Mahasiswa[],
    logData: Omit<ImportLog, 'id'>
  ) => {
    const log: ImportLog = { id: `LOG_${Date.now()}`, ...logData };
    setMahasiswa((prev) => {
      let updated = [...prev, ...toAdd];
      for (const upd of toUpdate) {
        updated = updated.map((x) => (x.id === upd.id ? upd : x));
      }
      return updated;
    });
    setImportLogs((prev) => [log, ...prev]);
    sync(async () => {
      await api.bulkMahasiswa(toAdd, toUpdate);
      await api.createImportLog(log);
    });
  };

  // ── Retensi CRUD ──────────────────────────────────────────────────────────
  const addRetensi = (r: RetensiRecord) => {
    setRetensi((prev) => [...prev, r]);
    sync(() => api.createRetensi(r));
  };
  const editRetensi = (r: RetensiRecord) => {
    setRetensi((prev) => prev.map((x) => (x.id === r.id ? r : x)));
    sync(() => api.updateRetensi(r));
  };
  const deleteRetensi = (id: string) => {
    setRetensi((prev) => prev.filter((x) => x.id !== id));
    sync(() => api.deleteRetensiById(id));
  };
  const importRetensi = (
    toAdd: RetensiRecord[],
    toUpdate: RetensiRecord[],
    logData: Omit<ImportLog, 'id'>
  ) => {
    const log: ImportLog = { id: `LOG_${Date.now()}`, ...logData };
    setRetensi((prev) => {
      let updated = [...prev, ...toAdd];
      for (const upd of toUpdate) {
        updated = updated.map((x) => (x.id === upd.id ? upd : x));
      }
      return updated;
    });
    setImportLogs((prev) => [log, ...prev]);
    sync(async () => {
      await api.bulkRetensi(toAdd, toUpdate);
      await api.createImportLog(log);
    });
  };

  // ── Log CRUD ──────────────────────────────────────────────────────────────
  const deleteLog = (id: string) => {
    setImportLogs((prev) => prev.filter((l) => l.id !== id));
    sync(() => api.deleteImportLog(id));
  };
  const clearAllLogs = () => {
    setImportLogs([]);
    sync(() => api.clearImportLogs());
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-gray-800 text-sm" style={{ fontWeight: 600 }}>SIREMA</p>
            <p className="text-gray-400 text-xs mt-0.5">Memuat data dari Supabase…</p>
          </div>
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // ── Load error screen ─────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-gray-800 mb-1" style={{ fontWeight: 600 }}>Gagal Memuat Data</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">{loadError}</p>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-5 py-2.5 text-sm hover:bg-blue-700 transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ── Routing ───────────────────────────────────────────────────────────────
  const path = location.pathname;
  const isRetensi = path === '/retensi';
  const isMahasiswa = path === '/mahasiswa';
  const isLog = path === '/log-import';
  const isPengguna = path === '/pengguna';

  const pageLabel = isRetensi ? 'Data Retensi'
    : isMahasiswa ? 'Data Mahasiswa'
    : isLog ? 'Log Import'
    : isPengguna ? 'Manajemen Pengguna'
    : 'Dashboard';

  // Initials for avatar
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sync error banner */}
      {syncError && (
        <div className="fixed top-4 right-4 z-50 flex items-start gap-3 bg-red-600 text-white rounded-xl shadow-xl px-4 py-3 max-w-xs text-sm animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p style={{ fontWeight: 600 }}>Sinkronisasi gagal</p>
            <p className="text-red-200 text-xs mt-0.5 leading-snug">{syncError}</p>
          </div>
          <button onClick={() => setSyncError(null)} className="text-red-300 hover:text-white flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#1a2340] text-white z-30 flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto lg:flex-shrink-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm leading-tight truncate" style={{ fontWeight: 600 }}>SIREMA</p>
            <p className="text-white/50 text-xs leading-tight truncate">Sistem Retensi Mahasiswa</p>
          </div>
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white flex-shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-xs text-white/30 px-2 pb-2 uppercase tracking-wider">Menu Utama</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white'}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.to === '/log-import' && importLogs.length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-blue-500 text-white'}`}>
                      {importLogs.length}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
                </>
              )}
            </NavLink>
          ))}

          <div className="pt-4">
            <p className="text-xs text-white/30 px-2 pb-2 uppercase tracking-wider">Segera Hadir</p>
            {[
              { label: 'Laporan Analitik', desc: 'Grafik mendalam per prodi & angkatan' },
              { label: 'Notifikasi Otomatis', desc: 'Kirim pesan ke mahasiswa non-aktif' },
              { label: 'Pengaturan', desc: 'Konfigurasi sistem' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 px-3 py-2 rounded-lg text-sm text-white/25 cursor-not-allowed"
                title={item.desc}
              >
                <div className="w-4 h-4 rounded bg-white/10 flex-shrink-0 mt-0.5" />
                <p className="truncate">{item.label}</p>
                <span className="ml-auto text-[10px] bg-white/10 text-white/30 px-1.5 py-0.5 rounded flex-shrink-0">Soon</span>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer — shows Supabase connection status */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
            <p className="text-white/40 text-xs">Terhubung ke Supabase</p>
          </div>
          <p className="text-white/30 text-xs">v1.2.0 · T.A. 2025/2026</p>
          <p className="text-white/20 text-xs mt-0.5">Universitas LIA</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="hidden lg:inline text-gray-800" style={{ fontWeight: 500 }}>Universitas LIA</span>
            <span className="hidden lg:inline text-gray-300">·</span>
            <span className="hidden lg:inline text-gray-500">{pageLabel}</span>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-800 truncate max-w-[140px]" style={{ fontWeight: 500 }}>{user.name}</p>
              <p className="text-xs text-gray-400 truncate max-w-[140px]">{user.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700 }}>
              {initials}
            </div>
            <button
              onClick={onLogout}
              title="Keluar"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {!isRetensi && !isMahasiswa && !isLog && !isPengguna && (
            <Dashboard mahasiswa={mahasiswa} retensi={retensi} />
          )}
          {isRetensi && (
            <RetensiPage
              mahasiswa={mahasiswa}
              retensi={retensi}
              onAdd={addRetensi}
              onEdit={editRetensi}
              onDelete={deleteRetensi}
              onImport={importRetensi}
              currentUserName={user.name}
            />
          )}
          {isMahasiswa && (
            <MahasiswaPage
              mahasiswa={mahasiswa}
              retensi={retensi}
              onAdd={addMahasiswa}
              onEdit={editMahasiswa}
              onDelete={deleteMahasiswa}
              onImport={importMahasiswa}
              currentUserName={user.name}
            />
          )}
          {isLog && (
            <ImportLogPage
              logs={importLogs}
              onDelete={deleteLog}
              onClearAll={clearAllLogs}
            />
          )}
          {isPengguna && (
            <UserManagementPage
              currentUser={user}
              onRegisterUser={onRegisterUser}
            />
          )}
        </main>
      </div>
    </div>
  );
}
