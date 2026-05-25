import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Plus,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  AlertTriangle,
  FolderOpen,
  CheckSquare,
  Clock,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const COLUMNS = ['New', 'Contacted', 'Interested', 'Follow-up', 'Converted', 'Closed'];

const CRM = () => {
  const { activeBusinessId } = useSelector((state) => state.auth);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Lead Modal details
  const [selectedLead, setSelectedLead] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('Note');
  const [reminderDate, setReminderDate] = useState('');

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leads?limit=100'); // fetch up to 100 leads for pipeline view
      if (res.data.success) {
        setLeads(res.data.leads);
      }
    } catch (err) {
      toast.error('Failed to load pipeline leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusinessId) {
      fetchLeads();
    }
  }, [activeBusinessId]);

  // Fetch Timeline activities for modal
  const fetchTimeline = async (leadId) => {
    try {
      const res = await api.get(`/crm/lead/${leadId}`);
      if (res.data.success) {
        setTimeline(res.data.activities);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openLeadDetails = (lead) => {
    setSelectedLead(lead);
    fetchTimeline(lead._id);
  };

  // Drag and Drop hooks
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;

    // Optimistic status update in local state
    setLeads((prev) =>
      prev.map((lead) => (lead._id === leadId ? { ...lead, status: targetStatus } : lead))
    );

    try {
      // API call to update status
      await api.put(`/leads/${leadId}`, { status: targetStatus });
      // Log status change inside activity timeline
      await api.post('/crm', {
        leadId,
        type: 'Status Change',
        description: `Lead status updated to ${targetStatus}`,
      });

      toast.success(`Moved lead to ${targetStatus}`);
      fetchLeads(); // refresh lists
    } catch (err) {
      toast.error('Failed to update lead status');
      fetchLeads(); // rollback status on failure
    }
  };

  // Log new CRM activity
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote) return toast.error('Enter description/activity details');

    try {
      const res = await api.post('/crm', {
        leadId: selectedLead._id,
        type: noteType,
        description: newNote,
        reminderDate: noteType === 'Reminder' ? reminderDate : null,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setNewNote('');
        setReminderDate('');
        fetchTimeline(selectedLead._id);
        fetchLeads(); // refresh pipeline view in case of status synchronizations
      }
    } catch (err) {
      toast.error('Failed to log CRM note');
    }
  };

  // Toggle reminder completion
  const handleToggleReminder = async (id, currentStatus) => {
    try {
      const res = await api.put(`/crm/${id}`, { isCompleted: !currentStatus });
      if (res.data.success) {
        toast.success('Reminder updated');
        fetchTimeline(selectedLead._id);
      }
    } catch (err) {
      toast.error('Failed to update activity');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white font-outfit">CRM Deal Pipeline</h1>
        <p className="text-xs text-slate-500 mt-1">Drag and drop leads to update status, track calls, and trigger WhatsApp sales copy</p>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 select-none">
        {COLUMNS.map((columnName) => {
          const colLeads = leads.filter((l) => l.status === columnName);
          return (
            <div
              key={columnName}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, columnName)}
              className="w-72 flex-shrink-0 rounded-2xl bg-slate-900/40 border border-slate-800/60 p-4 flex flex-col h-[calc(100vh-210px)]"
            >
              {/* Column Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800/40">
                <span className="text-xs font-bold text-white uppercase tracking-wider">{columnName}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950 text-indigo-400">
                  {colLeads.length}
                </span>
              </div>

              {/* Cards wrapper */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colLeads.map((lead) => (
                  <div
                    key={lead._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead._id)}
                    onClick={() => openLeadDetails(lead)}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-slate-800 cursor-grab active:cursor-grabbing hover:bg-slate-950 transition-all shadow-sm"
                  >
                    <span className="text-xs font-semibold text-slate-200 block truncate">{lead.name}</span>
                    <span className="text-[10px] text-slate-500 block mt-1 truncate">{lead.phone || 'No phone'}</span>
                    
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-900/80 text-[9px] text-slate-500">
                      <span className="capitalize">{lead.city || 'Mumbai'}</span>
                      <span className="font-semibold text-indigo-400">★ {lead.rating || '4.0'}</span>
                    </div>
                  </div>
                ))}
                
                {colLeads.length === 0 && (
                  <div className="py-12 text-center text-[10px] text-slate-600 border border-dashed border-slate-850 rounded-xl">
                    Drop cards here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Lead Modal Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-enter text-slate-200">
            
            {/* Header / Dismiss */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-800/60 mb-6">
              <div>
                <h3 className="text-base font-bold text-white font-outfit">{selectedLead.name}</h3>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold mt-1 inline-block uppercase">
                  {selectedLead.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-xs text-slate-500 hover:text-white px-2 py-1 rounded bg-slate-950"
              >
                Close Panel
              </button>
            </div>

            {/* Content frame */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Contact details and Shortcuts */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Lead Dossier</h4>
                  
                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedLead.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedLead.email || 'No email found'}</span>
                    </div>
                    {selectedLead.website && (
                      <div className="flex items-center gap-2 truncate">
                        <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                        <a href={selectedLead.website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline truncate">
                          {selectedLead.website}
                        </a>
                      </div>
                    )}
                    <div className="text-slate-400 leading-normal text-[11px] pt-1">
                      <b>Address:</b> {selectedLead.address || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Sales outreach helpers */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Sales Outreach Shortcuts</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 hover:bg-indigo-600/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Now
                    </a>
                    
                    <a
                      href={`https://wa.me/${selectedLead.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hi ${selectedLead.name}, I found your listing on Google. We provide specialized agency services. Are you available for a brief call?`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 hover:bg-emerald-600/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Message
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Timeline activities */}
              <div className="space-y-4">
                
                {/* Note Log Form */}
                <form onSubmit={handleAddNote} className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-850">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Add CRM Action Log</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value)}
                      className="px-2 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none"
                    >
                      <option value="Note">General Note</option>
                      <option value="Call Note">Call Log</option>
                      <option value="Reminder">Reminders</option>
                      <option value="WhatsApp Action">WhatsApp outreach</option>
                    </select>

                    {noteType === 'Reminder' && (
                      <input
                        type="date"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="px-2 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none"
                      />
                    )}
                  </div>

                  <textarea
                    placeholder="Log summary detail (e.g. customer wants follow up call next Tuesday)..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows="2"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider font-outfit"
                  >
                    Add Log Entry
                  </button>
                </form>

                {/* Timeline display */}
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">History Log</h4>
                  {timeline.length === 0 ? (
                    <div className="py-8 text-center text-[10px] text-slate-655">
                      No interactions logged.
                    </div>
                  ) : (
                    timeline.map((act) => (
                      <div key={act._id} className="p-2.5 rounded-lg bg-slate-950/20 border border-slate-850/60 text-[11px] leading-normal flex gap-2">
                        {act.type === 'Reminder' ? (
                          <input
                            type="checkbox"
                            checked={act.isCompleted}
                            onChange={() => handleToggleReminder(act._id, act.isCompleted)}
                            className="rounded border-slate-800 text-indigo-600 w-3.5 h-3.5 mt-0.5"
                          />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between font-semibold">
                            <span className="text-[10px] text-indigo-300 font-bold">{act.type}</span>
                            <span className="text-[9px] text-slate-500 font-normal">
                              {new Date(act.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-400 mt-0.5">{act.description}</p>
                          {act.type === 'Reminder' && act.reminderDate && (
                            <span className="text-[9px] text-amber-400 block mt-1 font-semibold flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> Due: {new Date(act.reminderDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CRM;
