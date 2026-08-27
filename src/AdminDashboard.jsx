import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Inbox,
  ShieldCheck,
  Users,
  Bell,
  Check,
  X,
  Clock,
  Wrench,
  AlertTriangle,
  MessageSquare,
  Package,
  Phone,
  Truck,
  Search,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { supabase } from "./supabaseClient";

const TOKENS = {
  ink: "#16231B",
  bark: "#2E2117",
  barkLight: "#3D2B1F",
  panel: "#20180F",
  sawdust: "#F0E6D2",
  sawdustDim: "#C9BEA6",
  orange: "#E8590C",
  moss: "#6B8F5C",
  steel: "#8A9BA8",
};

const STATUS_STYLE = {
  new: { label: "Eingegangen", color: TOKENS.steel, icon: Clock },
  in_progress: { label: "In Bearbeitung", color: TOKENS.orange, icon: Wrench },
  done: { label: "Erledigt", color: TOKENS.moss, icon: Check },
};

const CATEGORY_ICON = {
  error_report: AlertTriangle,
  spare_part: Package,
  service_booking: MessageSquare,
};
const CATEGORY_LABEL = {
  error_report: "Störmeldung",
  spare_part: "Ersatzteil",
  service_booking: "Service-Termin",
};

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diffMs / 3_600_000);
  if (h < 1) return "vor <1 Std.";
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  return d === 1 ? "gestern" : `vor ${d} Tagen`;
}

// ---------------- Login ----------------

function LoginScreen({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Rolle prüfen: nur role = 'dealer' darf ins Admin-Dashboard
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || profile?.role !== "dealer") {
      setError("Dieses Konto hat keinen Dealer-Zugang.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setLoading(false);
    onLoggedIn();
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center" style={{ background: TOKENS.ink }}>
      <form onSubmit={handleLogin} className="w-80 rounded-md p-6" style={{ background: TOKENS.barkLight, border: `1px solid ${TOKENS.sawdustDim}22` }}>
        <p className="text-[10px] tracking-[0.25em] uppercase font-semibold" style={{ color: TOKENS.orange }}>
          Ágaprítógépek Miskolc
        </p>
        <p className="text-sm font-bold mt-0.5 mb-5" style={{ color: TOKENS.sawdust, fontFamily: "Oswald, sans-serif" }}>
          Verwaltungs-Login
        </p>
        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-2 px-3 py-2 rounded-md text-xs"
          style={{ background: TOKENS.panel, color: TOKENS.sawdust, border: `1px solid ${TOKENS.sawdustDim}22` }}
          required
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-md text-xs"
          style={{ background: TOKENS.panel, color: TOKENS.sawdust, border: `1px solid ${TOKENS.sawdustDim}22` }}
          required
        />
        {error && <p className="text-[11px] mb-3" style={{ color: "#C5644F" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-2"
          style={{ background: TOKENS.orange, color: "white" }}
        >
          {loading && <Loader2 size={13} className="animate-spin" />}
          Anmelden
        </button>
      </form>
    </div>
  );
}

// ---------------- Layout ----------------

function Sidebar({ active, setActive, pendingCount, openCount, onLogout }) {
  const items = [
    { id: "overview", label: "Übersicht", icon: LayoutDashboard },
    { id: "requests", label: "Anfragen", icon: Inbox, badge: openCount },
    { id: "devices", label: "Geräte-Freigaben", icon: ShieldCheck, badge: pendingCount },
    { id: "customers", label: "Kunden", icon: Users },
  ];
  return (
    <div className="w-56 flex-shrink-0 flex flex-col" style={{ background: TOKENS.bark, borderRight: `1px solid ${TOKENS.sawdustDim}1a` }}>
      <div className="px-5 py-6">
        <p className="text-[10px] tracking-[0.25em] uppercase font-semibold" style={{ color: TOKENS.orange }}>
          Ágaprítógépek Miskolc
        </p>
        <p className="text-sm font-bold mt-0.5" style={{ color: TOKENS.sawdust, fontFamily: "Oswald, sans-serif" }}>
          Verwaltung
        </p>
      </div>
      <div className="px-3 flex-1">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setActive(it.id)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md mb-1 text-left"
              style={{ background: isActive ? `${TOKENS.orange}1f` : "transparent" }}
            >
              <span className="flex items-center gap-2.5">
                <Icon size={16} color={isActive ? TOKENS.orange : TOKENS.sawdustDim} />
                <span className="text-[13px] font-medium" style={{ color: isActive ? TOKENS.sawdust : TOKENS.sawdustDim }}>
                  {it.label}
                </span>
              </span>
              {!!it.badge && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: TOKENS.orange, color: "white" }}
                >
                  {it.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <button onClick={onLogout} className="mx-3 mb-5 text-[11px] text-left px-3 py-2" style={{ color: TOKENS.sawdustDim }}>
        Abmelden
      </button>
    </div>
  );
}

function TopBar({ title }) {
  return (
    <div className="h-16 flex items-center justify-between px-6 flex-shrink-0" style={{ borderBottom: `1px solid ${TOKENS.sawdustDim}1a` }}>
      <h1 className="text-lg font-bold" style={{ color: TOKENS.sawdust, fontFamily: "Oswald, sans-serif" }}>
        {title}
      </h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-md px-3 py-2 w-64" style={{ background: TOKENS.barkLight, border: `1px solid ${TOKENS.sawdustDim}22` }}>
          <Search size={14} color={TOKENS.sawdustDim} />
          <span className="text-xs" style={{ color: TOKENS.sawdustDim }}>Kunde, Gerät oder Anfrage suchen…</span>
        </div>
        <Bell size={17} color={TOKENS.sawdustDim} />
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: TOKENS.orange, color: "white" }}>
          B
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="rounded-md p-4 flex-1" style={{ background: TOKENS.barkLight, border: `1px solid ${TOKENS.sawdustDim}22` }}>
      <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: TOKENS.sawdustDim }}>{label}</p>
      <p className="text-2xl font-bold mt-1.5" style={{ color: color || TOKENS.sawdust, fontFamily: "Oswald, sans-serif" }}>
        {value}
      </p>
      {sub && <p className="text-[11px] mt-1" style={{ color: TOKENS.sawdustDim }}>{sub}</p>}
    </div>
  );
}

