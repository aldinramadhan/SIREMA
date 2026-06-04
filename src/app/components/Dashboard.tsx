import { useMemo } from 'react';
import { Link } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { Users, UserCheck, UserX, TrendingDown, ArrowRight, AlertTriangle } from 'lucide-react';
import { Mahasiswa, RetensiRecord } from '../types';

interface DashboardProps {
  mahasiswa: Mahasiswa[];
  retensi: RetensiRecord[];
}

const STATUS_COLORS = {
  Aktif: '#22c55e',
  'Mengundurkan Diri': '#f97316',
  'Tidak Ada Kabar': '#eab308',
  'Batal Kuliah': '#ef4444',
};

const TAHUN_LABELS: Record<string, string> = {
  '2021/2022': '21/22',
  '2022/2023': '22/23',
  '2023/2024': '23/24',
  '2024/2025': '24/25',
  '2025/2026': '25/26',
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-gray-900" style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2 }}>
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ mahasiswa, retensi }: DashboardProps) {
  const latestPeriod = useMemo(() => {
    const sorted = [...retensi].sort((a, b) =>
      b.tahunAkademik.localeCompare(a.tahunAkademik) ||
      (b.periode === 'Genap' ? 1 : -1)
    );
    if (!sorted[0]) return null;
    return { tahunAkademik: sorted[0].tahunAkademik, periode: sorted[0].periode };
  }, [retensi]);

  const latestRetensi = useMemo(() => {
    if (!latestPeriod) return [];
    return retensi.filter(
      (r) => r.tahunAkademik === latestPeriod.tahunAkademik && r.periode === latestPeriod.periode
    );
  }, [retensi, latestPeriod]);

  const stats = useMemo(() => {
    const aktif = latestRetensi.filter((r) => r.status === 'Aktif').length;
    const mundur = latestRetensi.filter((r) => r.status === 'Mengundurkan Diri').length;
    const tidakKabar = latestRetensi.filter((r) => r.status === 'Tidak Ada Kabar').length;
    const batal = latestRetensi.filter((r) => r.status === 'Batal Kuliah').length;
    const total = latestRetensi.length;
    return { aktif, mundur, tidakKabar, batal, total };
  }, [latestRetensi]);

  // Bar chart: per tahun akademik + periode
  const barData = useMemo(() => {
    const tahunList = ['2021/2022', '2022/2023', '2023/2024', '2024/2025', '2025/2026'];
    return tahunList.flatMap((tahun) =>
      (['Gasal', 'Genap'] as const).map((periode) => {
        const filtered = retensi.filter(
          (r) => r.tahunAkademik === tahun && r.periode === periode
        );
        if (filtered.length === 0) return null;
        return {
          name: `${TAHUN_LABELS[tahun]} ${periode.slice(0, 2)}`,
          Aktif: filtered.filter((r) => r.status === 'Aktif').length,
          'Non-Aktif': filtered.filter((r) => r.status !== 'Aktif').length,
        };
      }).filter(Boolean)
    );
  }, [retensi]);

  // Pie chart: non-aktif breakdown latest period
  const pieData = useMemo(() => {
    const nonAktif = [
      { name: 'Mengundurkan Diri', value: stats.mundur },
      { name: 'Tidak Ada Kabar', value: stats.tidakKabar },
      { name: 'Batal Kuliah', value: stats.batal },
    ].filter((d) => d.value > 0);
    return nonAktif;
  }, [stats]);

  // Line chart: retention rate per tahun
  const lineData = useMemo(() => {
    const tahunList = ['2021/2022', '2022/2023', '2023/2024', '2024/2025', '2025/2026'];
    return tahunList
      .map((tahun) => {
        const filtered = retensi.filter((r) => r.tahunAkademik === tahun);
        if (filtered.length === 0) return null;
        const aktif = filtered.filter((r) => r.status === 'Aktif').length;
        const rate = ((aktif / filtered.length) * 100).toFixed(1);
        return { tahun: TAHUN_LABELS[tahun], rate: parseFloat(rate) };
      })
      .filter(Boolean);
  }, [retensi]);

  // Recent non-aktif
  const recentNonAktif = useMemo(() => {
    const mhsMap = new Map(mahasiswa.map((m) => [m.id, m]));
    return retensi
      .filter((r) => r.status !== 'Aktif')
      .sort((a, b) => b.tanggalUpdate.localeCompare(a.tanggalUpdate))
      .slice(0, 5)
      .map((r) => ({ ...r, mhs: mhsMap.get(r.mahasiswaId) }));
  }, [retensi, mahasiswa]);

  const retentionRate = stats.total > 0
    ? ((stats.aktif / stats.total) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900">Dashboard Retensi</h1>
        {latestPeriod && (
          <p className="text-gray-500 text-sm mt-0.5">
            Periode aktif: <span className="text-blue-600" style={{ fontWeight: 500 }}>{latestPeriod.periode} {latestPeriod.tahunAkademik}</span>
          </p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label="Total Terdaftar"
          value={stats.total}
          sub={`Periode ini`}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label="Mahasiswa Aktif"
          value={stats.aktif}
          sub={`${retentionRate}% retention rate`}
          icon={UserCheck}
          color="bg-green-500"
        />
        <StatCard
          label="Non-Aktif"
          value={stats.mundur + stats.tidakKabar + stats.batal}
          sub="Periode ini"
          icon={UserX}
          color="bg-red-500"
        />
        <StatCard
          label="Total Mahasiswa"
          value={mahasiswa.length}
          sub="Seluruh angkatan"
          icon={TrendingDown}
          color="bg-purple-500"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-gray-900 mb-4">Aktif vs Non-Aktif per Semester</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Aktif" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Non-Aktif" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-gray-900 mb-1">Alasan Non-Aktif</h3>
          <p className="text-xs text-gray-400 mb-3">Periode terkini</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: STATUS_COLORS[d.name as keyof typeof STATUS_COLORS] }}
                      />
                      <span className="text-gray-600 truncate max-w-[130px]">{d.name}</span>
                    </div>
                    <span className="text-gray-800" style={{ fontWeight: 500 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <UserCheck className="w-8 h-8 text-green-400 mb-2" />
              <p className="text-sm">Semua mahasiswa aktif</p>
            </div>
          )}
        </div>
      </div>

      {/* Retention rate trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-gray-900 mb-4">Tren Tingkat Retensi per Tahun Akademik (%)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={lineData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="tahun" tick={{ fontSize: 11 }} />
            <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v}%`, 'Retention Rate']} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent non-aktif */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h3 className="text-gray-900">Perubahan Status Non-Aktif Terbaru</h3>
          </div>
          <Link
            to="/retensi"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Lihat semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {recentNonAktif.length === 0 ? (
          <p className="text-gray-400 text-sm">Tidak ada data non-aktif.</p>
        ) : (
          <div className="space-y-2">
            {recentNonAktif.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-sm"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 flex-shrink-0" style={{ fontWeight: 600 }}>
                  {r.mhs?.nama?.slice(0, 2).toUpperCase() ?? '??'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 truncate" style={{ fontWeight: 500 }}>{r.mhs?.nama ?? '-'}</p>
                  <p className="text-gray-400 text-xs">{r.mhs?.nim} · {r.mhs?.programStudi}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor:
                        r.status === 'Mengundurkan Diri' ? '#fff7ed' :
                        r.status === 'Tidak Ada Kabar' ? '#fefce8' : '#fef2f2',
                      color:
                        r.status === 'Mengundurkan Diri' ? '#c2410c' :
                        r.status === 'Tidak Ada Kabar' ? '#92400e' : '#b91c1c',
                      fontWeight: 500,
                    }}
                  >
                    {r.status}
                  </span>
                  <p className="text-gray-400 text-xs mt-0.5">{r.tanggalUpdate}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
