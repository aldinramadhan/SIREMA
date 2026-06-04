import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

const BASE = "/make-server-7bb9b8c8";

app.get(`${BASE}/health`, (c) => c.json({ status: "ok" }));

// ── Auth ───────────────────────────────────────────────────────────────────

// Register a new user — hanya bisa dipanggil oleh user yang sudah login
app.post(`${BASE}/auth/signup`, async (c) => {
  try {
    // Verifikasi pemanggil sudah login dengan token yang valid
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) {
      return c.json({ error: "Unauthorized: hanya pengguna yang sudah login yang dapat mendaftarkan akun baru." }, 401);
    }
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: { user: callerUser }, error: authError } = await supabaseAnon.auth.getUser(accessToken);
    if (authError || !callerUser) {
      console.log("Signup auth check failed:", authError);
      return c.json({ error: "Unauthorized: sesi tidak valid. Silakan login ulang." }, 401);
    }

    const { email, password, name } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: "email, password, dan name wajib diisi" }, 400);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true,
    });
    if (error) {
      console.log("Signup error:", error);
      return c.json({ error: `Gagal mendaftarkan pengguna: ${error.message}` }, 400);
    }
    return c.json({ id: data.user?.id, email: data.user?.email, name }, 201);
  } catch (err) {
    console.log("Signup exception:", err);
    return c.json({ error: `Signup error: ${err}` }, 500);
  }
});

// ── Seed (idempotent) ──────────────────────────────────────────────────────
app.post(`${BASE}/seed`, async (c) => {
  try {
    const initialized = await kv.get("sirema:initialized");
    if (initialized) {
      return c.json({ seeded: false, message: "Already initialized" });
    }
    const { mahasiswa = [], retensi = [] } = await c.req.json();
    if (mahasiswa.length > 0) {
      await kv.mset(
        mahasiswa.map((m: any) => `mahasiswa:${m.id}`),
        mahasiswa
      );
    }
    if (retensi.length > 0) {
      await kv.mset(
        retensi.map((r: any) => `retensi:${r.id}`),
        retensi
      );
    }
    await kv.set("sirema:initialized", true);
    return c.json({ seeded: true, mahasiswaCount: mahasiswa.length, retensiCount: retensi.length });
  } catch (err) {
    console.log("Seed error:", err);
    return c.json({ error: `Seed error: ${err}` }, 500);
  }
});

// ── Mahasiswa ──────────────────────────────────────────────────────────────

app.get(`${BASE}/mahasiswa`, async (c) => {
  try {
    const data = await kv.getByPrefix("mahasiswa:");
    return c.json(data);
  } catch (err) {
    console.log("Get mahasiswa error:", err);
    return c.json({ error: `Failed to get mahasiswa: ${err}` }, 500);
  }
});

// /bulk must be registered before /:id to avoid route conflict
app.post(`${BASE}/mahasiswa/bulk`, async (c) => {
  try {
    const { toAdd = [], toUpdate = [] } = await c.req.json();
    const all = [...toAdd, ...toUpdate];
    if (all.length > 0) {
      await kv.mset(
        all.map((m: any) => `mahasiswa:${m.id}`),
        all
      );
    }
    return c.json({ added: toAdd.length, updated: toUpdate.length });
  } catch (err) {
    console.log("Bulk mahasiswa error:", err);
    return c.json({ error: `Bulk mahasiswa error: ${err}` }, 500);
  }
});

app.post(`${BASE}/mahasiswa`, async (c) => {
  try {
    const m = await c.req.json();
    await kv.set(`mahasiswa:${m.id}`, m);
    return c.json(m, 201);
  } catch (err) {
    console.log("Create mahasiswa error:", err);
    return c.json({ error: `Failed to create mahasiswa: ${err}` }, 500);
  }
});

