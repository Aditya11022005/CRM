import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Compass, Zap, Table, Download, Star, StopCircle, RefreshCcw, Search, Eye, Plus, X, Cpu, Sparkles, Copy, Trash2, Pencil } from 'lucide-react';
import api from '../services/api';
import socketIOClient from 'socket.io-client';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['New', 'Contacted', 'Interested', 'Follow-up', 'Converted', 'Closed'];

const Leads = () => {
  const { activeBusinessId } = useSelector((state) => state.auth);

  // Method 1 States
  const [placesQuery, setPlacesQuery] = useState('');
  const [placesLocation, setPlacesLocation] = useState('');
  const [simulatePlaces, setSimulatePlaces] = useState(true);

  // Method 2 States
  const [scrapeQuery, setScrapeQuery] = useState('');
  const [scrapeCity, setScrapeCity] = useState('');
  const [scrapeSource, setScrapeSource] = useState('Google Maps');
  const [scrapeLimit, setScrapeLimit] = useState(50);
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [activeScrapeJob, setActiveScrapeJob] = useState(null);
  const [scrapeLogs, setScrapeLogs] = useState([]);
  
  // Leads List States
  const [leads, setLeads] = useState([]);
  const [localSearch, setLocalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [bulkEnriching, setBulkEnriching] = useState(false);
  
  // Manual Lead Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualWebsite, setManualWebsite] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualRating, setManualRating] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // AI Pitch Modal States
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [pitchText, setPitchText] = useState('');
  const [loadingPitch, setLoadingPitch] = useState(false);
  const [pitchType, setPitchType] = useState('whatsapp');

  const consoleEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load Leads
  const fetchLeads = async (page = 1) => {
    try {
      setLoadingLeads(true);
      const res = await api.get(`/leads?page=${page}&limit=10&search=${encodeURIComponent(localSearch)}`);
      if (res.data.success) {
        setLeads(res.data.leads);
        setCurrentPage(res.data.currentPage || 1);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load lead lists');
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleCreateManualLead = async (e) => {
    e.preventDefault();
    if (!manualName) return toast.error('Lead name is required');

    const loadingToast = toast.loading(editingLeadId ? 'Updating lead...' : 'Adding manual lead...');
    try {
      const payload = {
        name: manualName,
        phone: manualPhone,
        email: manualEmail,
        website: manualWebsite,
        address: manualAddress,
        rating: parseFloat(manualRating) || 0,
        category: manualCategory,
        city: manualCity,
      };

      let res;
      if (editingLeadId) {
        res = await api.put(`/leads/${editingLeadId}`, payload);
      } else {
        res = await api.post('/leads', payload);
      }

      if (res.data.success) {
        toast.dismiss(loadingToast);
        toast.success(res.data.message || (editingLeadId ? 'Lead updated successfully!' : 'Lead added successfully!'));
        setShowAddModal(false);
        // Reset states
        setEditingLeadId(null);
        setManualName('');
        setManualPhone('');
        setManualEmail('');
        setManualWebsite('');
        setManualAddress('');
        setManualRating('');
        setManualCategory('');
        setManualCity('');
        fetchLeads(currentPage);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.error || (editingLeadId ? 'Failed to update lead' : 'Failed to add lead'));
    }
  };

  const handleOpenAddModal = () => {
    setEditingLeadId(null);
    setManualName('');
    setManualPhone('');
    setManualEmail('');
    setManualWebsite('');
    setManualAddress('');
    setManualRating('');
    setManualCategory('');
    setManualCity('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (lead) => {
    setEditingLeadId(lead._id);
    setManualName(lead.name || '');
    setManualPhone(lead.phone || '');
    setManualEmail(lead.email || '');
    setManualWebsite(lead.website || '');
    setManualAddress(lead.address || '');
    setManualRating(lead.rating ? String(lead.rating) : '');
    setManualCategory(lead.category || '');
    setManualCity(lead.city || '');
    setShowAddModal(true);
  };

  useEffect(() => {
    if (activeBusinessId) {
      fetchLeads(1);
      checkScraperStatus();
    }
  }, [activeBusinessId, localSearch]);

  // Connect socket logs
  useEffect(() => {
    if (!activeBusinessId) return;

    const socket = socketIOClient(import.meta.env.VITE_SOCKET_URL || window.location.origin || 'http://localhost:5000');
    socket.emit('join_business', activeBusinessId);

    socket.on('scraping_log', (data) => {
      setScrapeLogs((prev) => [...prev, `[${data.progress}%] ${data.message}`]);
      if (data.progress !== undefined) {
        setScrapeProgress(data.progress);
      }
      if (data.progress === 100) {
        setActiveScrapeJob(null);
        fetchLeads(1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeBusinessId]);

  // Scroll live terminal to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scrapeLogs]);
  useEffect(() => {
    setSelectedLeadIds([]);
  }, [leads]);
  const checkScraperStatus = async () => {
    try {
      const res = await api.get('/leads/scrape-status');
      if (res.data.success && res.data.active) {
        setActiveScrapeJob(res.data.job);
        setScrapeLogs(['[0%] Reconnected to active scraping job...']);
      }
    } catch (err) {
      // quiet fail
    }
  };

  // Run Official Places API Search
  const handlePlacesSearch = async (e) => {
    e.preventDefault();
    if (!placesQuery) return toast.error('Specify a search query (e.g. Pizza, Solar)');

    const loadingToast = toast.loading('Querying Google Places...');
    try {
      const res = await api.post('/leads/search-places', {
        query: placesQuery,
        location: placesLocation,
        simulate: simulatePlaces,
      });

      if (res.data.success) {
        toast.dismiss(loadingToast);
        toast.success(`Discovered ${res.data.count} leads successfully!`);
        fetchLeads(1);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.error || 'Places search failed');
    }
  };

  // Launch Automated Puppeteer Scraper
  const handleLaunchScraper = async (e) => {
    e.preventDefault();
    if (!scrapeQuery || !scrapeCity) return toast.error('Enter query and city context');

    setScrapeProgress(0);
    setScrapeLogs([`[0%] Initializing browser scraper cluster for ${scrapeSource} in city: ${scrapeCity} (Limit: ${scrapeLimit} leads per city)...`]);
    try {
      const res = await api.post('/leads/scrape-maps', {
        query: scrapeQuery,
        city: scrapeCity,
        category: scrapeQuery,
        source: scrapeSource,
        limit: parseInt(scrapeLimit) || 50,
      });

      if (res.data.success) {
        setActiveScrapeJob(res.data.businessId);
        toast.success(`${scrapeSource} scraper triggered in background!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Scraper failed to initiate');
    }
  };

  // Interrupt Scraper
  const handleStopScraper = async () => {
    try {
      const res = await api.post('/leads/scrape-stop');
      if (res.data.success) {
        setActiveScrapeJob(null);
        setScrapeLogs((prev) => [...prev, '[INTERRUPTED] Scraping aborted by user query request.']);
        toast.success('Scraper job stopped.');
      }
    } catch (err) {
      toast.error('Failed to interrupt scraping job.');
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = async (id) => {
    try {
      const res = await api.patch(`/leads/${id}/favorite`);
      if (res.data.success) {
        setLeads((prev) =>
          prev.map((lead) => (lead._id === id ? { ...lead, isFavorite: !lead.isFavorite } : lead))
        );
        toast.success(res.data.isFavorite ? 'Added to favorites!' : 'Removed from favorites');
      }
    } catch (err) {
      toast.error('Favorite status update error');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await api.put(`/leads/${id}`, { status: newStatus });
      if (res.data.success) {
        setLeads((prev) =>
          prev.map((lead) => (lead._id === id ? { ...lead, status: newStatus } : lead))
        );
        toast.success('Lead status updated!');
      }
    } catch (err) {
      toast.error('Failed to update lead status');
    }
  };

  // Trigger AI enrichment on a lead
  const handleTriggerAIEnrich = async (id) => {
    const loadingToast = toast.loading('Gemini is auditing lead website & building strategy...');
    try {
      const res = await api.post(`/leads/${id}/ai-enrich`);
      toast.dismiss(loadingToast);
      if (res.data.success) {
        setLeads((prev) =>
          prev.map((lead) => (lead._id === id ? res.data.data : lead))
        );
        toast.success('AI Audit completed successfully!');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.error || 'Gemini enrichment failed.');
    }
  };

  // Open pitch modal and trigger first pitch generation
  const handleOpenPitchModal = (lead) => {
    setSelectedLead(lead);
    setShowPitchModal(true);
    setPitchText('');
    generatePitch(lead, 'whatsapp');
  };

  // Generate pitch text from API
  const generatePitch = async (lead, type) => {
    setLoadingPitch(true);
    setPitchType(type);
    try {
      const res = await api.get(`/leads/${lead._id}/ai-pitch?type=${type}`);
      if (res.data.success) {
        setPitchText(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to generate outreach pitch.');
    } finally {
      setLoadingPitch(false);
    }
  };

  // Delete lead
  const handleDeleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      const res = await api.delete(`/leads/${id}`);
      if (res.data.success) {
        setLeads((prev) => prev.filter((lead) => lead._id !== id));
        toast.success('Lead deleted successfully');
      }
    } catch (err) {
      toast.error('Failed to delete lead');
    }
  };

  // Bulk AI Enrich current page
  const handleBulkAIEnrich = async () => {
    const targetIds = selectedLeadIds.length > 0 
      ? selectedLeadIds 
      : leads.filter((l) => !l.aiEnriched).map((l) => l._id);

    if (targetIds.length === 0) {
      return toast.error(selectedLeadIds.length > 0 ? 'No selected leads found to enrich' : 'All leads on this page are already AI-enriched!');
    }

    if (!window.confirm(`Are you sure you want to AI-enrich ${targetIds.length} leads? This might take a few moments.`)) {
      return;
    }

    setBulkEnriching(true);
    const bulkToast = toast.loading(`Enriching ${targetIds.length} leads using Gemini AI...`);
    try {
      const res = await api.post('/leads/bulk-enrich', {
        leadIds: targetIds,
      });

      if (res.data.success) {
        toast.dismiss(bulkToast);
        toast.success(res.data.message || 'Bulk AI enrichment completed!');
        setSelectedLeadIds([]);
        fetchLeads(currentPage);
      }
    } catch (err) {
      toast.dismiss(bulkToast);
      toast.error(err.response?.data?.error || 'Bulk enrichment failed.');
    } finally {
      setBulkEnriching(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (leads.length === 0) return toast.error('No leads to export');

    const headers = ['Name', 'Phone', 'Email', 'Website', 'Rating', 'ReviewsCount', 'Address', 'Source', 'City', 'Status'];
    const csvRows = [headers.join(',')];

    leads.forEach((l) => {
      const values = [
        `"${(l.name || '').replace(/"/g, '""')}"`,
        `"${l.phone || ''}"`,
        `"${l.email || ''}"`,
        `"${l.website || ''}"`,
        l.rating || 0,
        l.reviewsCount || 0,
        `"${(l.address || '').replace(/"/g, '""')}"`,
        l.source || '',
        `"${l.city || ''}"`,
        `"${l.status || 'New'}"`,
      ];
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Codeitz_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV sheet downloaded!');
  };

  // Import CSV
  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      if (!text) return toast.error('Empty file uploaded');

      try {
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          return toast.error('No lead records found in CSV');
        }

        // Parse headers
        const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
        
        // Find indices
        const nameIdx = rawHeaders.findIndex(h => h.includes('name') || h.includes('title') || h.includes('company'));
        if (nameIdx === -1) {
          return toast.error('CSV must contain a header matching "Name" or "Company"');
        }

        const phoneIdx = rawHeaders.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact'));
        const emailIdx = rawHeaders.findIndex(h => h.includes('email') || h.includes('mail'));
        const websiteIdx = rawHeaders.findIndex(h => h.includes('website') || h.includes('web') || h.includes('site'));
        const ratingIdx = rawHeaders.findIndex(h => h.includes('rating') || h.includes('star'));
        const categoryIdx = rawHeaders.findIndex(h => h.includes('category') || h.includes('niche') || h.includes('industry'));
        const cityIdx = rawHeaders.findIndex(h => h.includes('city') || h.includes('location'));
        const addressIdx = rawHeaders.findIndex(h => h.includes('address') || h.includes('street'));

        const parsedLeads = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Simple CSV splitter that respects quotes
          const cells = [];
          let currentCell = '';
          let inQuotes = false;
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cells.push(currentCell.trim().replace(/^["']|["']$/g, ''));
              currentCell = '';
            } else {
              currentCell += char;
            }
          }
          cells.push(currentCell.trim().replace(/^["']|["']$/g, ''));

          const name = cells[nameIdx];
          if (!name) continue;

          parsedLeads.push({
            name,
            phone: phoneIdx !== -1 ? cells[phoneIdx] || '' : '',
            email: emailIdx !== -1 ? cells[emailIdx] || '' : '',
            website: websiteIdx !== -1 ? cells[websiteIdx] || '' : '',
            rating: ratingIdx !== -1 ? parseFloat(cells[ratingIdx]) || 0 : 0,
            category: categoryIdx !== -1 ? cells[categoryIdx] || '' : '',
            city: cityIdx !== -1 ? cells[cityIdx] || '' : '',
            address: addressIdx !== -1 ? cells[addressIdx] || '' : '',
            source: 'CSV Import',
          });
        }

        if (parsedLeads.length === 0) {
          return toast.error('No valid leads parsed from CSV');
        }

        if (!window.confirm(`Parsed ${parsedLeads.length} leads from CSV. Import them into your active workspace?`)) {
          return;
        }

        const importToast = toast.loading(`Importing ${parsedLeads.length} leads...`);
        const res = await api.post('/leads/import', { leads: parsedLeads });
        toast.dismiss(importToast);

        if (res.data.success) {
          toast.success(res.data.message || 'Import completed!');
          fetchLeads(1);
        }
      } catch (err) {
        toast.error('Failed to parse CSV file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeadIds(leads.map((l) => l._id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectLead = (id) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedLeadIds.length} selected leads?`)) {
      return;
    }

    const deleteToast = toast.loading(`Deleting ${selectedLeadIds.length} leads...`);
    try {
      const res = await api.post('/leads/bulk-delete', { leadIds: selectedLeadIds });
      toast.dismiss(deleteToast);
      if (res.data.success) {
        toast.success(res.data.message || 'Leads deleted successfully');
        setSelectedLeadIds([]);
        fetchLeads(currentPage);
      }
    } catch (err) {
      toast.dismiss(deleteToast);
      toast.error('Failed to delete selected leads');
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedLeadIds.length === 0 || !status) return;

    const statusToast = toast.loading(`Updating status for ${selectedLeadIds.length} leads...`);
    try {
      const res = await api.post('/leads/bulk-status', { leadIds: selectedLeadIds, status });
      toast.dismiss(statusToast);
      if (res.data.success) {
        toast.success(res.data.message || 'Status updated successfully');
        setSelectedLeadIds([]);
        fetchLeads(currentPage);
      }
    } catch (err) {
      toast.dismiss(statusToast);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Lead Generation Engine</h1>
          <p className="text-xs text-slate-500 mt-1">Acquire targeted B2B contact lists using official Places API or infinite-scroll Puppeteer</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start shadow-lg shadow-indigo-600/10 transition-colors font-outfit uppercase tracking-wider"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Manual Lead</span>
        </button>
      </div>

      {/* Active Scraping Animation Panel */}
      {activeScrapeJob && (
        <div className="p-6 rounded-2xl bg-indigo-950/25 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)] flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 border border-indigo-500/40 animate-ping"></div>
              <div className="absolute inset-2 rounded-full bg-indigo-500/20 border border-indigo-500/60 animate-pulse"></div>
              <div className="w-6 h-6 rounded-full bg-indigo-505 bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                <Zap className="w-3.5 h-3.5 text-white animate-bounce" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit flex items-center gap-2">
                Scraping Engine In Progress
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h3>
              <p className="text-xs text-indigo-300/80 mt-0.5">Automated Puppeteer cluster is scraping prospects from {scrapeSource} in real-time...</p>
            </div>
          </div>
          
          <button
            onClick={handleStopScraper}
            className="px-4 py-2 bg-rose-650 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/15 uppercase tracking-wider font-outfit"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>Abort Engine</span>
          </button>
        </div>
      )}

      {/* Double Generator Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Method 1 Panel */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Method 1: Google Places Search</h3>
              <span className="text-[10px] text-slate-500 block -mt-0.5">Dispatches search query parameters via API integrations</span>
            </div>
          </div>

          <form onSubmit={handlePlacesSearch} className="space-y-3.5 flex-1 flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Category Keyword</label>
                <input
                  type="text"
                  placeholder="e.g. Solar Contractors"
                  value={placesQuery}
                  onChange={(e) => setPlacesQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Location City</label>
                <input
                  type="text"
                  placeholder="e.g. Pune, India"
                  value={placesLocation}
                  onChange={(e) => setPlacesLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="simulatePlaces"
                checked={simulatePlaces}
                onChange={(e) => setSimulatePlaces(e.target.checked)}
                className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="simulatePlaces" className="text-[10px] text-slate-400 cursor-pointer select-none">
                Simulate Results (Bypasses missing Google Places key restrictions)
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 font-outfit uppercase tracking-wider mt-auto"
            >
              Search Google Places API
            </button>
          </form>
        </div>

        {/* Method 2 Panel (Puppeteer Scraper) */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Method 2: Multi-Platform Scraper (Puppeteer)</h3>
              <span className="text-[10px] text-slate-500 block -mt-0.5">Automates browser bots to crawl Google, Justdial or IndiaMart</span>
            </div>
          </div>

          <form onSubmit={handleLaunchScraper} className="space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Scrape Source</label>
                <select
                  value={scrapeSource}
                  onChange={(e) => setScrapeSource(e.target.value)}
                  disabled={!!activeScrapeJob}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 disabled:opacity-50 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="Google Maps">Google Maps</option>
                  <option value="Justdial">Justdial</option>
                  <option value="IndiaMart">IndiaMart</option>
                  <option value="Yellow Pages">Yellow Pages</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Category Keyword</label>
                <input
                  type="text"
                  placeholder="e.g. Dentists"
                  value={scrapeQuery}
                  onChange={(e) => setScrapeQuery(e.target.value)}
                  disabled={!!activeScrapeJob}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 disabled:opacity-50 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">City Target(s)</label>
                <input
                  type="text"
                  placeholder="e.g. Pune, Mumbai"
                  value={scrapeCity}
                  onChange={(e) => setScrapeCity(e.target.value)}
                  disabled={!!activeScrapeJob}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 disabled:opacity-50 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <span className="text-[9px] text-slate-500 block mt-1">Separate with commas for campaign</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Scrape Limit (Per City)</label>
                <select
                  value={scrapeLimit}
                  onChange={(e) => setScrapeLimit(e.target.value)}
                  disabled={!!activeScrapeJob}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 disabled:opacity-50 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="10">10 Leads</option>
                  <option value="20">20 Leads</option>
                  <option value="50">50 Leads</option>
                  <option value="100">100 Leads</option>
                  <option value="200">200 Leads</option>
                  <option value="500">500 Leads</option>
                </select>
              </div>
            </div>

            {activeScrapeJob ? (
              <button
                type="button"
                onClick={handleStopScraper}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-rose-600/15 border border-rose-600/30 text-rose-400 hover:bg-rose-600/25 flex items-center justify-center gap-1.5 font-outfit uppercase tracking-wider mt-4"
              >
                <StopCircle className="w-4 h-4" /> Stop Scraping Job
              </button>
            ) : (
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 font-outfit uppercase tracking-wider mt-4"
              >
                Launch Automated Scraper
              </button>
            )}
          </form>
        </div>

      </div>

      {/* Websocket live console logs */}
      {(activeScrapeJob || scrapeLogs.length > 0) && (
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-400">Live Scraper Output Terminal</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">Campaign Progress:</span>
              <span className="text-xs font-bold text-white font-mono">{scrapeProgress}%</span>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.4)]"
              style={{ width: `${scrapeProgress}%` }}
            ></div>
          </div>

          <div className="h-32 bg-slate-950 border border-slate-850 rounded-xl p-3 font-mono text-[10px] text-indigo-400 overflow-y-auto space-y-1">
            {scrapeLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                {log}
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
        
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-4 border-b border-slate-800/40">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search local lead data..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleBulkAIEnrich}
              disabled={bulkEnriching || leads.filter((l) => !l.aiEnriched).length === 0}
              className="px-4 py-2 rounded-xl bg-indigo-900/40 border border-indigo-750/30 hover:bg-indigo-900/60 disabled:opacity-45 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed"
            >
              <Cpu className={`w-3.5 h-3.5 ${bulkEnriching ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{bulkEnriching ? 'Enriching...' : 'Bulk AI Enrich Page'}</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl border border-slate-800/80 hover:bg-slate-900 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-450" />
              <span>Import CSV</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl border border-slate-800/80 hover:bg-slate-900 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => fetchLeads(currentPage)}
              className="p-2 rounded-xl border border-slate-800/80 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {selectedLeadIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-indigo-950/45 border border-indigo-850/40 mb-3 animate-enter">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
              <span className="text-xs text-indigo-305 font-bold">{selectedLeadIds.length} lead(s) selected</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Status:</span>
                <select
                  onChange={(e) => {
                    handleBulkStatusUpdate(e.target.value);
                    e.target.value = '';
                  }}
                  className="px-2 py-1 rounded-lg text-[9px] font-bold bg-slate-950 border border-slate-850 text-slate-350 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Change --</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-slate-900 text-slate-300 text-xs">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleBulkAIEnrich}
                disabled={bulkEnriching}
                className="px-2.5 py-1 rounded-lg bg-indigo-650 hover:bg-indigo-500 disabled:opacity-50 text-[9px] font-bold text-white flex items-center gap-1 transition-colors"
              >
                <Cpu className={`w-3 h-3 ${bulkEnriching ? 'animate-spin' : ''}`} />
                <span>Enrich Selected</span>
              </button>

              <button
                onClick={handleBulkDelete}
                className="px-2.5 py-1 rounded-lg bg-rose-650 hover:bg-rose-500 text-[9px] font-bold text-white flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        )}

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-bold text-center w-8">
                  <input
                    type="checkbox"
                    checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-bold">Name</th>
                <th className="py-3 px-4 font-bold">Contact Number</th>
                <th className="py-3 px-4 font-bold">Email</th>
                <th className="py-3 px-4 font-bold">Website</th>
                <th className="py-3 px-4 font-bold">Rating</th>
                <th className="py-3 px-4 font-bold">Source</th>
                <th className="py-3 px-4 font-bold">City</th>
                <th className="py-3 px-4 font-bold">AI Audit</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingLeads ? (
                <tr>
                  <td colSpan="15" className="py-12 text-center text-slate-500 font-semibold">
                    Loading lead data...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="15" className="py-12 text-center text-slate-500 font-semibold">
                    No leads collected yet. Launch Places search or Automated scraper above!
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l._id} className="border-b border-slate-800/30 hover:bg-slate-900/10 transition-colors">
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(l._id)}
                        onChange={() => handleSelectLead(l._id)}
                        className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200 max-w-[200px] truncate">{l.name}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-400">{l.phone || 'No phone'}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {l.email ? (
                        <a href={`mailto:${l.email}`} className="text-indigo-400 hover:underline">
                          {l.email}
                        </a>
                      ) : (
                        <span className="text-slate-600">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {l.website ? (
                        <a
                          href={l.website.startsWith('http') ? l.website : `https://${l.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:underline max-w-[150px] truncate block"
                        >
                          {l.website.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      ) : (
                        <span className="text-slate-600">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-amber-400 font-bold">{l.rating || 'N/A'} ★</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        l.source === 'Google Places' ? 'bg-indigo-600/10 text-indigo-400' : 'bg-violet-600/10 text-violet-400'
                      }`}>
                        {l.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 capitalize">{l.city || 'mumbai'}</td>
                    <td className="py-3.5 px-4">
                      {l.aiEnriched ? (
                        <div className="flex flex-col gap-0.5 max-w-[200px]">
                          <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold w-max ${
                            l.aiScore === 'High' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            l.aiScore === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {l.aiScore} Priority
                          </span>
                          {l.ownerName && <span className="text-[9px] text-slate-400 truncate">Owner: {l.ownerName}</span>}
                          <span className="text-[9px] text-slate-500 line-clamp-1 hover:line-clamp-none cursor-pointer" title={l.aiAnalysis}>
                            {l.aiAnalysis}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleTriggerAIEnrich(l._id)}
                          className="px-2 py-1 rounded-lg text-[9px] font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 flex items-center gap-1 transition-all"
                        >
                          <Cpu className="w-3 h-3" /> Audit
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={l.status || 'New'}
                        onChange={(e) => handleUpdateStatus(l._id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-950 border border-slate-800 focus:outline-none cursor-pointer ${
                          l.status === 'Converted' ? 'text-emerald-400 border-emerald-500/30' :
                          l.status === 'Interested' ? 'text-indigo-400 border-indigo-500/30' :
                          l.status === 'Follow-up' ? 'text-amber-400 border-amber-500/30' :
                          l.status === 'Contacted' ? 'text-sky-400 border-sky-500/30' :
                          l.status === 'Closed' ? 'text-rose-450 border-rose-500/30' :
                          'text-slate-400 border-slate-800'
                        }`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="bg-slate-900 text-slate-300 text-xs">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2.5">
                        <button onClick={() => handleToggleFavorite(l._id)} className="text-slate-500 hover:text-amber-400 transition-colors" title="Favorite">
                          <Star className={`w-4 h-4 ${l.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                        </button>
                        <button onClick={() => handleOpenEditModal(l)} className="text-slate-550 hover:text-indigo-400 transition-colors" title="Edit Lead">
                          <Pencil className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-400" />
                        </button>
                        <button onClick={() => handleOpenPitchModal(l)} className="text-slate-500 hover:text-indigo-400 transition-colors" title="AI Outreach Pitch">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                        </button>
                        <button onClick={() => handleDeleteLead(l._id)} className="text-slate-500 hover:text-rose-500 transition-colors" title="Delete Lead">
                          <Trash2 className="w-4 h-4 text-rose-550 hover:text-rose-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-800/40 text-xs">
            <span className="text-slate-500 font-semibold">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => fetchLeads(currentPage - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-900 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => fetchLeads(currentPage + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-900 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Manual Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-enter">
          <div className="w-full max-w-lg rounded-2xl glass-panel border border-slate-800/80 p-6 shadow-2xl space-y-4 relative bg-slate-900">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h2 className="text-base font-bold text-white font-outfit">{editingLeadId ? 'Edit Lead Details' : 'Add Manual Lead'}</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{editingLeadId ? 'Update details for this prospect in your active workspace' : 'Manually input B2B prospect records into your active workspace'}</p>
            </div>

            <form onSubmit={handleCreateManualLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Lead Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Category Keyword</label>
                  <input
                    type="text"
                    placeholder="e.g. Solar, Salon, Agency"
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@acme.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Website Link</label>
                  <input
                    type="text"
                    placeholder="e.g. https://acme.com"
                    value={manualWebsite}
                    onChange={(e) => setManualWebsite(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Target City</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune"
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Google Maps Rating (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="e.g. 4.5"
                    value={manualRating}
                    onChange={(e) => setManualRating(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Full Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 12, Commercial St, Pune"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 transition-colors font-outfit uppercase tracking-wider"
                >
                  {editingLeadId ? 'Save Changes' : 'Add Lead Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Outreach Pitch Modal */}
      {showPitchModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" /> Codeitz AI Assistant
                </span>
                <h2 className="text-base font-bold text-white font-outfit mt-0.5">Outreach Pitch for {selectedLead.name}</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Personalized digital proposal tailored to local business parameters</p>
              </div>
              <button
                onClick={() => setShowPitchModal(false)}
                className="p-1.5 rounded-lg border border-slate-850 hover:bg-slate-805 bg-slate-950 text-slate-550 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800/80 gap-2">
              <button
                onClick={() => generatePitch(selectedLead, 'whatsapp')}
                className={`pb-2.5 px-4 text-xs font-bold transition-all relative ${
                  pitchType === 'whatsapp' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                WhatsApp Message
              </button>
              <button
                onClick={() => generatePitch(selectedLead, 'email')}
                className={`pb-2.5 px-4 text-xs font-bold transition-all relative ${
                  pitchType === 'email' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Cold Email Template
              </button>
            </div>

            {/* Pitch Text Area */}
            <div className="min-h-[200px] bg-slate-950/50 border border-slate-800/60 rounded-xl p-4 relative flex flex-col justify-between">
              {loadingPitch ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-[2px] rounded-xl space-y-2">
                  <Cpu className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-[11px] text-slate-400 font-semibold animate-pulse">Gemini is drafting outreach strategy...</span>
                </div>
              ) : null}

              <textarea
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                placeholder="Pitch content will appear here..."
                rows="10"
                className="w-full bg-transparent text-xs text-slate-200 focus:outline-none resize-none leading-relaxed"
                readOnly={loadingPitch}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pitchText);
                  toast.success('Pitch text copied to clipboard!');
                }}
                disabled={!pitchText || loadingPitch}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-slate-350 border border-slate-800 hover:text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Pitch</span>
              </button>

              {pitchType === 'whatsapp' ? (
                <a
                  href={`https://api.whatsapp.com/send?phone=${(selectedLead.phone || '').replace(/[^0-9]/g, '')}&text=${encodeURIComponent(pitchText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold bg-emerald-650 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-600/10 transition-colors flex items-center justify-center gap-1.5 font-outfit uppercase tracking-wider ${
                    (!pitchText || loadingPitch) ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </a>
              ) : (
                <a
                  href={`mailto:${selectedLead.email || ''}?subject=${encodeURIComponent(`Strategic proposal for ${selectedLead.name}`)}&body=${encodeURIComponent(pitchText)}`}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold bg-indigo-650 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 transition-colors flex items-center justify-center gap-1.5 font-outfit uppercase tracking-wider ${
                    (!pitchText || loadingPitch) ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Send via Email</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Leads;
