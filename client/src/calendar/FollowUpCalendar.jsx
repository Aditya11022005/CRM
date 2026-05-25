import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  ChevronLeft, ChevronRight, Calendar, Bell, CheckCircle2,
  Clock, Phone, MessageSquare, Mail, Plus, X,
  AlertCircle, RefreshCw, Flag
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── helpers ────────────────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate();

const isOverdue = (dateStr) => new Date(dateStr) < new Date();

const priorityColor = (r) => {
  if (!r) return 'border-slate-700 bg-slate-800/40 text-slate-400';
  const s = r.type || r;
  if (s === 'Reminder') return 'border-yellow-500/40 bg-yellow-500/5 text-yellow-400';
  if (s === 'Call Note') return 'border-blue-500/40 bg-blue-500/5 text-blue-400';
  if (s === 'WhatsApp Action') return 'border-green-500/40 bg-green-500/5 text-green-400';
  if (s === 'Email Action') return 'border-violet-500/40 bg-violet-500/5 text-violet-400';
  return 'border-slate-700 bg-slate-800/40 text-slate-400';
};

const typeIcon = (type) => {
  if (type === 'Call Note')       return <Phone className="w-3.5 h-3.5" />;
  if (type === 'WhatsApp Action') return <MessageSquare className="w-3.5 h-3.5" />;
  if (type === 'Email Action')    return <Mail className="w-3.5 h-3.5" />;
  return <Bell className="w-3.5 h-3.5" />;
};

