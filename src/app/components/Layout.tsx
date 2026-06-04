import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Menu,
  X,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/retensi', label: 'Data Retensi', icon: FileSpreadsheet },
  { to: '/mahasiswa', label: 'Data Mahasiswa', icon: Users },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white text-sm leading-tight" style={{ fontWeight: 600 }}>SIREMA</p>
            <p className="text-white/50 text-xs leading-tight">Sistem Retensi Mahasiswa</p>
          </div>
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
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
                  <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white'}`} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
                </>
              )}
            </NavLink>
          ))}

          <div className="pt-4">
            <p className="text-xs text-white/30 px-2 pb-2 uppercase tracking-wider">Segera Hadir</p>
            {['Laporan Analitik', 'Import Excel', 'Pengaturan'].map((label) => (
              <div
                key={label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/25 cursor-not-allowed"
              >
                <div className="w-4.5 h-4.5 rounded bg-white/10 flex-shrink-0" />
                <span>{label}</span>
                <span className="ml-auto text-[10px] bg-white/10 text-white/30 px-1.5 py-0.5 rounded">Soon</span>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-white/30 text-xs">v1.0.0 · T.A. 2025/2026</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <GraduationCap className="w-4 h-4 text-blue-600 lg:hidden" />
            <span className="hidden lg:inline">Universitas LIA</span>
            <span className="lg:hidden text-gray-800 font-medium">SIREMA</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-800" style={{ fontWeight: 500 }}>Admin BAK</p>
              <p className="text-xs text-gray-400">Biro Administrasi Kemahasiswaan</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs" style={{ fontWeight: 600 }}>
              AB
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