// ---------------- Panels (fed by props from AdminDashboard's central data fetch) ----------------

function OverviewPanel({ setActive, pendingDevices, tickets, customers }) {
  const openTickets = tickets.filter((t) => t.status !== "done").length;
  return (
    <div className="p-6">
      <div className="flex gap-4">
        <KpiCard label="Offene Anfragen" value={openTickets} sub={`von ${tickets.length} gesamt`} color={TOKENS.orange} />
        <KpiCard label="Ausstehende Freigaben" value={pendingDevices.length} sub="Geräte warten auf Prüfung" color={TOKENS.steel} />
        <KpiCard label="Aktive Kunden" value={customers.length} sub="mit registriertem Konto" />
        <KpiCard label="Registrierte Geräte" value={customers.reduce((s, c) => s + c.deviceCount, 0)} sub="insgesamt verknüpft" />
      </div>

      <div className="grid grid-cols-2 gap-5 mt-6">
        <div className="rounded-md p-5" style={{ background: TOKENS.barkLight, border: `1px solid ${TOKENS.sawdustDim}22` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: TOKENS.sawdust }}>Neue Geräte-Anmeldungen</p>
            <button onClick={() => setActive("devices")} className="text-xs flex items-center gap-1" style={{ color: TOKENS.orange }}>
              Alle prüfen <ChevronRight size={13} />
            </button>
          </div>
          {pendingDevices.slice(0, 3).map((d) => (
            <div key={d.id} className="flex items-center justify-between py-2.5" style={{ borderTop: `1px solid ${TOKENS.sawdustDim}14` }}>
              <div>
                <p className="text-xs font-medium" style={{ color: TOKENS.sawdust }}>{d.customer} · {d.model}</p>
                <p className="text-[11px]" style={{ color: TOKENS.sawdustDim }}>{d.serial} · {d.requestedAt}</p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded" style={{ color: TOKENS.steel, background: `${TOKENS.steel}1f` }}>
                Wird geprüft
              </span>
            </div>
          ))}
          {pendingDevices.length === 0 && (
            <p className="text-[11px] py-3" style={{ color: TOKENS.sawdustDim }}>Keine offenen Freigaben.</p>
          )}
        </div>

        <div className="rounded-md p-5" style={{ background: TOKENS.barkLight, border: `1px solid ${TOKENS.sawdustDim}22` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: TOKENS.sawdust }}>Neueste Kundenanfragen</p>
            <button onClick={() => setActive("requests")} className="text-xs flex items-center gap-1" style={{ color: TOKENS.orange }}>
              Alle ansehen <ChevronRight size={13} />
            </button>
          </div>
          {tickets.slice(0, 3).map((t) => {
            const s = STATUS_STYLE[t.status];
            return (
              <div key={t.id} className="flex items-center justify-between py-2.5" style={{ borderTop: `1px solid ${TOKENS.sawdustDim}14` }}>
                <p className="text-xs font-medium" style={{ color: TOKENS.sawdust }}>{t.customer} · {t.title}</p>
                <span className="text-[10px] px-2 py-1 rounded" style={{ color: s.color, background: `${s.color}1f` }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DevicesPanel({ pendingDevices, onDecide }) {
  const [busyId, setBusyId] = useState(null);

  async function decide(device, decision) {
    setBusyId(device.id);
    await onDecide(device, decision);
    setBusyId(null);
  }

  return (
    <div className="p-6">
      <p className="text-xs mb-4" style={{ color: TOKENS.sawdustDim }}>
        Gleiche Seriennummer und Kundenname mit euren Verkaufs-/Mietunterlagen ab, bevor du freigibst.
      </p>
      {pendingDevices.map((d) => (
        <div
          key={d.id}
          className="rounded-md p-4 mb-3 flex items-center justify-between"
          style={{ background: TOKENS.barkLight, border: `1px solid ${TOKENS.sawdustDim}22`, opacity: busyId === d.id ? 0.5 : 1 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: `${TOKENS.orange}22` }}>
              <Truck size={18} color={TOKENS.orange} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: TOKENS.sawdust }}>{d.customer}</p>
              <p className="text-xs mt-0.5" style={{ color: TOKENS.sawdustDim }}>
                {d.model} · {d.serial} · {d.ownership} · {d.requestedAt}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              disabled={busyId === d.id}
              onClick={() => decide(d, "rejected")}
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{ border: `1px solid ${TOKENS.sawdustDim}33` }}
            >
              <X size={15} color={TOKENS.sawdustDim} />
            </button>
            <button
              disabled={busyId === d.id}
              onClick={() => decide(d, "approved")}
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{ background: TOKENS.moss }}
            >
              <Check size={15} color="white" />
            </button>
          </div>
        </div>
      ))}
      {pendingDevices.length === 0 && (
        <p className="text-xs" style={{ color: TOKENS.sawdustDim }}>Aktuell keine Geräte zur Prüfung.</p>
      )}
    </div>
  );
}

function RequestsPanel({ tickets }) {
  const [filter, setFilter] = useState("alle");
  const filters = [
    { id: "alle", label: "Alle" },
    { id: "new", label: "Eingegangen" },
    { id: "in_progress", label: "In Bearbeitung" },
    { id: "done", label: "Erledigt" },
  ];
  const filtered = filter === "alle" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-4">
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={{
                background: active ? TOKENS.orange : TOKENS.barkLight,
                color: active ? "white" : TOKENS.sawdustDim,
                border: `1px solid ${active ? TOKENS.orange : TOKENS.sawdustDim + "22"}`,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${TOKENS.sawdustDim}22` }}>
        <div
          className="grid grid-cols-[1.4fr_1.4fr_1.6fr_1fr_1fr] px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold"
          style={{ background: TOKENS.panel, color: TOKENS.sawdustDim }}
        >
          <span>Kunde</span><span>Gerät</span><span>Thema</span><span>Datum</span><span>Status</span>
        </div>
        {filtered.map((t) => {
          const s = STATUS_STYLE[t.status];
          const Icon = s.icon;
          const CatIcon = CATEGORY_ICON[t.category];
          return (
            <div key={t.id} className="grid grid-cols-[1.4fr_1.4fr_1.6fr_1fr_1fr] items-center px-4 py-3 text-xs" style={{ background: TOKENS.barkLight, borderTop: `1px solid ${TOKENS.sawdustDim}14` }}>
              <span style={{ color: TOKENS.sawdust }}>{t.customer}</span>
              <span style={{ color: TOKENS.sawdustDim }}>{t.device}</span>
              <span className="flex items-center gap-1.5" style={{ color: TOKENS.sawdust }}>
                <CatIcon size={12} color={TOKENS.sawdustDim} /> {t.title}
              </span>
              <span style={{ color: TOKENS.sawdustDim }}>{t.date}</span>
              <span className="flex items-center gap-1 px-2 py-1 rounded w-fit" style={{ color: s.color, background: `${s.color}1f` }}>
                <Icon size={10} /> {s.label}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-4 py-4 text-xs" style={{ color: TOKENS.sawdustDim, background: TOKENS.barkLight }}>Keine Einträge.</p>
        )}
      </div>
    </div>
  );
}

function CustomersPanel({ customers }) {
  return (
    <div className="p-6">
      <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${TOKENS.sawdustDim}22` }}>
        <div className="grid grid-cols-[1.6fr_1.4fr_1fr_1.2fr] px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ background: TOKENS.panel, color: TOKENS.sawdustDim }}>
          <span>Name</span><span>E-Mail</span><span>Geräte</span><span>Sprache</span>
        </div>
        {customers.map((c) => (
          <div key={c.id} className="grid grid-cols-[1.6fr_1.4fr_1fr_1.2fr] items-center px-4 py-3 text-xs" style={{ background: TOKENS.barkLight, borderTop: `1px solid ${TOKENS.sawdustDim}14` }}>
            <span style={{ color: TOKENS.sawdust }}>{c.name}</span>
            <span style={{ color: TOKENS.sawdustDim }}>{c.email}</span>
            <span style={{ color: TOKENS.sawdustDim }}>{c.deviceCount}</span>
            <span style={{ color: TOKENS.sawdustDim }}>{c.language === "hu" ? "Magyar" : "Deutsch"}</span>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="px-4 py-4 text-xs" style={{ color: TOKENS.sawdustDim, background: TOKENS.barkLight }}>Noch keine Kunden registriert.</p>
        )}
      </div>
    </div>
  );
}

// ---------------- Root ----------------

export default function AdminDashboard() {
  const [session, setSession] = useState(undefined); // undefined = wird geladen, null = ausgeloggt
  const [active, setActive] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [pendingDevices, setPendingDevices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);

    const [devicesRes, requestsRes, usersRes] = await Promise.all([
      supabase
        .from("devices")
        .select("id, model_name, serial_number, ownership_type, created_at, owner:owner_user_id(name)")
        .eq("approval_status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("requests")
        .select("id, type, description, status, created_at, customer:customer_id(name), device:device_id(model_name)")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("users")
        .select("id, name, email, language, devices(count)")
        .eq("role", "customer"),
    ]);

    if (!devicesRes.error) {
      setPendingDevices(
        devicesRes.data.map((d) => ({
          id: d.id,
          customer: d.owner?.name || "Unbekannt",
          model: d.model_name,
          serial: d.serial_number,
          ownership: d.ownership_type === "rented" ? "Gemietet" : "Gekauft",
          requestedAt: timeAgo(d.created_at),
        }))
      );
    }

    if (!requestsRes.error) {
      setTickets(
        requestsRes.data.map((t) => ({
          id: t.id,
          customer: t.customer?.name || "Unbekannt",
          device: t.device?.model_name || "-",
          title: t.description?.slice(0, 40) || CATEGORY_LABEL[t.type],
          category: t.type,
          status: t.status,
          date: new Date(t.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" }),
        }))
      );
    }

    if (!usersRes.error) {
      setCustomers(
        usersRes.data.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          language: u.language,
          deviceCount: u.devices?.[0]?.count ?? 0,
        }))
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) loadData();
  }, [session, loadData]);

  async function handleDecide(device, decision) {
    const { error } = await supabase
      .from("devices")
      .update({
        approval_status: decision,
        status: decision === "approved" ? "active" : "returned",
      })
      .eq("id", device.id);

    if (!error) {
      setPendingDevices((prev) => prev.filter((d) => d.id !== device.id));
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (session === undefined) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: TOKENS.ink }}>
        <Loader2 className="animate-spin" color={TOKENS.sawdustDim} />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLoggedIn={() => {}} />;
  }

  const openCount = tickets.filter((t) => t.status !== "done").length;
  const titles = {
    overview: "Übersicht",
    requests: "Kundenanfragen",
    devices: "Geräte-Freigaben",
    customers: "Kunden",
  };

  return (
    <div className="w-full min-h-screen flex" style={{ background: TOKENS.ink }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&display=swap');`}</style>
      <Sidebar active={active} setActive={setActive} pendingCount={pendingDevices.length} openCount={openCount} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={titles[active]} />
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 flex items-center gap-2" style={{ color: TOKENS.sawdustDim }}>
              <Loader2 size={14} className="animate-spin" /> Lade Daten…
            </div>
          ) : (
            <>
              {active === "overview" && (
                <OverviewPanel setActive={setActive} pendingDevices={pendingDevices} tickets={tickets} customers={customers} />
              )}
              {active === "devices" && <DevicesPanel pendingDevices={pendingDevices} onDecide={handleDecide} />}
              {active === "requests" && <RequestsPanel tickets={tickets} />}
              {active === "customers" && <CustomersPanel customers={customers} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