// ── component ──────────────────────────────────────────────────────────────────
const FollowUpCalendar = () => {
  const { activeBusinessId } = useSelector((s) => s.auth);

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [reminders, setReminders]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedDay, setSelectedDay] = useState(today);
  const [leads, setLeads]             = useState([]);

  // New reminder modal state
  const [showModal, setShowModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    leadId: '', type: 'Reminder', description: '', reminderDate: ''
  });
  const [saving, setSaving] = useState(false);

  // ── data fetching ────────────────────────────────────────────────────────────
  const fetchReminders = useCallback(async () => {
    if (!activeBusinessId) return;
    setLoading(true);
    try {
      const res = await api.get('/crm/reminders');
      setReminders(res.data.reminders || []);
    } catch {
      toast.error('Could not load reminders');
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  const fetchLeads = useCallback(async () => {
    if (!activeBusinessId) return;
    try {
      const res = await api.get('/leads?limit=200');
      setLeads(res.data.leads || []);
    } catch { /* silent */ }
  }, [activeBusinessId]);

  useEffect(() => { fetchReminders(); fetchLeads(); }, [fetchReminders, fetchLeads]);

  // ── calendar grid ────────────────────────────────────────────────────────────
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(new Date(year, month, d));

  const remindersOnDay = (day) =>
    reminders.filter(
      (r) => r.reminderDate && isSameDay(new Date(r.reminderDate), day)
    );

  const selectedDayReminders = remindersOnDay(selectedDay);

  // ── actions ──────────────────────────────────────────────────────────────────
  const markDone = async (id) => {
    try {
      await api.put(`/crm/${id}`, { isCompleted: true });
      toast.success('Marked as done ✅');
      fetchReminders();
    } catch {
      toast.error('Could not update reminder');
    }
  };

  const deleteReminder = async (id) => {
    try {
      await api.delete(`/crm/${id}`);
      toast.success('Reminder deleted');
      fetchReminders();
    } catch {
      toast.error('Could not delete reminder');
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.leadId || !newReminder.description || !newReminder.reminderDate) {
      toast.error('Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      await api.post('/crm', {
        leadId: newReminder.leadId,
        type: newReminder.type,
        description: newReminder.description,
        reminderDate: newReminder.reminderDate,
      });
      toast.success('Follow-up reminder added! 📅');
      setShowModal(false);
      setNewReminder({ leadId: '', type: 'Reminder', description: '', reminderDate: '' });
      fetchReminders();
    } catch {
      toast.error('Could not save reminder');
    } finally {
      setSaving(false);
    }
  };

  // ── overdue / upcoming counts ────────────────────────────────────────────────
  const overdueCount  = reminders.filter((r) => !r.isCompleted && isOverdue(r.reminderDate)).length;
  const upcomingCount = reminders.filter((r) => !r.isCompleted && !isOverdue(r.reminderDate)).length;
  const totalCount    = reminders.length;

  if (!activeBusinessId) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Please select a workspace first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white flex items-center gap-2">
            <span className="text-2xl">📅</span> Follow-up Calendar
          </h1>
          <p className="text-sm text-slate-400 mt-1">Track every reminder, follow-up & scheduled call</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchReminders}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Reminder
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Reminders', value: totalCount, color: 'text-slate-300', icon: <Bell className="w-5 h-5 text-slate-400" />, bg: 'bg-slate-800/50' },
          { label: 'Overdue', value: overdueCount, color: 'text-rose-400', icon: <AlertCircle className="w-5 h-5 text-rose-400" />, bg: 'bg-rose-500/10 border border-rose-500/20' },
          { label: 'Upcoming', value: upcomingCount, color: 'text-blue-400', icon: <Clock className="w-5 h-5 text-blue-400" />, bg: 'bg-blue-500/10 border border-blue-500/20' },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-2xl ${s.bg}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">{s.label}</p>
              {s.icon}
            </div>
            <p className={`text-2xl font-bold font-outfit ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Calendar Grid */}
        <div className="xl:col-span-3 glass-panel rounded-2xl border border-slate-800/60 p-5 space-y-4">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold font-outfit text-white">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 text-center">
            {DAYS.map((d) => (
              <div key={d} className="text-[11px] font-semibold text-slate-600 pb-2">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const dayReminders = remindersOnDay(day);
              const isToday    = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDay);
              const hasOverdue = dayReminders.some((r) => !r.isCompleted && isOverdue(r.reminderDate));
              const hasPending = dayReminders.some((r) => !r.isCompleted && !isOverdue(r.reminderDate));

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDay(day)}
                  className={`relative flex flex-col items-center justify-start p-1.5 rounded-xl min-h-[52px] text-xs font-medium transition-all border ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-300'
                      : isToday
                      ? 'bg-slate-700/40 border-slate-600 text-white'
                      : 'border-transparent hover:border-slate-700 hover:bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <span className={`${isToday ? 'w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[11px]' : ''}`}>
                    {day.getDate()}
                  </span>
                  {dayReminders.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {hasOverdue && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                      {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                      {dayReminders.filter(r => r.isCompleted).length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
            {[
              { color: 'bg-rose-500', label: 'Overdue' },
              { color: 'bg-yellow-400', label: 'Pending' },
              { color: 'bg-green-500', label: 'Completed' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Day detail */}
        <div className="xl:col-span-2 space-y-4">
          {/* Selected day header */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-white font-outfit">
                  {isSameDay(selectedDay, today) ? '📌 Today' : selectedDay.toDateString()}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDayReminders.length} reminder{selectedDayReminders.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  const yyyy = selectedDay.getFullYear();
                  const mm   = String(selectedDay.getMonth() + 1).padStart(2, '0');
                  const dd   = String(selectedDay.getDate()).padStart(2, '0');
                  setNewReminder((p) => ({ ...p, reminderDate: `${yyyy}-${mm}-${dd}T09:00` }));
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {selectedDayReminders.length === 0 ? (
              <div className="py-8 text-center text-slate-600">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No reminders for this day</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {selectedDayReminders.map((r) => (
                  <div
                    key={r._id}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      r.isCompleted
                        ? 'border-slate-800/40 bg-slate-900/20 opacity-60'
                        : priorityColor(r)
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="flex-shrink-0">{typeIcon(r.type)}</span>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${r.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {r.lead?.name || 'Lead'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{r.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!r.isCompleted && (
                          <button
                            onClick={() => markDone(r._id)}
                            className="p-1 rounded-lg hover:bg-green-500/20 text-green-500 transition-colors"
                            title="Mark done"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteReminder(r._id)}
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-500 transition-colors"
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 pl-5">
                      <span className="text-[10px] text-slate-600">
                        {new Date(r.reminderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!r.isCompleted && isOverdue(r.reminderDate) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-medium">
                          Overdue
                        </span>
                      )}
                      {r.isCompleted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">
                          Done ✓
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming overdue list */}
          {overdueCount > 0 && (
            <div className="glass-panel rounded-2xl border border-rose-500/20 p-4 space-y-2">
              <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {overdueCount} Overdue Follow-up{overdueCount !== 1 ? 's' : ''}
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {reminders
                  .filter((r) => !r.isCompleted && isOverdue(r.reminderDate))
                  .slice(0, 5)
                  .map((r) => (
                    <div key={r._id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/15">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{r.lead?.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(r.reminderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <button
                        onClick={() => markDone(r._id)}
                        className="flex-shrink-0 text-[11px] px-2 py-1 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all"
                      >
                        Done
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Reminder Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md glass-panel rounded-2xl border border-slate-700/60 p-6 space-y-4 shadow-2xl animate-enter">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-outfit text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" /> New Reminder
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lead select */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Select Lead *</label>
              <select
                value={newReminder.leadId}
                onChange={(e) => setNewReminder((p) => ({ ...p, leadId: e.target.value }))}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Choose a lead --</option>
                {leads.map((l) => (
                  <option key={l._id} value={l._id}>{l.name} {l.phone ? `· ${l.phone}` : ''}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Reminder Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['Reminder', 'Call Note', 'WhatsApp Action', 'Email Action'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewReminder((p) => ({ ...p, type: t }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      newReminder.type === t
                        ? 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & time */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Date & Time *</label>
              <input
                type="datetime-local"
                value={newReminder.reminderDate}
                onChange={(e) => setNewReminder((p) => ({ ...p, reminderDate: e.target.value }))}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Note / Description *</label>
              <textarea
                value={newReminder.description}
                onChange={(e) => setNewReminder((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="e.g. Call to discuss solar panel quote..."
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReminder}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpCalendar;
