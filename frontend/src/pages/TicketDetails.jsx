import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  ArrowLeft, LogOut, Send, Trash2, Edit2, Save, X,
  MessageSquare, Activity, User, Clock, Tag, AlertTriangle,
  ChevronDown, Ticket, LayoutDashboard, Shield, Settings
} from "lucide-react";

const STATUS_STYLES = {
  "Open":        { badge: "bg-blue-100 text-blue-700 border-blue-200",   dot: "bg-blue-500" },
  "In Progress": { badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  "Resolved":    { badge: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
  "Closed":      { badge: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400" },
};

const PRIORITY_STYLES = {
  "High":   "bg-red-100 text-red-700",
  "Medium": "bg-amber-100 text-amber-700",
  "Low":    "bg-green-100 text-green-700",
};

const EVENT_META = {
  "TICKET_CREATED":   { emoji: "🎫", color: "bg-blue-100 text-blue-700" },
  "TICKET_UPDATED":   { emoji: "✏️",  color: "bg-yellow-100 text-yellow-700" },
  "STATUS_CHANGED":   { emoji: "🔄", color: "bg-purple-100 text-purple-700" },
  "PRIORITY_CHANGED": { emoji: "🔥", color: "bg-orange-100 text-orange-700" },
  "COMMENT_ADDED":    { emoji: "💬", color: "bg-teal-100 text-teal-700" },
  "TICKET_RESOLVED":  { emoji: "✅", color: "bg-green-100 text-green-700" },
  "TICKET_DELETED":   { emoji: "🗑️", color: "bg-red-100 text-red-700" },
};

export default function TicketDetails() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket]       = useState(null);
  const [comments, setComments]   = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [comment, setComment]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [editing, setEditing]     = useState(false);
  const [editForm, setEditForm]   = useState({});
  const [activeTab, setActiveTab] = useState("comments");

  const isAdmin = user?.role === "admin";
  const backHref = isAdmin ? "/admin" : "/dashboard";

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setTicket(data.ticket);
      setComments(data.comments || []);
      setActivities(data.activities || []);
      setEditForm({ title: data.ticket.title, description: data.ticket.description, category: data.ticket.category });
      // Debug: check roles in comments
      console.log("Comments loaded:", data.comments?.map(c => ({ name: c.user?.name, role: c.user?.role })));
    } catch {
      toast.error("Failed to load ticket");
      navigate(backHref);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/tickets/${id}/comments`, { message: comment.trim() });
      // Ensure role is set correctly even if backend omits it
      const newComment = {
        ...data.comment,
        user: {
          ...data.comment?.user,
          role: data.comment?.user?.role || user?.role,
        }
      };
      setComments(prev => [...prev, newComment]);
      setComment("");
      toast.success("Comment added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add comment");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this ticket? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/tickets/${id}`);
      toast.success("Ticket deleted");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cannot delete this ticket");
    } finally { setDeleting(false); }
  };

  const handleEdit = async () => {
    try {
      const { data } = await api.put(`/tickets/${id}`, editForm);
      setTicket(data.ticket);
      setEditing(false);
      toast.success("Ticket updated");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  };

  const handleStatusChange = async (val) => {
    try {
      await api.patch(`/tickets/${id}/status`, { status: val });
      toast.success("Status updated");
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handlePriorityChange = async (val) => {
    try {
      await api.patch(`/tickets/${id}/status`, { priority: val });
      toast.success("Priority updated");
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const isOwner = ticket?.createdBy?._id === user?.id || ticket?.createdBy?.id === user?.id;
  const canEdit = isOwner && !["Resolved", "Closed"].includes(ticket?.status);
  const canDelete = isOwner && ["Open", "Closed"].includes(ticket?.status);

  const sidebarColor = isAdmin ? "bg-purple-500" : "bg-indigo-500";
  const accentRing   = isAdmin ? "focus:ring-purple-400" : "focus:ring-indigo-400";
  const activeBg     = isAdmin ? "bg-purple-600"  : "bg-indigo-600";
  const hoverColor   = isAdmin ? "hover:text-purple-600 hover:bg-purple-50" : "hover:text-indigo-600 hover:bg-indigo-50";

  if (loading) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <svg className="animate-spin w-9 h-9 text-indigo-400 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-slate-400 text-sm">Loading ticket...</p>
      </div>
    </div>
  );

  const st = STATUS_STYLES[ticket?.status] || STATUS_STYLES["Open"];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── DARK SIDEBAR ── */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${sidebarColor} rounded-lg flex items-center justify-center`}>
              {isAdmin ? <Shield className="w-4 h-4 text-white" /> : <Ticket className="w-4 h-4 text-white" />}
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">HelpDesk</span>
              {isAdmin && <span className="ml-2 text-xs bg-purple-500/30 text-purple-300 font-semibold px-1.5 py-0.5 rounded-md">Admin</span>}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { icon: LayoutDashboard, label: "Dashboard", href: backHref },
            { icon: Ticket, label: "Ticket Details", href: "#", active: true },
            { icon: Settings, label: "Settings", href: "#" },
          ].map((item) => (
            <Link key={item.label} to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                item.active ? `${activeBg} text-white` : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}>
              <item.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Ticket mini-info in sidebar */}
        {ticket && (
          <div className="mx-4 mb-4 bg-slate-800 rounded-xl p-4 space-y-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">Ticket</p>
            <p className="text-white text-xs font-medium leading-snug line-clamp-2">{ticket.title}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              <span className="text-slate-400 text-xs">{ticket.status}</span>
            </div>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[ticket.priority]}`}>
              {ticket.priority}
            </span>
          </div>
        )}

        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${sidebarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs">{isAdmin ? "Administrator" : "User"}</p>
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
            <Link to={backHref} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-slate-900 truncate max-w-xl">{ticket?.title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && !editing && (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            {editing && (
              <>
                <button onClick={handleEdit}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition">
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
                <button onClick={() => setEditing(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
            {canDelete && !editing && (
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto px-8 py-7">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">

            {/* Left — main */}
            <div className="xl:col-span-2 space-y-5">

              {/* Ticket card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${st.badge}`}>{ticket?.status}</span>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${PRIORITY_STYLES[ticket?.priority]}`}>{ticket?.priority} Priority</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">{ticket?.category}</span>
                  <span className="text-xs text-slate-400 ml-auto self-center">
                    #{ticket?._id?.slice(-8).toUpperCase()}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
                  {editing ? (
                    <div className="space-y-3">
                      <input value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 ${accentRing}`}
                        placeholder="Title" />
                      <textarea value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={5}
                        className={`w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 ${accentRing} resize-none`} />
                      <div className="relative">
                        <select value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className={`w-full appearance-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 ${accentRing}`}>
                          {["Technical", "Billing", "Account", "General"].map(c => <option key={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{ticket?.description}</p>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100 items-center justify-between pr-4">
                  <div className="flex">
                  {[
                    { key: "comments", label: "Comments", icon: MessageSquare, count: comments.length },
                    { key: "activity", label: "Activity",  icon: Activity,      count: activities.length },
                  ].map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === tab.key
                          ? "border-indigo-500 text-indigo-600"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}>
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        activeTab === tab.key ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                      }`}>{tab.count}</span>
                    </button>
                  ))}
                  </div>
                  <button onClick={fetchData}
                    title="Reload comments"
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 transition">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 4v6h-6M1 20v-6h6"/>
                      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                    </svg>
                    Refresh
                  </button>
                </div>

                {/* Comments */}
                {activeTab === "comments" && (
                  <div>
                    {comments.length === 0 ? (
                      <div className="py-14 text-center">
                        <MessageSquare className="w-9 h-9 text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">No comments yet</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                        {comments.map((c) => {
                          const isAdminComment = c.user?.role?.toLowerCase() === "admin";
                          return (
                          <li key={c._id} className={`px-6 py-4 ${isAdminComment ? "bg-purple-50/60 border-l-4 border-purple-400" : ""}`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                                isAdminComment ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-700"
                              }`}>
                                {c.user?.name?.[0]?.toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-sm font-semibold text-slate-900">{c.user?.name}</span>
                                  {isAdminComment && (
                                    <span className="text-xs bg-purple-600 text-white px-2.5 py-0.5 rounded-full font-semibold tracking-wide">
                                      🛡️ Admin
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-400">
                                    {new Date(c.createdAt).toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed">{c.message}</p>
                              </div>
                            </div>
                          </li>
                          );
                        })}
                      </ul>
                    )}
                    {ticket?.status !== "Closed" && (
                      <form onSubmit={handleComment} className="border-t border-slate-100 p-4 flex gap-3 items-end">
                        <textarea value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add a comment..."
                          rows={2}
                          className={`flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${accentRing} resize-none`} />
                        <button type="submit" disabled={submitting || !comment.trim()}
                          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition flex items-center gap-2 text-sm font-medium shrink-0">
                          <Send className="w-4 h-4" />
                          {submitting ? "..." : "Send"}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Activity */}
                {activeTab === "activity" && (
                  <div className="max-h-96 overflow-y-auto">
                    {activities.length === 0 ? (
                      <div className="py-14 text-center">
                        <Activity className="w-9 h-9 text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">No activity yet</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-50">
                        {activities.map((a) => {
                          const ev = EVENT_META[a.event] || { emoji: "📋", color: "bg-slate-100 text-slate-600" };
                          return (
                            <li key={a._id} className="px-6 py-3 flex items-start gap-3">
                              <span className={`text-sm px-2 py-1 rounded-lg shrink-0 ${ev.color}`}>{ev.emoji}</span>
                              <div>
                                <p className="text-sm text-slate-700">
                                  <span className="font-semibold">{a.performedBy?.name || "System"}</span>
                                  {" — "}{a.details}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {new Date(a.createdAt).toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right — sidebar info */}
            <div className="space-y-5">
              {/* Ticket meta */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Ticket Info</p>
                <div className="space-y-4">
                  {[
                    { icon: User,  label: "Submitted by", value: ticket?.createdBy?.name, sub: ticket?.createdBy?.email },
                    { icon: Tag,   label: "Category",     value: ticket?.category },
                    { icon: Clock, label: "Created",      value: new Date(ticket?.createdAt).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" }) },
                    { icon: Clock, label: "Updated",      value: new Date(ticket?.updatedAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <row.icon className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">{row.label}</p>
                        <p className="text-sm font-semibold text-slate-900">{row.value}</p>
                        {row.sub && <p className="text-xs text-slate-400">{row.sub}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin controls */}
              {isAdmin && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Admin Controls</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Status</label>
                      <div className="relative">
                        <select value={ticket?.status} onChange={(e) => handleStatusChange(e.target.value)}
                          className={`w-full appearance-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 ${accentRing}`}>
                          {["Open","In Progress","Resolved","Closed"].map(s => <option key={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Priority</label>
                      <div className="flex gap-2">
                        {["Low","Medium","High"].map((p) => (
                          <button key={p} onClick={() => handlePriorityChange(p)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                              ticket?.priority === p
                                ? PRIORITY_STYLES[p] + " border-current ring-1 ring-current ring-offset-1"
                                : "text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100"
                            }`}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
