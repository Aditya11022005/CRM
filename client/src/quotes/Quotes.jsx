import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Trash2, Download, Eye, FileText, Check, Clock, ShieldCheck, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

const Quotes = () => {
  const { activeBusinessId } = useSelector((state) => state.auth);

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);

  // Quote Builder States
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState('All estimates are valid for 30 days. Payments terms: 50% advance.');
  
  const [items, setItems] = useState([
    { description: 'Service Consulting', quantity: 1, rate: 5000, gstPercent: 18, discountPercent: 0 }
  ]);

  // Totals calculations (Client-side display)
  const [totals, setTotals] = useState({ subtotal: 0, discountTotal: 0, gstTotal: 0, total: 0 });

  // Signature canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [businessProfile, setBusinessProfile] = useState(null);

  useEffect(() => {
    const fetchBusinessProfile = async () => {
      try {
        if (activeBusinessId) {
          const res = await api.get(`/businesses/${activeBusinessId}`);
          if (res.data.success) {
            setBusinessProfile(res.data.business);
          }
        }
      } catch (err) {
        console.error('Failed to load business profile', err);
      }
    };
    fetchBusinessProfile();
  }, [activeBusinessId]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotes');
      if (res.data.success) {
        setQuotes(res.data.quotes);
      }
    } catch (err) {
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quote estimate?')) return;
    const loadingToast = toast.loading('Deleting quote...');
    try {
      const res = await api.delete(`/quotes/${id}`);
      if (res.data.success) {
        toast.success('Quote deleted successfully', { id: loadingToast });
        fetchQuotes();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete quote', { id: loadingToast });
    }
  };

  useEffect(() => {
    if (activeBusinessId) {
      fetchQuotes();
    }
  }, [activeBusinessId]);

  // Recalculate totals on item rows modifications
  useEffect(() => {
    let sub = 0;
    let disc = 0;
    let gst = 0;

    items.forEach((item) => {
      const q = parseFloat(item.quantity) || 0;
      const r = parseFloat(item.rate) || 0;
      const g = parseFloat(item.gstPercent) || 0;
      const d = parseFloat(item.discountPercent) || 0;

      const base = q * r;
      const discVal = base * (d / 100);
      const afterDisc = base - discVal;
      const gstVal = afterDisc * (g / 100);

      sub += base;
      disc += discVal;
      gst += gstVal;
    });

    setTotals({
      subtotal: sub,
      discountTotal: disc,
      gstTotal: gst,
      total: sub - disc + gst,
    });
  }, [items]);

  const handleAddItemRow = () => {
    setItems([...items, { description: 'New Item', quantity: 1, rate: 1000, gstPercent: 18, discountPercent: 0 }]);
  };

  const handleItemChange = (index, field, value) => {
    const next = [...items];
    next[index][field] = value;
    setItems(next);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return toast.error('Quote requires at least 1 item');
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Canvas signature drawer handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f8fafc'; // white ink for dark ui canvas
    ctx.beginPath();
    
    // offset coordinates
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Submit quote builder
  const handleBuildQuote = async (e) => {
    e.preventDefault();
    if (!clientName || !dueDate) return toast.error('Client name and due date are required');

    const loadingToast = toast.loading('Compiling Quote proposal...');
    try {
      const res = await api.post('/quotes', {
        clientName,
        clientEmail,
        dueDate,
        items,
        notes,
        termsConditions,
      });

      if (res.data.success) {
        toast.dismiss(loadingToast);
        toast.success('Quote generated successfully!');
        setShowBuilder(false);
        fetchQuotes();
        
        // Reset inputs
        setClientName('');
        setClientEmail('');
        setDueDate('');
        setItems([{ description: 'Service Consulting', quantity: 1, rate: 5000, gstPercent: 18, discountPercent: 0 }]);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to create quote');
    }
  };

  // Update Quote Status
  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/quotes/${id}`, { status });
      if (res.data.success) {
        toast.success(`Quote status marked: ${status}`);
        fetchQuotes();
      }
    } catch (err) {
      toast.error('Failed to update quote status');
    }
  };

  // Generate and Download Quote PDF
  const downloadQuotePDF = async (quote) => {
    const doc = new jsPDF();
    
    // Top colored decorative bar (different accent, violet for Quote)
    doc.setFillColor(124, 58, 237); // Violet-600
    doc.rect(0, 0, 210, 8, 'F');
    
    // Helper to get base64 logo
    const getBase64Image = (imgUrl) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = imgUrl;
      });
    };

    // Draw branding header block
    let logoDrawn = false;
    if (businessProfile?.logo) {
      const b64 = await getBase64Image(businessProfile.logo);
      if (b64) {
        doc.addImage(b64, 'PNG', 14, 15, 20, 20);
        logoDrawn = true;
      }
    }

    if (!logoDrawn) {
      // Elegant vector brand mark logo fallback
      doc.setFillColor(124, 58, 237);
      doc.roundedRect(14, 15, 20, 20, 3, 3, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(businessProfile?.name ? businessProfile.name.charAt(0).toUpperCase() : 'Q', 21, 29);
    }

    // Company profile info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(businessProfile?.name || 'Codeitz Client Partner', 38, 20);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate-500
    
    const street = businessProfile?.address?.street ? `${businessProfile.address.street}, ` : '';
    const cityStr = businessProfile?.address?.city ? `${businessProfile.address.city}, ` : '';
    const zipStr = businessProfile?.address?.zip ? `${businessProfile.address.zip}` : '';
    
    doc.text(`${street}${cityStr}${zipStr}`, 38, 25);
    doc.text(`Email: ${businessProfile?.email || 'N/A'}  |  Phone: ${businessProfile?.phone || 'N/A'}`, 38, 29);
    if (businessProfile?.gstNumber) {
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(`GSTIN: ${businessProfile.gstNumber}`, 38, 34);
    }

    // Document type label right aligned
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(124, 58, 237);
    doc.text('ESTIMATE PROPOSAL', 196, 22, { align: 'right' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Quote ID: ${quote.quoteNumber}`, 196, 28, { align: 'right' });
    doc.text(`Date: ${new Date(quote.createdAt || Date.now()).toLocaleDateString()}`, 196, 33, { align: 'right' });
    doc.text(`Due Date: ${new Date(quote.dueDate).toLocaleDateString()}`, 196, 38, { align: 'right' });

    // Quote status banner
    const isAccepted = quote.status === 'Accepted';
    const isDeclined = quote.status === 'Declined';
    let bannerBg = [241, 245, 249]; // Slate-100 default
    let bannerFg = [71, 85, 105];   // Slate-600
    if (isAccepted) {
      bannerBg = [209, 250, 229]; // emerald-100
      bannerFg = [6, 95, 70];    // emerald-800
    } else if (isDeclined) {
      bannerBg = [254, 226, 226]; // rose-100
      bannerFg = [153, 27, 27];   // rose-800
    }
    
    doc.setFillColor(bannerBg[0], bannerBg[1], bannerBg[2]);
    doc.roundedRect(144, 43, 52, 6, 1, 1, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(bannerFg[0], bannerFg[1], bannerFg[2]);
    doc.text(`STATUS: ${quote.status.toUpperCase()}`, 170, 47, { align: 'center' });

    // Client section divider line
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.5);
    doc.line(14, 54, 196, 54);

    // Client Details block
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('PROPOSAL PREPARED FOR:', 14, 62);
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(quote.clientName, 14, 68);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Email: ${quote.clientEmail || 'N/A'}`, 14, 73);

    // Table Headers
    let startY = 82;
    doc.setFillColor(248, 250, 252); // Slate-50 background for headers
    doc.roundedRect(14, startY, 182, 8, 1, 1, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Item Description', 18, startY + 5.5);
    doc.text('Qty', 94, startY + 5.5, { align: 'center' });
    doc.text('Rate (INR)', 116, startY + 5.5, { align: 'center' });
    doc.text('Disc %', 138, startY + 5.5, { align: 'center' });
    doc.text('GST %', 160, startY + 5.5, { align: 'center' });
    doc.text('Total (INR)', 184, startY + 5.5, { align: 'center' });

    // Items list rows
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    
    quote.items.forEach((item, idx) => {
      startY += 10;
      // Draw subtle row underline
      doc.setDrawColor(241, 245, 249);
      doc.line(14, startY + 9, 196, startY + 9);

      doc.text(item.description, 18, startY + 5.5);
      doc.text(item.quantity.toString(), 94, startY + 5.5, { align: 'center' });
      doc.text(item.rate.toLocaleString(), 116, startY + 5.5, { align: 'center' });
      doc.text(`${item.discountPercent}%`, 138, startY + 5.5, { align: 'center' });
      doc.text(`${item.gstPercent}%`, 160, startY + 5.5, { align: 'center' });
      
      const lineTotal = (item.quantity * item.rate * (1 - (item.discountPercent / 100)) * (1 + (item.gstPercent / 100)));
      doc.text(lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 184, startY + 5.5, { align: 'center' });
    });

    // Subtotal, GST tax, Total block
    startY += 18;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);

    doc.text('Subtotal:', 140, startY);
    doc.text(quote.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 194, startY, { align: 'right' });

    doc.text('GST Tax Total:', 140, startY + 6);
    doc.text(quote.gstTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 194, startY + 6, { align: 'right' });

    // Grand total highlights
    startY += 14;
    doc.setFillColor(241, 245, 249); // light blue/grey bar for grand total
    doc.rect(136, startY - 5, 60, 8, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Estimated Total:', 140, startY);
    doc.setTextColor(124, 58, 237);
    doc.text(`INR ${(quote.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 194, startY, { align: 'right' });

    // Terms
    if (quote.termsConditions) {
      startY += 18;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Terms & Conditions:', 14, startY);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(quote.termsConditions, 14, startY + 5);
    }

    // Professional footer signature & thank you message
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for choosing us! This is a system-generated proposal estimate.', 105, 285, { align: 'center' });

    doc.save(`Codeitz_Quote_${quote.quoteNumber}.pdf`);
    toast.success('Premium Quote Proposal PDF downloaded!');
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Quote Estimator Builder</h1>
          <p className="text-xs text-slate-500 mt-1">Generate estimates, compute GST tax, sign proposals, and export professional PDFs</p>
        </div>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start transition-colors"
        >
          {showBuilder ? 'Dismiss Form' : 'New Quote Proposal'}
        </button>
      </div>

      {/* Quote Builder Form */}
      {showBuilder && (
        <form onSubmit={handleBuildQuote} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-6 animate-enter">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Client/Company Name</label>
              <input
                type="text"
                placeholder="Apex Industries"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Client Email</label>
              <input
                type="email"
                placeholder="billing@apex.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Item Rows Table */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Estimate Line Items</span>
            
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-end p-3 rounded-xl bg-slate-950/60 border border-slate-850">
                  <div className="col-span-12 sm:col-span-4">
                    <label className="text-[9px] font-bold text-slate-500 block mb-1">Item Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <label className="text-[9px] font-bold text-slate-500 block mb-1">Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <label className="text-[9px] font-bold text-slate-500 block mb-1">Rate (₹)</label>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <label className="text-[9px] font-bold text-slate-500 block mb-1">GST %</label>
                    <input
                      type="number"
                      value={item.gstPercent}
                      onChange={(e) => handleItemChange(idx, 'gstPercent', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[9px] font-bold text-slate-500 block mb-1">Disc %</label>
                    <input
                      type="number"
                      value={item.discountPercent}
                      onChange={(e) => handleItemChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItemRow}
              className="px-3 py-1.5 rounded-xl border border-dashed border-slate-800 text-slate-400 hover:text-white flex items-center gap-1 text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>

          {/* Draw Signature Canvas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/40">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Estimate Terms & Conditions</label>
              <textarea
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-300 placeholder-slate-650 focus:outline-none resize-none"
              />
            </div>
            
            <div className="space-y-2 flex flex-col">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Draw Signature Verification</label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Clear Pad
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width="340"
                height="80"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="bg-slate-950 border border-slate-800 rounded-xl cursor-crosshair max-w-full flex-1"
              />
            </div>
          </div>

          {/* Sum displays and save */}
          <div className="pt-4 border-t border-slate-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1 text-xs text-slate-400 font-semibold">
              <div>Subtotal: ₹{totals.subtotal.toFixed(2)}</div>
              <div>GST Tax: ₹{totals.gstTotal.toFixed(2)}</div>
              <div className="text-sm font-bold text-white">Estimated Amount: ₹{totals.total.toFixed(2)}</div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider font-outfit"
            >
              Compile & Save Quote
            </button>
          </div>

        </form>
      )}

      {/* Estimates Listing Table */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
        <span className="text-xs font-bold text-slate-400 mb-4 block uppercase tracking-wide">Generated Quotes Registry</span>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-bold">Quote ID</th>
                <th className="py-3 px-4 font-bold">Client / Company Name</th>
                <th className="py-3 px-4 font-bold">Total (INR)</th>
                <th className="py-3 px-4 font-bold">Due Date</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-semibold">
                    Loading quotes database...
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-semibold">
                    No estimates built yet.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => (
                  <tr key={q._id} className="border-b border-slate-800/30 hover:bg-slate-900/10 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{q.quoteNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{q.clientName}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-300">₹{(q.total || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(q.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={q.status}
                        onChange={(e) => handleUpdateStatus(q._id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full outline-none cursor-pointer bg-slate-950 border ${
                          q.status === 'Accepted'
                            ? 'border-emerald-500/30 text-emerald-400'
                            : q.status === 'Declined'
                            ? 'border-rose-500/30 text-rose-400'
                            : 'border-slate-800 text-slate-400'
                        }`}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Declined">Declined</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => downloadQuotePDF(q)}
                          title="Download Quote PDF"
                          className="p-1.5 rounded bg-slate-950 text-indigo-400 border border-slate-800/60 hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuote(q._id)}
                          title="Delete Quote"
                          className="p-1.5 rounded bg-slate-950 text-rose-500 border border-slate-800/60 hover:text-white hover:bg-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Quotes;
