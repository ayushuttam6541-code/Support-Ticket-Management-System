import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  Ticket, Tag, AlertTriangle, FileText, LayoutDashboard,
  LogOut, Plus, ArrowLeft, ChevronDown, Settings, User
} from "lucide-react";

const CATEGORIES = ["Technical", "Billing", "Account", "General"];
const PRIORITIES = [
  { value: "Low",    color: "border-green-400 bg-green-50 text-green-700",  ring: "ring-green-400"  },
  { value: "Medium", color: "border-amber-400 bg-amber-50 text-amber-700",  ring: "ring-amber-400"  },
  { value: "High",   color: "border-red-400   bg-red-50   text-red-700",    ring: "ring-red-400"    },
];

export default function CreateTicket() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", category: "General", priority: "Medium" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setLoading(true);
    try {
      await api.post("/tickets", form);
      toast.success("Ticket submitted successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const navLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: false },
    { icon: Ticket,          label: "My Tickets", href: "/dashboard", active: false },
    { icon: Plus,            label: "New Ticket", href: "/create-ticket", active: true },
    { icon: Settings,        label: "Settings",  href: "#", active: false },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── DARK SIDEBAR ── */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">HelpDesk</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navLinks.map((item) => (
            <Link key={item.label} to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                item.active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}>
              <item.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Tip box */}
        <div className="mx-4 mb-4 bg-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">💡 Tip</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Be as specific as possible in your description to help us resolve faster.
          </p>
        </div>

        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-1">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-slate-900">Create New Ticket</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-7">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Title */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Ticket className="w-4 h-4 text-indigo-500" /> Ticket Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Briefly describe your issue..."
                  required
                  maxLength={120}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
                <p className="text-xs text-slate-400 mt-1.5 text-right">{form.title.length}/120</p>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <FileText className="w-4 h-4 text-indigo-500" /> Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide detailed information — steps to reproduce, expected vs actual behavior, screenshots links etc."
                  required
                  rows={6}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition resize-none"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Category */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <Tag className="w-4 h-4 text-indigo-500" /> Category
                  </label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                    >
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Priority */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <AlertTriangle className="w-4 h-4 text-indigo-500" /> Priority
                  </label>
                  <div className="flex gap-2">
                    {PRIORITIES.map((p) => (
                      <button type="button" key={p.value}
                        onClick={() => setForm({ ...form, priority: p.value })}
                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          form.priority === p.value
                            ? `${p.color} ring-2 ring-offset-2 ${p.ring}`
                            : "text-slate-400 bg-slate-50 border-slate-200 hover:border-slate-300"
                        }`}>
                        {p.value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary pill + Submit */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full">📂 {form.category}</span>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                    form.priority === "High" ? "bg-red-100 text-red-700" :
                    form.priority === "Medium" ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700"
                  }`}>🔥 {form.priority} Priority</span>
                  <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full">🔓 Open</span>
                </div>

                <div className="flex gap-3">
                  <Link to="/dashboard"
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                    Cancel
                  </Link>
                  <button type="submit" disabled={loading}
                    className="px-7 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl flex items-center gap-2 transition-all">
                    {loading
                      ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                      : <Ticket className="w-4 h-4" />}
                    {loading ? "Submitting..." : "Submit Ticket"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
