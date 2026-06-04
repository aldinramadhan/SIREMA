import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Mahasiswa, RetensiRecord, ImportLog } from '../types';

// ── Supabase Auth client (singleton) ──────────────────────────────────────
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
);

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export const signIn = async (email: string, password: string): Promise<AuthUser> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const user = data.session?.user;
  if (!user) throw new Error('Login gagal: tidak ada sesi.');
  return {
    id: user.id,
    email: user.email ?? email,
    name: (user.user_metadata?.name as string) ?? email,
  };
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const getSession = async (): Promise<AuthUser | null> => {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.name as string) ?? user.email ?? '',
  };
};

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7bb9b8c8`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? `API error ${res.status}`);
  }
  return data as T;
}

export const registerUser = async (payload: { email: string; password: string; name: string }) => {
  // Kirim access token user yang sedang login agar server bisa memverifikasi
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Sesi tidak ditemukan. Silakan login ulang.');
  return request<{ id: string; email: string; name: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Authorization': `Bearer ${token}` },
  });
};

// ── Seed ──────────────────────────────────────────────────────────────────
export const seedData = (mahasiswa: Mahasiswa[], retensi: RetensiRecord[]) =>
  request<{ seeded: boolean; message?: string }>('/seed', {
    method: 'POST',
    body: JSON.stringify({ mahasiswa, retensi }),
  });

// ── Mahasiswa ─────────────────────────────────────────────────────────────
export const getMahasiswa = () => request<Mahasiswa[]>('/mahasiswa');

export const createMahasiswa = (m: Mahasiswa) =>
  request<Mahasiswa>('/mahasiswa', { method: 'POST', body: JSON.stringify(m) });

export const updateMahasiswa = (m: Mahasiswa) =>
  request<Mahasiswa>(`/mahasiswa/${m.id}`, { method: 'PUT', body: JSON.stringify(m) });

export const deleteMahasiswaById = (id: string) =>
  request<{ deleted: boolean }>(`/mahasiswa/${id}`, { method: 'DELETE' });

export const bulkMahasiswa = (toAdd: Mahasiswa[], toUpdate: Mahasiswa[]) =>
  request<{ added: number; updated: number }>('/mahasiswa/bulk', {
    method: 'POST',
    body: JSON.stringify({ toAdd, toUpdate }),
  });

// ── Retensi ───────────────────────────────────────────────────────────────
export const getRetensi = () => request<RetensiRecord[]>('/retensi');

export const createRetensi = (r: RetensiRecord) =>
  request<RetensiRecord>('/retensi', { method: 'POST', body: JSON.stringify(r) });

export const updateRetensi = (r: RetensiRecord) =>
  request<RetensiRecord>(`/retensi/${r.id}`, { method: 'PUT', body: JSON.stringify(r) });

export const deleteRetensiById = (id: string) =>
  request<{ deleted: boolean }>(`/retensi/${id}`, { method: 'DELETE' });

export const bulkRetensi = (toAdd: RetensiRecord[], toUpdate: RetensiRecord[]) =>
  request<{ added: number; updated: number }>('/retensi/bulk', {
    method: 'POST',
    body: JSON.stringify({ toAdd, toUpdate }),
  });

// ── Import Logs ───────────────────────────────────────────────────────────
export const getImportLogs = () => request<ImportLog[]>('/import-logs');

export const createImportLog = (log: ImportLog) =>
  request<ImportLog>('/import-logs', { method: 'POST', body: JSON.stringify(log) });

export const deleteImportLog = (id: string) =>
  request<{ deleted: boolean }>(`/import-logs/${id}`, { method: 'DELETE' });

export const clearImportLogs = () =>
  request<{ cleared: boolean }>('/import-logs', { method: 'DELETE' });
