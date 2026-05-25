import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  MessageSquare, Send, Users, CheckSquare, Square,
  Search, Phone, ChevronDown, Sparkles, RefreshCw,
  AlertCircle, CheckCircle2, X, Filter, Download
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// Pre-built message templates
const MESSAGE_TEMPLATES = [
  {
    id: 1,
    label: '👋 Introduction',
    text: `Hello {name}! 👋\n\nI came across your business *{business}* and wanted to connect.\n\nWe help businesses like yours grow with our services. Would you be open to a quick 5-minute call?\n\nLooking forward to hearing from you! 🙏`,
  },
  {
    id: 2,
    label: '🌟 Follow-up',
    text: `Hi {name}! 😊\n\nJust following up on my previous message regarding *{business}*.\n\nWe have helped 100+ businesses increase their revenue. I'd love to show you how we can help you too!\n\nAre you available for a quick chat? 📞`,
  },
  {
    id: 3,
    label: '🎯 Special Offer',
    text: `Hello {name}! 🎉\n\nGreat news for *{business}*!\n\nWe are running a *LIMITED TIME OFFER* exclusively for businesses in your area.\n\nReply "INTERESTED" to know more! 🔥`,
  },
  {
    id: 4,
    label: '📞 Call Request',
    text: `Hi {name}! 🙏\n\nI would love to connect with the team at *{business}*.\n\nCan we schedule a quick 10-minute call this week? I promise it will be worth your time!\n\nPlease let me know your preferred time. ⏰`,
  },
];

