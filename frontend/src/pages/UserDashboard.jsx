import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Ticket, Clock, CheckCircle, AlertTriangle,
  Plus, ChevronRight, Search, RefreshCw,
  LayoutDashboard, LogOut, User, Settings,
  TrendingUp, XCircle
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  "Open":        { badge: "bg-blue-100 text-blue-700",    dot: "bg-blue-500" },
  "In Progress": { badge: "bg-amber-100 text-amber-700",  dot: "bg-amber-500" },
  "Resolved":    { badge: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  "Closed":      { badge: "bg-slate-100 text-slate-500",  dot: "bg-slate-400" },
};

const PRIORITY_STYLES = {
  "High":   "text-red-600 bg-red-50 border border-red-200",
  "Medium": "text-amber-600 bg-amber-50 border border-amber-200",
  "Low":    "text-green-600 bg-green-50 border border-green-200",
};

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/tickets/my");
      setTickets(data.tickets);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const filtered = tickets.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? t.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const stats = [
    { label: "Total",       value: tickets.length,                                          icon: Ticket,       color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Open",        value: tickets.filter(t => t.status === "Open").length,         icon: Clock,        color: "text-blue-500",   bg: "bg-blue-50" },
    { label: "In Progress", value: tickets.filter(t => t.status === "In Progress").length,  icon: TrendingUp,   color: "text-amber-500",  bg: "bg-amber-50" },
    { label: "Resolved",    value: tickets.filter(t => t.status === "Resolved").length,     icon: CheckCircle,  color: "text-green-500",  bg: "bg-green-50" },
  ];

  const navLinks = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Ticket,          label: "My Tickets", active: false },
    { icon: User,            label: "Profile",    active: false },
    { icon: Settings,        label: "Settings",   active: false },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* ── DARK SIDEBAR ── */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">HelpDesk</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navLinks.map((item) => (
            <div key={item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                item.active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </nav>

        {/* New Ticket Button */}
        <div className="px-4 pb-4">
          <Link to="/create-ticket"
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> New Ticket
          </Link>
        </div>

        {/* User profile */}
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs truncate">{user?.email}</p>
            </div>
            <button onClick={logout}
              className="text-slate-400 hover:text-red-400 transition-colors p-1" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Here&apos;s what&apos;s happening with your tickets</p>
          </div>
          <button onClick={fetchTickets}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto px-8 py-7">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
                <div className={`${s.bg} p-3 rounded-xl`}>
                  <s.icon className={`${s.color} w-5 h-5`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ticket panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            {/* Panel header */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
              <h2 className="font-semibold text-slate-900">My Tickets
                <span className="ml-2 text-xs bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">{filtered.length}</span>
              </h2>
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                  <input type="text" placeholder="Search..." value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 w-40 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="">All Status</option>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                  <option>Closed</option>
                </select>
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <svg className="animate-spin w-7 h-7 text-indigo-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <p className="text-slate-400 text-sm">Loading tickets...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Ticket className="w-7 h-7 text-slate-300" />
                </div>
                <p className="font-medium text-slate-600">{search || filterStatus ? "No tickets match" : "No tickets yet"}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {!search && !filterStatus && <Link to="/create-ticket" className="text-indigo-500 font-semibold hover:underline">Create your first ticket →</Link>}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {filtered.map((ticket) => {
                  const st = STATUS_STYLES[ticket.status] || STATUS_STYLES["Open"];
                  return (
                    <li key={ticket._id}>
                      <Link to={`/tickets/${ticket._id}`}
                        className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{ticket.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{ticket.category} · {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full hidden sm:block ${PRIORITY_STYLES[ticket.priority]}`}>{ticket.priority}</span>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.badge}`}>{ticket.status}</span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {!loading && filtered.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
                Showing {filtered.length} of {tickets.length} tickets
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
