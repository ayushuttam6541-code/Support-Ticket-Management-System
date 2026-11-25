import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Ticket, Clock, CheckCircle, XCircle, AlertTriangle,
  TrendingUp, Users, Headphones, LogOut, Search,
  ChevronRight, RefreshCw, ChevronLeft, ChevronDown,
  LayoutDashboard, Settings, Shield
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  "Open":        { badge: "bg-blue-100 text-blue-700",   dot: "bg-blue-500" },
  "In Progress": { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  "Resolved":    { badge: "bg-green-100 text-green-700", dot: "bg-green-500" },
  "Closed":      { badge: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

const PRIORITY_STYLES = {
  "High":   "bg-red-100 text-red-700",
  "Medium": "bg-amber-100 text-amber-700",
  "Low":    "bg-green-100 text-green-700",
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [status, setStatus]     = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);
  const [sortBy, setSortBy]     = useState("createdAt");
  const [order, setOrder]       = useState("desc");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get("/tickets/stats");
      setStats(data.stats);
    } catch { /* silent */ }
    finally { setStatsLoading(false); }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sortBy, order };
      if (status)   params.status = status;
      if (priority) params.priority = priority;
      if (category) params.category = category;
      if (search)   params.search = search;
      const { data } = await api.get("/tickets", { params });
      setTickets(data.tickets);
      setTotal(data.total || data.count || 0);
      setTotalPages(data.totalPages || 1);
    } catch { toast.error("Failed to load tickets"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchTickets(); }, [status, priority, category, search, page, sortBy, order]);

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.patch(`/tickets/${id}/status`, { status: newStatus });
      toast.success("Status updated");
      fetchTickets(); fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally { setUpdatingId(null); }
  };

  const statCards = [
    { label: "Total",        value: stats?.total       ?? "—", icon: Ticket,        color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Open",         value: stats?.open        ?? "—", icon: Clock,         color: "text-blue-500",   bg: "bg-blue-50" },
    { label: "In Progress",  value: stats?.inProgress  ?? "—", icon: TrendingUp,    color: "text-amber-500",  bg: "bg-amber-50" },
    { label: "Resolved",     value: stats?.resolved    ?? "—", icon: CheckCircle,   color: "text-green-500",  bg: "bg-green-50" },
    { label: "Closed",       value: stats?.closed      ?? "—", icon: XCircle,       color: "text-slate-500",  bg: "bg-slate-100" },
    { label: "High Priority",value: stats?.highPriority?? "—", icon: AlertTriangle, color: "text-red-500",    bg: "bg-red-50" },
  ];

  const navLinks = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Ticket,          label: "All Tickets", active: false },
    { icon: Users,           label: "Users",       active: false },
    { icon: Settings,        label: "Settings",    active: false },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── DARK SIDEBAR ── */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">HelpDesk</span>
              <span className="ml-2 text-xs bg-purple-500/30 text-purple-300 font-semibold px-1.5 py-0.5 rounded-md">Admin</span>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navLinks.map((item) => (
            <div key={item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                item.active
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}>
              <item.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Stats summary in sidebar */}
        <div className="mx-4 mb-4 bg-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-3">Quick Stats</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Open</span>
              <span className="text-white font-semibold">{stats?.open ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">In Progress</span>
              <span className="text-amber-400 font-semibold">{stats?.inProgress ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Resolved</span>
              <span className="text-green-400 font-semibold">{stats?.resolved ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs">Administrator</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-1">
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
            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Monitor and manage all support tickets</p>
          </div>
          <button onClick={() => { fetchTickets(); fetchStats(); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-7">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-7">
            {statCards.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className={`${s.bg} p-2.5 rounded-xl w-fit mb-3`}>
                  <s.icon className={`${s.color} w-4 h-4`} />
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {statsLoading ? <span className="animate-pulse text-slate-300">—</span> : s.value}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tickets Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            {/* Filters row */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-slate-900">All Tickets</h2>
                  <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-2.5 py-1 rounded-full">{total}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    <input type="text" placeholder="Search..." value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 w-40 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>

                  {/* Dropdowns */}
                  {[
                    { value: status,   setter: setStatus,   options: ["Open","In Progress","Resolved","Closed"],    placeholder: "Status" },
                    { value: priority, setter: setPriority, options: ["Low","Medium","High"],                       placeholder: "Priority" },
                    { value: category, setter: setCategory, options: ["Technical","Billing","Account","General"],   placeholder: "Category" },
                  ].map((f) => (
                    <div key={f.placeholder} className="relative">
                      <select value={f.value}
                        onChange={(e) => { f.setter(e.target.value); setPage(1); }}
                        className="appearance-none text-sm border border-slate-200 rounded-xl pl-3 pr-7 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-400">
                        <option value="">{f.placeholder}</option>
                        {f.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  ))}

                  {/* Sort */}
                  <div className="relative">
                    <select value={`${sortBy}:${order}`}
                      onChange={(e) => { const [f,o] = e.target.value.split(":"); setSortBy(f); setOrder(o); setPage(1); }}
                      className="appearance-none text-sm border border-slate-200 rounded-xl pl-3 pr-7 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-400">
                      <option value="createdAt:desc">Newest</option>
                      <option value="createdAt:asc">Oldest</option>
                      <option value="priority:desc">Priority</option>
                      <option value="updatedAt:desc">Updated</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>

                  {(status || priority || category || search) && (
                    <button onClick={() => { setStatus(""); setPriority(""); setCategory(""); setSearch(""); setPage(1); }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-2 hover:bg-red-50 rounded-xl transition">
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <svg className="animate-spin w-7 h-7 text-purple-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <p className="text-slate-400 text-sm">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-20 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Ticket className="w-7 h-7 text-slate-300" />
                </div>
                <p className="font-medium text-slate-600">No tickets found</p>
                <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-6 py-3 font-semibold">Ticket</th>
                      <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">User</th>
                      <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Category</th>
                      <th className="text-left px-4 py-3 font-semibold">Priority</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 font-semibold">Update</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tickets.map((t) => {
                      const st = STATUS_STYLES[t.status] || STATUS_STYLES["Open"];
                      return (
                        <tr key={t._id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                              <div>
                                <p className="font-medium text-slate-900 truncate max-w-[180px] group-hover:text-purple-600 transition-colors">{t.title}</p>
                                <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString("en-US", { month:"short", day:"numeric" })}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                {t.createdBy?.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-700">{t.createdBy?.name}</p>
                                <p className="text-xs text-slate-400">{t.createdBy?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 hidden lg:table-cell">
                            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{t.category}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PRIORITY_STYLES[t.priority]}`}>{t.priority}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.badge}`}>{t.status}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="relative">
                              <select value={t.status}
                                disabled={updatingId === t._id}
                                onChange={(e) => updateStatus(t._id, e.target.value)}
                                className="appearance-none text-xs border border-slate-200 rounded-lg pl-2.5 pr-6 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 cursor-pointer">
                                <option>Open</option>
                                <option>In Progress</option>
                                <option>Resolved</option>
                                <option>Closed</option>
                              </select>
                              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <Link to={`/tickets/${t._id}`}
                              className="p-1.5 text-slate-300 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition inline-flex">
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">Page {page} of {totalPages} · {total} total</p>
                <div className="flex gap-1.5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button key={n} onClick={() => setPage(n)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition ${n === page ? "bg-purple-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                        {n}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {!loading && tickets.length > 0 && totalPages === 1 && (
              <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
                Showing {tickets.length} of {total} tickets
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