const WhatsApp = () => {
  const { activeBusinessId } = useSelector((state) => state.auth);

  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [messageText, setMessageText] = useState(MESSAGE_TEMPLATES[0].text);
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [sentCount, setSentCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [sentLeads, setSentLeads] = useState(new Set());
  const [showTemplates, setShowTemplates] = useState(false);

  const STATUS_OPTIONS = ['All', 'New', 'Contacted', 'Interested', 'Follow-up', 'Converted', 'Closed'];

  useEffect(() => {
    if (activeBusinessId) fetchLeads();
  }, [activeBusinessId]);

  useEffect(() => {
    let result = leads.filter((l) => l.phone && l.phone.trim() !== '');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) => l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.city?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter((l) => l.status === statusFilter);
    }
    setFilteredLeads(result);
  }, [leads, searchQuery, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads?limit=500');
      setLeads(res.data.leads || []);
    } catch {
      toast.error('Could not fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map((l) => l._id));
    }
  };

  const applyTemplate = (tpl) => {
    setMessageText(tpl.text);
    setSelectedTemplate(tpl.id);
    setShowTemplates(false);
  };

  // Build personalised WhatsApp URL for a single lead
  const buildWhatsAppUrl = (lead) => {
    const phone = lead.phone.replace(/\D/g, '');
    const e164 = phone.startsWith('91') ? phone : `91${phone}`;
    const personalised = messageText
      .replace(/{name}/g, lead.ownerName || lead.name || 'Sir/Ma\'am')
      .replace(/{business}/g, lead.name || 'your business');
    const encoded = encodeURIComponent(personalised);
    return `https://wa.me/${e164}?text=${encoded}`;
  };

  // Open WhatsApp links one by one with a short delay
  const handleBulkSend = async () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select at least one lead!');
      return;
    }
    if (!messageText.trim()) {
      toast.error('Please write a message first!');
      return;
    }

    setSending(true);
    setSentCount(0);
    const selected = filteredLeads.filter((l) => selectedLeads.includes(l._id));
    const newSent = new Set(sentLeads);

    for (let i = 0; i < selected.length; i++) {
      const lead = selected[i];
      const url = buildWhatsAppUrl(lead);
      window.open(url, '_blank');
      newSent.add(lead._id);
      setSentCount(i + 1);
      setSentLeads(new Set(newSent));
      // Log WhatsApp action via CRM API
      try {
        await api.post('/crm', {
          leadId: lead._id,
          type: 'WhatsApp Action',
          description: `Bulk WhatsApp sent: "${messageText.substring(0, 80)}..."`,
        });
      } catch { /* ignore */ }
      // Small delay between opens so browser doesn't block popups
      await new Promise((r) => setTimeout(r, 800));
    }

    setSending(false);
    toast.success(`✅ WhatsApp opened for ${selected.length} leads!`);
  };

  const handleSingleSend = (lead) => {
    const url = buildWhatsAppUrl(lead);
    window.open(url, '_blank');
    setSentLeads((prev) => new Set(prev).add(lead._id));
    // Log
    api.post('/crm', {
      leadId: lead._id,
      type: 'WhatsApp Action',
      description: `WhatsApp sent: "${messageText.substring(0, 60)}..."`,
    }).catch(() => {});
    toast.success(`WhatsApp opened for ${lead.name}`);
  };

  const leadsWithPhone = leads.filter((l) => l.phone && l.phone.trim() !== '').length;
  const leadsWithoutPhone = leads.length - leadsWithPhone;

  if (!activeBusinessId) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Please select a workspace first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white flex items-center gap-2">
            <span className="text-2xl">📱</span> WhatsApp Bulk Sender
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Select leads → Write message → Send to all at once
          </p>
        </div>
        <button
          onClick={fetchLeads}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-all border border-slate-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-slate-300', bg: 'bg-slate-800/50' },
          { label: 'With Phone', value: leadsWithPhone, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Selected', value: selectedLeads.length, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Sent Today', value: sentLeads.size, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-2xl border border-slate-800/60 ${s.bg}`}>
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold font-outfit ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* LEFT: Lead List */}
        <div className="xl:col-span-3 space-y-4">
          <div className="glass-panel rounded-2xl border border-slate-800/60 p-4 space-y-3">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search leads..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {/* Status filter */}
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-8 pr-3 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select All bar */}
            <div
              onClick={toggleSelectAll}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 cursor-pointer hover:bg-slate-900/70 transition-all"
            >
              {selectedLeads.length === filteredLeads.length && filteredLeads.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-indigo-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span className="text-sm text-slate-300 font-medium">
                {selectedLeads.length === filteredLeads.length && filteredLeads.length > 0
                  ? 'Deselect All'
                  : `Select All (${filteredLeads.length} leads with phone)`}
              </span>
            </div>

            {/* Lead list */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-slate-800/40 animate-pulse" />
                ))
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <Phone className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No leads with phone numbers found.</p>
                </div>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedLeads.includes(lead._id);
                  const wasSent = sentLeads.has(lead._id);
                  return (
                    <div
                      key={lead._id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500/50 bg-indigo-500/5'
                          : 'border-slate-800/60 bg-slate-900/30 hover:border-slate-700'
                      }`}
                    >
                      <div onClick={() => toggleSelect(lead._id)}>
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-600 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0" onClick={() => toggleSelect(lead._id)}>
                        <p className="text-sm font-semibold text-slate-200 truncate">{lead.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          📞 {lead.phone} {lead.city ? `· ${lead.city}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          lead.status === 'Converted' ? 'bg-green-500/15 text-green-400' :
                          lead.status === 'Interested' ? 'bg-yellow-500/15 text-yellow-400' :
                          lead.status === 'Follow-up' ? 'bg-blue-500/15 text-blue-400' :
                          'bg-slate-700/50 text-slate-400'
                        }`}>
                          {lead.status}
                        </span>
                        {wasSent ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSingleSend(lead)}
                            className="p-1.5 rounded-lg bg-green-600/10 hover:bg-green-600/20 text-green-400 transition-all"
                            title="Send to this lead"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {leadsWithoutPhone > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{leadsWithoutPhone} leads hidden (no phone number found during scraping)</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Message Composer */}
        <div className="xl:col-span-2 space-y-4">
          {/* Template picker */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Message Templates
              </h3>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {showTemplates ? 'Hide' : 'Browse'} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showTemplates && (
              <div className="grid grid-cols-2 gap-2">
                {MESSAGE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      selectedTemplate === tpl.id
                        ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            )}

            {/* Personalization hint */}
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <span className="text-slate-500">Variables:</span>
              {['{name}', '{business}'].map((v) => (
                <span key={v} className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">{v}</span>
              ))}
            </div>

            {/* Message textarea */}
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={10}
              placeholder="Type your WhatsApp message here...
Use {name} for lead name
Use {business} for business name"
              className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-mono leading-relaxed"
            />

            <p className="text-xs text-slate-500">{messageText.length} characters</p>
          </div>

          {/* Send button */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Selected leads:</span>
              <span className="font-bold text-indigo-400">{selectedLeads.length}</span>
            </div>

            {sending && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Opening WhatsApp...</span>
                  <span>{sentCount} / {selectedLeads.length}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${(sentCount / selectedLeads.length) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Please allow popups in your browser for bulk sending.
                </p>
              </div>
            )}

            <button
              onClick={handleBulkSend}
              disabled={sending || selectedLeads.length === 0}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                selectedLeads.length === 0 || sending
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white shadow-lg shadow-green-500/20'
              }`}
            >
              {sending ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Send to {selectedLeads.length} Leads via WhatsApp</>
              )}
            </button>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Each lead will open in a new WhatsApp tab. Message is personalised automatically using lead data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsApp;
