import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Trash2, CreditCard, QrCode, FileText, CheckCircle2, AlertCircle, Sparkles, Send, Download } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

const Invoices = () => {
  const { activeBusinessId } = useSelector((state) => state.auth);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);

  // Invoice builder states
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [templateName, setTemplateName] = useState('Classic');
  const [items, setItems] = useState([
    { description: 'Campaign Setup Fee', quantity: 1, rate: 8000, gstPercent: 18, discountPercent: 0 }
  ]);

  // Invoice Checkout overlays
  const [selectedInvoice, setSelectedInvoice] = useState(null);
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

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      if (res.data.success) {
        setInvoices(res.data.invoices);
      }
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    const loadingToast = toast.loading('Deleting invoice...');
    try {
      const res = await api.delete(`/invoices/${id}`);
      if (res.data.success) {
        toast.success('Invoice deleted successfully', { id: loadingToast });
        fetchInvoices();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete invoice', { id: loadingToast });
    }
  };

  useEffect(() => {
    if (activeBusinessId) {
      fetchInvoices();
    }
  }, [activeBusinessId]);

  const handleAddItemRow = () => {
    setItems([...items, { description: 'Campaign Item', quantity: 1, rate: 1000, gstPercent: 18, discountPercent: 0 }]);
  };

  const handleItemChange = (index, field, value) => {
    const next = [...items];
    next[index][field] = value;
    setItems(next);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return toast.error('Invoice requires at least 1 item');
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleBuildInvoice = async (e) => {
    e.preventDefault();
    if (!clientName || !dueDate) return toast.error('Client name and due date are required');

    const loadingToast = toast.loading('Compiling Invoice and generating UPI deep link...');
    try {
      const res = await api.post('/invoices', {
        clientName,
        clientEmail,
        dueDate,
        items,
        notes,
        templateName,
      });

      if (res.data.success) {
        toast.dismiss(loadingToast);
        toast.success('Invoice generated successfully!');
        setShowBuilder(false);
        fetchInvoices();
        
        // Reset states
        setClientName('');
        setClientEmail('');
        setDueDate('');
        setItems([{ description: 'Campaign Setup Fee', quantity: 1, rate: 8000, gstPercent: 18, discountPercent: 0 }]);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to create invoice');
    }
  };

  // Launch Razorpay Checkout Payment
  const launchRazorpayPayment = async (invoice) => {
    const loadingToast = toast.loading('Connecting Razorpay payment gateways...');
    try {
      // 1. Get payment order details
      const res = await api.post(`/invoices/${invoice._id}/payment-order`);
      if (res.data.success) {
        const { orderId, amount, currency, keyId } = res.data;

        toast.dismiss(loadingToast);

        // 2. Configure SDK options
        const options = {
          key: keyId,
          amount,
          currency,
          name: 'Codeitz CRM',
          description: `Payment for Invoice ${invoice.invoiceNumber}`,
          order_id: orderId,
          handler: async (response) => {
            const verifyToast = toast.loading('Confirming transaction ledger details...');
            try {
              // 3. Callback verify
              const verifyRes = await api.post(`/invoices/${invoice._id}/verify-payment`, {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });

              if (verifyRes.data.success) {
                toast.dismiss(verifyToast);
                toast.success('Invoice marked as Paid! Ledger updated.');
                setSelectedInvoice(null);
                fetchInvoices();
              }
            } catch (err) {
              toast.dismiss(verifyToast);
              toast.error('Payment confirmation mismatch. Please consult support.');
            }
          },
          prefill: {
            name: invoice.clientName,
            email: invoice.clientEmail || 'billing@codeitz.com',
          },
          theme: {
            color: '#6366f1',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Razorpay initialization rejected by sandbox environment.');
    }
  };

  const handleOpenCheckout = (inv) => {
    setSelectedInvoice(inv);
  };

  // Generate and Download Invoice PDF
  const downloadInvoicePDF = async (invoice) => {
    const doc = new jsPDF();
    
    // Top colored decorative bar
    doc.setFillColor(99, 102, 241); // Indigo-500
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
      doc.setFillColor(99, 102, 241);
      doc.roundedRect(14, 15, 20, 20, 3, 3, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(businessProfile?.name ? businessProfile.name.charAt(0).toUpperCase() : 'C', 21, 29);
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
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241);
    doc.text('TAX INVOICE', 196, 22, { align: 'right' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Invoice ID: ${invoice.invoiceNumber}`, 196, 28, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString()}`, 196, 33, { align: 'right' });
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 196, 38, { align: 'right' });

    // Payment status banner
    const isPaid = invoice.paymentStatus === 'Paid';
    doc.setFillColor(isPaid ? 209 : 254, isPaid ? 250 : 226, isPaid ? 229 : 226); // green or red background
    doc.roundedRect(144, 43, 52, 6, 1, 1, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(isPaid ? 6 : 153, isPaid ? 95 : 27, isPaid ? 70 : 27); // green or red text
    doc.text(`STATUS: ${invoice.paymentStatus.toUpperCase()}`, 170, 47, { align: 'center' });

    // Client section divider line
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.5);
    doc.line(14, 54, 196, 54);

    // Client Details block
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('BILL TO:', 14, 62);
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(invoice.clientName, 14, 68);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Email: ${invoice.clientEmail || 'N/A'}`, 14, 73);

    // Table Headers
    let startY = 82;
    doc.setFillColor(248, 250, 252); // Slate-50 background for headers
    doc.roundedRect(14, startY, 182, 8, 1, 1, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Item Description', 18, startY + 5.5);
    doc.text('Qty', 110, startY + 5.5, { align: 'center' });
    doc.text('Rate (INR)', 132, startY + 5.5, { align: 'center' });
    doc.text('GST %', 156, startY + 5.5, { align: 'center' });
    doc.text('Total (INR)', 184, startY + 5.5, { align: 'center' });

    // Items list rows
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    
    invoice.items.forEach((item, idx) => {
      startY += 10;
      // Draw subtle row underline
      doc.setDrawColor(241, 245, 249);
      doc.line(14, startY + 9, 196, startY + 9);

      doc.text(item.description, 18, startY + 5.5);
      doc.text(item.quantity.toString(), 110, startY + 5.5, { align: 'center' });
      doc.text(item.rate.toLocaleString(), 132, startY + 5.5, { align: 'center' });
      doc.text(`${item.gstPercent}%`, 156, startY + 5.5, { align: 'center' });
      
      const lineTotal = (item.quantity * item.rate * (1 + (item.gstPercent / 100)));
      doc.text(lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 184, startY + 5.5, { align: 'center' });
    });

    // Subtotal, GST tax, Total block
    startY += 18;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);

    const invoiceSubtotal = invoice.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const invoiceGst = invoice.items.reduce((acc, item) => acc + (item.quantity * item.rate * (item.gstPercent / 100)), 0);

    doc.text('Subtotal:', 140, startY);
    doc.text(invoiceSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 194, startY, { align: 'right' });

    doc.text('GST Tax Total:', 140, startY + 6);
    doc.text(invoiceGst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 194, startY + 6, { align: 'right' });

    // Grand total highlights
    startY += 14;
    doc.setFillColor(241, 245, 249); // light blue/grey bar for grand total
    doc.rect(136, startY - 5, 60, 8, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Grand Total:', 140, startY);
    doc.setTextColor(99, 102, 241);
    doc.text(`INR ${(invoice.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 194, startY, { align: 'right' });

    // Notes
    if (invoice.notes) {
      startY += 18;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Invoice Notes & Instructions:', 14, startY);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(invoice.notes, 14, startY + 5);
    }

    // Professional footer signature & thank you message
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for your business! This is a system-generated computer Tax Invoice.', 105, 285, { align: 'center' });

    doc.save(`Codeitz_Invoice_${invoice.invoiceNumber}.pdf`);
    toast.success('Premium Invoice PDF downloaded!');
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Invoices & Billing Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">Manage B2B invoices, show dynamic UPI QR codes, and trigger client-side Razorpay checkouts</p>
        </div>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start transition-colors"
        >
          {showBuilder ? 'Dismiss Form' : 'New Client Invoice'}
        </button>
      </div>

      {/* Invoice Form Builder */}
      {showBuilder && (
        <form onSubmit={handleBuildInvoice} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-6 animate-enter">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Client/Company Name</label>
              <input
                type="text"
                placeholder="Solar Systems Inc"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Client Email</label>
              <input
                type="email"
                placeholder="accounts@solarsys.com"
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
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Template Layout</label>
              <select
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="Classic">Classic Corporate</option>
                <option value="Modern">Modern Glowing</option>
                <option value="Minimal">Minimal Slate</option>
              </select>
            </div>
          </div>

          {/* Line item list */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Invoice Items List</span>
            
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-end p-3 rounded-xl bg-slate-950/60 border border-slate-850 animate-enter">
                  <div className="col-span-12 sm:col-span-5">
                    <label className="text-[9px] font-bold text-slate-500 block mb-1">Description</label>
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
                  <div className="col-span-4 sm:col-span-2">
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
                  <div className="col-span-2 sm:col-span-1 text-center">
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
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800/40 flex justify-between items-center">
            <div className="space-y-1 text-xs text-slate-400 font-semibold">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wide">Template Layout: {templateName}</span>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider font-outfit"
            >
              Generate B2B Invoice
            </button>
          </div>

        </form>
      )}

      {/* Invoice Registry List */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col shadow-sm">
        <span className="text-xs font-bold text-slate-400 mb-4 block uppercase tracking-wide">Invoice Ledger Registry</span>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-bold">Invoice ID</th>
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
                    Loading invoices list...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-semibold">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="border-b border-slate-800/30 hover:bg-slate-900/10 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{inv.clientName}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-300">₹{(inv.total || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(inv.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        inv.paymentStatus === 'Paid'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenCheckout(inv)}
                          title="Checkout Details"
                          className="p-1.5 rounded bg-slate-950 text-indigo-400 border border-slate-800/60 hover:text-white transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => downloadInvoicePDF(inv)}
                          title="Download Tax Invoice PDF"
                          className="p-1.5 rounded bg-slate-950 text-indigo-400 border border-slate-800/60 hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv._id)}
                          title="Delete Invoice"
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

      {/* Payment checkout Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative animate-enter text-slate-200">
            
            <div className="flex justify-between items-start pb-4 border-b border-slate-800/60 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-outfit">Settle B2B Bill</h3>
                <span className="text-[10px] text-slate-500">Invoice: {selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadInvoicePDF(selectedInvoice)}
                  className="text-xs text-indigo-400 hover:text-white px-2 py-0.5 rounded bg-slate-950 border border-slate-850 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-xs text-slate-500 hover:text-white px-2 py-0.5 rounded bg-slate-950"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <div className="space-y-6 text-center">
              
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold mb-1">Due Amount</span>
                <span className="text-2xl font-bold text-white font-outfit">₹{selectedInvoice.total?.toLocaleString()}</span>
              </div>

              {selectedInvoice.paymentStatus === 'Unpaid' ? (
                <>
                  {/* UPI QR Code */}
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">UPI Instant Pay QR Code</span>
                    <div className="p-3 bg-white rounded-2xl border border-slate-200">
                      <img src={selectedInvoice.qrUrl} alt="UPI QR" className="w-40 h-40 object-contain" />
                    </div>
                    <span className="text-[9px] text-slate-500 block">Scan using any UPI app (GPay, PhonePe, Paytm) to clear ledger</span>
                  </div>

                  <div className="text-slate-500 text-xs">or</div>

                  {/* Razorpay Button */}
                  <button
                    onClick={() => launchRazorpayPayment(selectedInvoice)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 uppercase tracking-wider font-outfit"
                  >
                    <CreditCard className="w-4 h-4" /> Pay with Razorpay Gateway
                  </button>
                </>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">Payment Succeeded!</span>
                  <p className="text-xs text-slate-500">Transaction ID: {selectedInvoice.razorpayPaymentId}</p>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Invoices;