app.put(`${BASE}/mahasiswa/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const m = await c.req.json();
    await kv.set(`mahasiswa:${id}`, m);
    return c.json(m);
  } catch (err) {
    console.log("Update mahasiswa error:", err);
    return c.json({ error: `Failed to update mahasiswa: ${err}` }, 500);
  }
});

app.delete(`${BASE}/mahasiswa/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`mahasiswa:${id}`);
    // Cascade: also delete all retensi records for this mahasiswa
    const retensiList: any[] = await kv.getByPrefix("retensi:");
    const toDelete = retensiList.filter((r: any) => r.mahasiswaId === id);
    if (toDelete.length > 0) {
      await kv.mdel(toDelete.map((r: any) => `retensi:${r.id}`));
    }
    return c.json({ deleted: true, retensiDeleted: toDelete.length });
  } catch (err) {
    console.log("Delete mahasiswa error:", err);
    return c.json({ error: `Failed to delete mahasiswa: ${err}` }, 500);
  }
});

// ── Retensi ────────────────────────────────────────────────────────────────

app.get(`${BASE}/retensi`, async (c) => {
  try {
    const data = await kv.getByPrefix("retensi:");
    return c.json(data);
  } catch (err) {
    console.log("Get retensi error:", err);
    return c.json({ error: `Failed to get retensi: ${err}` }, 500);
  }
});

app.post(`${BASE}/retensi/bulk`, async (c) => {
  try {
    const { toAdd = [], toUpdate = [] } = await c.req.json();
    const all = [...toAdd, ...toUpdate];
    if (all.length > 0) {
      await kv.mset(
        all.map((r: any) => `retensi:${r.id}`),
        all
      );
    }
    return c.json({ added: toAdd.length, updated: toUpdate.length });
  } catch (err) {
    console.log("Bulk retensi error:", err);
    return c.json({ error: `Bulk retensi error: ${err}` }, 500);
  }
});

app.post(`${BASE}/retensi`, async (c) => {
  try {
    const r = await c.req.json();
    await kv.set(`retensi:${r.id}`, r);
    return c.json(r, 201);
  } catch (err) {
    console.log("Create retensi error:", err);
    return c.json({ error: `Failed to create retensi: ${err}` }, 500);
  }
});

app.put(`${BASE}/retensi/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const r = await c.req.json();
    await kv.set(`retensi:${id}`, r);
    return c.json(r);
  } catch (err) {
    console.log("Update retensi error:", err);
    return c.json({ error: `Failed to update retensi: ${err}` }, 500);
  }
});

app.delete(`${BASE}/retensi/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`retensi:${id}`);
    return c.json({ deleted: true });
  } catch (err) {
    console.log("Delete retensi error:", err);
    return c.json({ error: `Failed to delete retensi: ${err}` }, 500);
  }
});

// ── Import Logs ────────────────────────────────────────────────────────────

app.get(`${BASE}/import-logs`, async (c) => {
  try {
    const data: any[] = await kv.getByPrefix("importlog:");
    data.sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
    return c.json(data);
  } catch (err) {
    console.log("Get import logs error:", err);
    return c.json({ error: `Failed to get import logs: ${err}` }, 500);
  }
});

app.post(`${BASE}/import-logs`, async (c) => {
  try {
    const log = await c.req.json();
    await kv.set(`importlog:${log.id}`, log);
    return c.json(log, 201);
  } catch (err) {
    console.log("Create import log error:", err);
    return c.json({ error: `Failed to create import log: ${err}` }, 500);
  }
});

app.delete(`${BASE}/import-logs/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`importlog:${id}`);
    return c.json({ deleted: true });
  } catch (err) {
    console.log("Delete import log error:", err);
    return c.json({ error: `Failed to delete import log: ${err}` }, 500);
  }
});

// Clear ALL import logs — registered after /:id to avoid shadowing
app.delete(`${BASE}/import-logs`, async (c) => {
  try {
    const logs: any[] = await kv.getByPrefix("importlog:");
    if (logs.length > 0) {
      await kv.mdel(logs.map((l: any) => `importlog:${l.id}`));
    }
    return c.json({ cleared: true, count: logs.length });
  } catch (err) {
    console.log("Clear import logs error:", err);
    return c.json({ error: `Failed to clear import logs: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
