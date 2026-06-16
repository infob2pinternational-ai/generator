import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { 
  type BusinessDocument, type Company, type Letterhead, 
  type DocumentTemplate, type UserRole, type PaymentStatus 
} from '../types';
import { 
  ArrowLeft, Printer, Download, Mail, Share2, 
  RefreshCw, Check, Star, Landmark, ShieldCheck, 
  Copy, Edit2, ArrowRightLeft, Eye 
} from 'lucide-react';

interface DocumentViewerProps {
  documentId: string;
  userRole: UserRole;
  onBack: () => void;
  onEdit: (docId: string) => void;
  onNavigate: (tab: string, view?: 'list' | 'create' | 'view', docId?: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  documentId, userRole, onBack, onEdit, onNavigate 
}) => {
  const [doc, setDoc] = useState<BusinessDocument | undefined>(db.getDocumentById(documentId));
  const [companies] = useState<Company[]>(db.getCompanies());
  const [templates] = useState<DocumentTemplate[]>(db.getTemplates());
  const [letterheads] = useState<Letterhead[]>(db.getLetterheads());


  // Email simulator state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Selected configurations
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedLetterheadId, setSelectedLetterheadId] = useState('');

  const canManage = userRole === 'admin' || (userRole === 'staff' && doc?.createdBy === 'staff');
  const isAccountant = userRole === 'accountant';

  useEffect(() => {
    if (doc) {
      // Find default template
      const defTemp = templates.find(t => t.companyId === doc.companyId && t.isDefault) || 
                      templates.find(t => t.isDefault) || 
                      templates[0];
      setSelectedTemplateId(defTemp?.id || '');

      // Find default letterhead
      const defLh = letterheads.find(l => l.companyId === doc.companyId) || letterheads[0];
      setSelectedLetterheadId(defLh?.id || '');

      // Pre-fill email simulator fields
      setEmailAddress(doc.customerDetails.email);
      setEmailSubject(`${doc.docType.toUpperCase().replace('_', ' ')} ${doc.docNumber} from ${companies.find(c => c.id === doc.companyId)?.name}`);
      setEmailBody(`Dear Customer,\n\nPlease find attached the ${doc.docType.replace('_', ' ')} ${doc.docNumber} totaling ${formatCurrency(doc.grandTotal)}.\n\nThank you for your business.`);
    }
  }, [doc]);

  if (!doc) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
        Document not found.
        <button onClick={onBack} className="block mx-auto mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back</button>
      </div>
    );
  }

  const activeCompany = companies.find(c => c.id === doc.companyId) || companies[0] || {} as Company;
  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0] || { 
    id: '', name: '', companyId: 'all', theme: 'modern', primaryColor: '#2563eb', fontFamily: 'Inter',
    logoPosition: 'left', showHeader: true, showFooter: true, showWatermark: false, watermarkText: '',
    showBankDetails: true, showSignatureArea: true, showSealArea: true, tableStyle: 'striped', isDefault: true
  } as DocumentTemplate;
  const activeLetterhead = letterheads.find(l => l.id === selectedLetterheadId) || letterheads[0] || {
    id: '', name: '', companyId: '', showHeader: true, showFooter: true, showWatermark: false
  } as Letterhead;

  // Helper formats
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  // Convert Document Actions
  const handleConvertToInvoice = () => {
    if (isAccountant) return;
    const confirmMsg = doc.docType === 'quotation' 
      ? 'Convert this Quotation to a Tax Invoice?' 
      : 'Convert this Job Order to a Standard Invoice?';

    if (window.confirm(confirmMsg)) {
      const isTax = doc.docType === 'quotation';
      const newInvoiceId = `doc-${Date.now()}`;
      
      const newInvoice: BusinessDocument = {
        ...doc,
        id: newInvoiceId,
        docType: isTax ? 'tax_invoice' : 'invoice',
        docNumber: 'AUTO', // Will generate next incremental key in db
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentTerms: 'Net 30',
        paymentStatus: 'unpaid',
        amountPaid: 0,
        createdBy: userRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Remove job order properties if converting from it
      if (doc.docType === 'job_order') {
        delete newInvoice.projectName;
        delete newInvoice.assignedStaff;
        delete newInvoice.startDate;
        delete newInvoice.endDate;
      }

      db.saveDocument(newInvoice);

      // Link quotation reference
      const updatedDoc = { ...doc };
      if (doc.docType === 'quotation') {
        updatedDoc.convertedToInvoiceId = newInvoiceId;
        db.saveDocument(updatedDoc);
      } else if (doc.docType === 'job_order') {
        updatedDoc.convertedToInvoice = true;
        updatedDoc.jobStatus = 'completed';
        db.saveDocument(updatedDoc);
      }
      setDoc(updatedDoc);

      alert('Document converted successfully! Opening new Invoice.');
      onNavigate('documents', 'view', newInvoiceId);
    }
  };

  // Duplicate Document
  const handleDuplicate = () => {
    if (isAccountant) return;
    if (window.confirm('Duplicate this document? This will generate a new number series.')) {
      const newDoc: BusinessDocument = {
        ...doc,
        id: `doc-${Date.now()}`,
        docNumber: 'AUTO',
        date: new Date().toISOString().split('T')[0],
        createdBy: userRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      db.saveDocument(newDoc);
      alert('Document duplicated successfully! Opening new duplicate.');
      onNavigate('documents', 'view', newDoc.id);
    }
  };

  // Update Payment Status (Accountant / Admin)
  const handlePaymentStatusChange = (status: PaymentStatus) => {
    const updated = { ...doc, paymentStatus: status };
    if (status === 'paid') {
      updated.amountPaid = doc.grandTotal;
    } else if (status === 'unpaid') {
      updated.amountPaid = 0;
    }
    db.saveDocument(updated);
    setDoc(updated);
  };

  // Trigger browser print dialog
  const handlePrint = () => {
    window.print();
  };

  // Inject html2pdf dynamically from CDN to handle download without package errors
  const handleDownloadPDF = () => {
    const element = document.getElementById('a4-document-preview-pane');
    if (!element) return;

    const opt = {
      margin:       10,
      filename:     `${doc.docType}-${doc.docNumber}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Dynamically script tag html2pdf.js if missing
    if (!(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        (window as any).html2pdf().from(element).set(opt).save();
      };
      document.body.appendChild(script);
    } else {
      (window as any).html2pdf().from(element).set(opt).save();
    }
  };

  // Share via WhatsApp click link
  const handleWhatsAppShare = () => {
    const text = `Hello *${doc.customerName}*,\n\nHere are the details for *${doc.docType.toUpperCase().replace('_', ' ')} ${doc.docNumber}*:\n*Total Amount:* ${formatCurrency(doc.grandTotal)}\n*Date:* ${doc.date}\n\nThank you for your business!`;
    const encoded = encodeURIComponent(text);
    // Strip spaces/dashes/parens but preserve digits and leading +
    const rawPhone = doc.customerDetails.phone || '';
    const cleaned = rawPhone.replace(/[^\d+]/g, '');
    // Ensure country code — assume India (+91) if not present
    let phoneWithCC: string;
    if (cleaned.startsWith('+')) {
      phoneWithCC = cleaned.slice(1); // remove + for wa.me URL
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      phoneWithCC = cleaned;
    } else {
      phoneWithCC = '91' + cleaned.replace(/^0/, '');
    }
    const link = `https://api.whatsapp.com/send?phone=${phoneWithCC}&text=${encoded}`;
    window.open(link, '_blank');
  };

  // Send Simulated Email
  const triggerSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus('sending');
    setTimeout(() => {
      setEmailStatus('sent');
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailStatus('idle');
      }, 1500);
    }, 1200);
  };

  // Theme details
  const themeFontClass = activeTemplate.fontFamily === 'Outfit' ? 'font-outfit' : 'font-inter';
  const showLhHeader = activeLetterhead.showHeader && activeTemplate.showHeader;
  const showLhFooter = activeLetterhead.showFooter && activeTemplate.showFooter;
  const showLhWatermark = activeLetterhead.showWatermark && activeTemplate.showWatermark;

  return (
    <div className="space-y-6">
      
      {/* Action Control Panel */}
      <div className="glass-card p-6 border border-white/20 dark:border-slate-800 shadow-xl flex flex-col xl:flex-row xl:items-center xl:justify-between space-y-4 xl:space-y-0 no-print">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-655 dark:hover:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-xl transition-all"
            title="Back to List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-left">
            <h2 className="text-xl md:text-2xl font-display font-bold text-slate-850 dark:text-white">
              {doc.docNumber} Viewer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-450">
              Assigned Company: <span className="font-semibold">{activeCompany.name}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Edit */}
          {canManage && (
            <button
              onClick={() => onEdit(doc.id)}
              className="apple-btn-primary py-2 px-4 text-xs font-semibold"
            >
              <Edit2 className="w-4 h-4 mr-1.5" /> Edit Info
            </button>
          )}

          {/* Convert (Quote -> Invoice, Job Order -> Invoice) */}
          {!isAccountant && (doc.docType === 'quotation' || doc.docType === 'job_order') && (
            <button
              onClick={handleConvertToInvoice}
              disabled={doc.convertedToInvoice || !!doc.convertedToInvoiceId}
              className="apple-btn-primary py-2 px-4 text-xs font-semibold disabled:opacity-50 disabled:pointer-events-none"
            >
              <ArrowRightLeft className="w-4 h-4 mr-1.5" /> 
              {doc.docType === 'quotation' ? 'Convert to Tax Invoice' : 'Convert to Invoice'}
            </button>
          )}

          {/* Print */}
          <button
            onClick={handlePrint}
            className="apple-btn-secondary py-2 px-4 text-xs font-semibold"
          >
            <Printer className="w-4 h-4 mr-1.5" /> Print Layout
          </button>

          {/* Download */}
          <button
            onClick={handleDownloadPDF}
            className="apple-btn-secondary py-2 px-4 text-xs font-semibold"
          >
            <Download className="w-4 h-4 mr-1.5" /> PDF Copy
          </button>

          {/* Share WhatsApp */}
          <button
            onClick={handleWhatsAppShare}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-xl border border-emerald-500/20 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 mr-1.5" /> Share Details
          </button>

          {/* Email */}
          <button
            onClick={() => setShowEmailModal(true)}
            className="apple-btn-secondary py-2 px-4 text-xs font-semibold"
          >
            <Mail className="w-4 h-4 mr-1.5" /> Send Email
          </button>

          {/* Duplicate */}
          {!isAccountant && (
            <button
              onClick={handleDuplicate}
              className="apple-btn-secondary py-2 px-4 text-xs font-semibold"
              title="Duplicate this document"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Duplicate
            </button>
          )}
        </div>
      </div>

      {/* Selector layout drawers (For choosing active Template & Letterhead styles dynamically) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 no-print">
        <div className="glass-card p-5 border border-white/20 dark:border-slate-800 shadow-md flex items-center space-x-4">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 text-slate-550 dark:text-slate-400">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Selected Letterhead Design</span>
            <select
              value={selectedLetterheadId}
              onChange={e => setSelectedLetterheadId(e.target.value)}
              className="w-full bg-transparent border-none text-sm focus:outline-none dark:text-white font-semibold pt-1 cursor-pointer"
            >
              {letterheads.filter(l => l.companyId === doc.companyId).map(l => (
                <option key={l.id} value={l.id} className="dark:bg-slate-900">{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass-card p-5 border border-white/20 dark:border-slate-800 shadow-md flex items-center space-x-4">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 text-slate-550 dark:text-slate-400">
            <Star className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Selected Print Layout Template</span>
            <select
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
              className="w-full bg-transparent border-none text-sm focus:outline-none dark:text-white font-semibold pt-1 cursor-pointer"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id} className="dark:bg-slate-900">{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Portal Simulation / Quick Action banner */}
      <div className="glass-card p-4 border border-white/20 dark:border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 no-print text-sm">
        <div className="flex items-center space-x-2.5 text-slate-655 dark:text-slate-400">
          <Eye className="w-5 h-5 text-slate-400" />
          <span>Simulate Customer Share Portal:</span>
          <button 
            onClick={() => onNavigate('portal', 'view', doc.id)}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center"
          >
            Click to View Portal Link &rarr;
          </button>
        </div>

        {/* Dynamic status action overrides */}
        {doc.docType.includes('invoice') && (
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Update Status:</span>
            <div className="bg-slate-100/80 dark:bg-slate-900/85 p-1 rounded-xl flex items-center space-x-1 border border-slate-200/40 dark:border-slate-800/40">
              <button 
                onClick={() => handlePaymentStatusChange('paid')} 
                className={`px-3.5 py-1.5 text-xs rounded-lg font-bold transition-all duration-200 ${
                  doc.paymentStatus === 'paid' 
                    ? 'bg-green-500 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Paid
              </button>
              <button 
                onClick={() => handlePaymentStatusChange('unpaid')} 
                className={`px-3.5 py-1.5 text-xs rounded-lg font-bold transition-all duration-200 ${
                  doc.paymentStatus === 'unpaid' 
                    ? 'bg-red-500 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Unpaid
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RENDER VIEW: A4 printable container sheet */}
      <div className="flex justify-center w-full">
        <div 
          className={`w-full max-w-[800px] min-h-[1130px] bg-white dark:bg-slate-950 p-12 shadow-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[24px] relative watermark-container text-slate-800 dark:text-slate-200 transition-colors duration-300 ${themeFontClass}`}
          id="a4-document-preview-pane"
        >
          {/* Background Watermark */}
          {showLhWatermark && activeLetterhead.watermarkText && (
            <div className="watermark-text">
              {activeLetterhead.watermarkText}
            </div>
          )}

          <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
            
            {/* Header branding info */}
            {activeTemplate.theme === 'b2p' ? (
              activeCompany.headerImageUrl ? (
                <div className="-mx-12 -mt-12 mb-8 select-none">
                  <img src={activeCompany.headerImageUrl} className="w-full h-auto object-contain" alt="Custom Header Banner" />
                </div>
              ) : (
                <div className="relative overflow-hidden h-[150px] -mx-12 -mt-12 mb-8 select-none bg-white">
                  {/* SVG Background Geometry */}
                  <svg viewBox="0 0 800 150" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    {/* Orange right block */}
                    <path d="M480,0 H800 V150 H380 Z" fill="#f15a24" />
                    {/* Slanted orange stripe */}
                    <path d="M435,0 H455 L350,120 H330 Z" fill="#f15a24" />
                    {/* Dark blue left block & bottom bar */}
                    <path d="M0,0 H415 L330,115 H600 L585,150 H0 Z" fill="#1e3654" />
                  </svg>

                  {/* Left Content (Logo & Brand) */}
                  <div className="absolute left-8 top-4 flex items-center space-x-3 z-10">
                    {activeCompany.logoUrl ? (
                      <img src={activeCompany.logoUrl} className="h-16 object-contain bg-white rounded p-1" alt="B2P Logo" />
                    ) : (
                      <div className="flex items-center space-x-3 select-none">
                        {/* Stylized B2P Ligature Monogram */}
                        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                          <path d="M25 10V50H40C51 50 60 41 60 30C60 19 51 10 40 10H25Z" fill="#f15a24" />
                          <path d="M75 90V50H60C49 50 40 59 40 70C40 81 49 90 60 90H75Z" fill="#f15a24" />
                          <path d="M37 22H40C44.4 22 48 25.6 48 30C48 34.4 44.4 38 40 38H37V22Z" fill="#1e3654" />
                          <path d="M63 78H60C55.6 78 52 74.4 52 70C52 65.6 55.6 62 60 62H63V78Z" fill="#1e3654" />
                        </svg>
                        <div className="flex flex-col leading-none">
                          <span className="text-white font-extrabold text-3xl font-display tracking-wide">B2P</span>
                          <span className="text-[#f15a24] font-bold text-xs tracking-wider mt-1 uppercase font-sans">International</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Address block inside bottom blue bar */}
                  <div className="absolute left-8 bottom-2.5 z-10">
                    <p className="text-[10.5px] text-white font-medium tracking-wide">
                      10/15 Devassy Square, Marathkam Centre, Puranattukara, Thrissur-680551
                    </p>
                  </div>

                  {/* Right Content (Document Type Title) */}
                  <div className="absolute right-8 top-0 bottom-0 flex items-center justify-end w-[35%] z-10">
                    <span className="text-white font-extrabold text-4xl tracking-widest uppercase font-display select-all">
                      {doc.docType === 'quotation' ? 'Quotation' : doc.docType === 'job_order' ? 'Job Order' : 'Invoice'}
                    </span>
                  </div>
                </div>
              )
            ) : (
              showLhHeader && (
                activeCompany.headerImageUrl ? (
                  <div className="-mx-12 -mt-12 mb-8 select-none">
                    <img src={activeCompany.headerImageUrl} className="w-full h-auto object-contain" alt="Custom Header Banner" />
                  </div>
                ) : (
                  <div 
                    className={`flex items-center justify-between pb-6 border-b-2`}
                    style={{ borderBottomColor: activeTemplate.primaryColor }}
                  >
                    <div className={`flex w-full items-center justify-between ${
                      activeTemplate.logoPosition === 'right' ? 'flex-row-reverse' : activeTemplate.logoPosition === 'center' ? 'flex-col space-y-4' : 'flex-row'
                    }`}>
                      {/* Logo */}
                      <div className="w-20 h-20 bg-slate-50 border border-slate-200/50 dark:border-slate-850 dark:bg-slate-900 rounded-xl p-1 flex items-shrink-0 items-center justify-center">
                        {activeCompany.logoUrl ? (
                          <img src={activeCompany.logoUrl} className="max-h-full max-w-full object-contain" alt="Logo" />
                        ) : (
                          <div className="text-xs font-bold text-slate-400 font-display">Apex Branded</div>
                        )}
                      </div>
                      
                      {/* Address info */}
                      <div className={`text-xs space-y-1 ${
                        activeTemplate.logoPosition === 'right' ? 'text-left' : activeTemplate.logoPosition === 'center' ? 'text-center' : 'text-right'
                      }`}>
                        <h4 className="font-bold text-sm" style={{ color: activeTemplate.primaryColor }}>{activeCompany.name}</h4>
                        <p className="max-w-xs">{activeCompany.address}</p>
                        <p>Phone: {activeCompany.phone} | Email: {activeCompany.email}</p>
                        <p className="font-mono text-[11px] font-bold mt-1 text-slate-500">
                          GSTIN: {activeCompany.gstNumber || 'N/A'} | PAN: {activeCompany.panNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )
            )}

            {/* Document details, bill to metadata */}
            {activeTemplate.theme === 'b2p' ? (
              <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-150 pb-6">
                <div>
                  <span className="text-slate-900 font-bold text-[13px] block mb-0.5">To,</span>
                  <div className="space-y-0.5 font-semibold text-slate-800 dark:text-slate-200">
                    <p className="font-extrabold text-base text-[#1e3654]">{doc.customerDetails.name}</p>
                    {doc.customerDetails.companyName && (
                      <p className="font-bold text-slate-900 text-sm">{doc.customerDetails.companyName}</p>
                    )}
                    <p className="max-w-xs text-xs text-slate-550 font-medium leading-relaxed mt-1">{doc.customerDetails.address}</p>
                    {doc.customerDetails.phone && <p className="text-xs text-slate-500 font-medium mt-1">Contact: {doc.customerDetails.phone}</p>}
                  </div>
                </div>

                <div className="text-right space-y-3 pr-4">
                  <div className="inline-block space-y-1">
                    <div className="flex items-center justify-end text-xs text-slate-500">
                      <span className="text-slate-450 font-bold w-18 text-left">Date</span>
                      <span className="text-slate-450 font-bold mr-3">:</span>
                      <span className="font-bold text-slate-900 text-sm text-right w-24">{doc.date}</span>
                    </div>
                    <div className="flex items-center justify-end text-xs text-slate-500">
                      <span className="text-slate-450 font-bold w-18 text-left">{doc.docType === 'quotation' ? 'Quot No' : 'Doc No'}</span>
                      <span className="text-slate-450 font-bold mr-3">:</span>
                      <span className="font-extrabold text-slate-900 text-sm font-mono text-right w-24">{doc.docNumber}</span>
                    </div>
                  </div>
                  {/* Service Name & Period */}
                  {(doc.projectName || doc.projectName === '') && (
                    <div className="pt-1 text-right">
                      <span className="text-slate-450 text-[11px] font-medium block">Service Name & Period</span>
                      <span className="font-extrabold text-slate-850 dark:text-white text-base block mt-0.5">{doc.projectName || 'Auto Branding'}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-100 dark:border-slate-850 pb-6">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-2">Billed To:</span>
                  <div className="space-y-1 font-medium text-slate-700 dark:text-slate-350">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{doc.customerDetails.name}</p>
                    {doc.customerDetails.companyName && (
                      <p className="font-semibold text-blue-600 dark:text-blue-400">{doc.customerDetails.companyName}</p>
                    )}
                    <p className="max-w-xs">{doc.customerDetails.address}</p>
                    <p>Contact: {doc.customerDetails.phone} | {doc.customerDetails.email}</p>
                    {doc.customerDetails.gstNumber && (
                      <p className="font-bold font-mono bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded inline-block">
                        GSTIN: {doc.customerDetails.gstNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-1.5">
                  <h3 className="text-lg font-bold uppercase tracking-widest font-display" style={{ color: activeTemplate.primaryColor }}>
                    {doc.docType.toUpperCase().replace('_', ' ')}
                  </h3>
                  <p><span className="text-slate-400 font-semibold">Document No:</span> <span className="font-bold font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">{doc.docNumber}</span></p>
                  <p><span className="text-slate-400 font-semibold">Doc Date:</span> {doc.date}</p>
                  
                  {doc.docType.includes('invoice') && doc.dueDate && (
                    <p><span className="text-slate-400 font-semibold">Payment Due:</span> <span className="font-bold text-red-650">{doc.dueDate}</span></p>
                  )}
                  {doc.docType === 'quotation' && doc.validityDate && (
                    <p><span className="text-slate-400 font-semibold">Validity Expire:</span> {doc.validityDate}</p>
                  )}


                </div>
              </div>
            )}

            {/* Job Order Info Box (Only displays for JO) */}
            {doc.docType === 'job_order' && (
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 text-xs space-y-3.5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-400 font-semibold">Project Name</span>
                    <p className="font-bold text-slate-850 dark:text-slate-200">{doc.projectName || 'General Work'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Assigned Staff</span>
                    <p className="font-bold text-slate-855 dark:text-slate-200">{doc.assignedStaff || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Start Date</span>
                    <p className="font-bold">{doc.startDate || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">End Date</span>
                    <p className="font-bold">{doc.endDate || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t border-slate-200/50 dark:border-slate-800 pt-3">
                  <span className="text-slate-400 font-semibold">Work Scope / Description</span>
                  <p className="whitespace-pre-line mt-1">{doc.workDescription || 'No description listed.'}</p>
                </div>

                {doc.materialsRequired && (
                  <div className="border-t border-slate-200/50 dark:border-slate-800 pt-3">
                    <span className="text-slate-400 font-semibold">Materials & Deliverables Required</span>
                    <p className="whitespace-pre-line mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">{doc.materialsRequired}</p>
                  </div>
                )}
              </div>
            )}

            {/* Items Table */}
            <div className="flex-1">
              {activeTemplate.theme === 'b2p' ? (
                <table className="w-full text-left text-xs border-collapse border-2 border-[#1e3654]">
                  <thead>
                    <tr className="border-b border-[#1e3654] text-slate-700 font-bold text-[12px] bg-white h-10">
                      <th className="p-2 w-12 text-center border-r border-[#1e3654]">No</th>
                      <th className="p-2 border-r border-[#1e3654] pl-3">Particulars</th>
                      <th className="p-2 text-center w-16 border-r border-[#1e3654]">Qty</th>
                      <th className="p-2 text-center w-16 border-r border-[#1e3654]">Days</th>
                      <th className="p-2 text-center w-24 border-r border-[#1e3654]">Rate</th>
                      <th className="p-2 text-center w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.items.map((item, index) => (
                      <tr key={item.id} className="text-slate-800 dark:text-slate-200 h-12">
                        <td className="p-2 text-center border-r border-[#1e3654] font-medium">{index + 1}</td>
                        <td className="p-2 border-r border-[#1e3654] pl-3 font-medium">
                          <div className="font-extrabold text-slate-850 dark:text-white text-sm">{item.name}</div>
                          {item.description && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5">{item.description}</div>
                          )}
                        </td>
                        <td className="p-2 text-center border-r border-[#1e3654] font-medium">{item.quantity}</td>
                        <td className="p-2 text-center border-r border-[#1e3654] font-medium">
                          {item.days !== undefined && item.days !== null && Number(item.days) > 0 ? item.days : '-'}
                        </td>
                        <td className="p-2 text-center border-r border-[#1e3654] font-mono font-medium">
                          {item.rate.toFixed(2)}
                        </td>
                        <td className="p-2 text-center font-mono font-extrabold">
                          {item.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {/* Render empty rows to stretch the grid and draw vertical borders */}
                    {Array.from({ length: Math.max(0, 10 - doc.items.length) }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="h-12">
                        <td className="border-r border-[#1e3654]">&nbsp;</td>
                        <td className="border-r border-[#1e3654]">&nbsp;</td>
                        <td className="border-r border-[#1e3654]">&nbsp;</td>
                        <td className="border-r border-[#1e3654]">&nbsp;</td>
                        <td className="border-r border-[#1e3654]">&nbsp;</td>
                        <td>&nbsp;</td>
                      </tr>
                    ))}
                    {/* Totals row inside table directly, like the template */}
                    <tr className="border-t-2 border-[#1e3654] font-bold bg-white h-11">
                      <td className="border-r border-[#1e3654]">&nbsp;</td>
                      <td className="p-2 text-center font-extrabold uppercase tracking-wider text-[#1e3654] border-r border-[#1e3654]">Total</td>
                      <td className="border-r border-[#1e3654]">&nbsp;</td>
                      <td className="border-r border-[#1e3654]">&nbsp;</td>
                      <td className="border-r border-[#1e3654]">&nbsp;</td>
                      <td className="p-2 text-center font-mono font-extrabold text-[#1e3654] text-sm">
                        {doc.grandTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr 
                      className="text-white font-bold"
                      style={{ backgroundColor: activeTemplate.primaryColor }}
                    >
                      <th className="p-3 rounded-l">Item Description</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Rate</th>
                      <th className="p-3 text-right">Discount</th>
                      {doc.docType === 'tax_invoice' && <th className="p-3 text-right">GST %</th>}
                      <th className="p-3 text-right rounded-r">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {doc.items.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className={
                          activeTemplate.tableStyle === 'striped' && index % 2 === 0 
                            ? 'bg-slate-50 dark:bg-slate-900/40' 
                            : activeTemplate.tableStyle === 'grid' 
                            ? 'border-b border-slate-200 dark:border-slate-800'
                            : ''
                        }
                      >
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                          {item.description && (
                            <div className="text-[10px] text-slate-450 italic mt-0.5">{item.description}</div>
                          )}
                        </td>
                        <td className="p-3 text-right font-medium">{item.quantity} {item.unit}</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(item.rate)}</td>
                        <td className="p-3 text-right text-green-650 font-mono">
                          {item.discountPercentage > 0 ? `${item.discountPercentage}%` : '-'}
                        </td>
                        {doc.docType === 'tax_invoice' && (
                          <td className="p-3 text-right font-semibold font-mono">{item.gstPercentage}%</td>
                        )}
                        <td className="p-3 text-right font-bold font-mono">
                          {formatCurrency(item.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Tax Breakdown table for GST Tax Invoices */}
            {doc.docType === 'tax_invoice' && doc.taxTotal > 0 && (
              <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">GST Tax Apportionment Details</span>
                <table className="w-full text-[10px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-1 text-right">Taxable Value</th>
                      {activeCompany.gstNumber.substr(0, 2) === doc.customerDetails.gstNumber?.substr(0, 2) ? (
                        <>
                          <th className="py-1 text-right">CGST %</th>
                          <th className="py-1 text-right">CGST Amt</th>
                          <th className="py-1 text-right">SGST %</th>
                          <th className="py-1 text-right">SGST Amt</th>
                        </>
                      ) : (
                        <>
                          <th className="py-1 text-right">IGST %</th>
                          <th className="py-1 text-right">IGST Amt</th>
                        </>
                      )}
                      <th className="py-1 text-right">Total GST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono">
                    {doc.items.filter(item => (item.gstPercentage || 0) > 0).map(item => {
                      const baseVal = (item.quantity * item.rate) * (1 - item.discountPercentage / 100);
                      const totalGst = item.cgstAmount + item.sgstAmount + item.igstAmount;
                      
                      return (
                        <tr key={item.id} className="text-slate-600 dark:text-slate-400">
                          <td className="py-1.5 text-right">{formatCurrency(baseVal)}</td>
                          {activeCompany.gstNumber.substr(0, 2) === doc.customerDetails.gstNumber?.substr(0, 2) ? (
                            <>
                              <td className="py-1.5 text-right">{item.cgstRate}%</td>
                              <td className="py-1.5 text-right">{formatCurrency(item.cgstAmount)}</td>
                              <td className="py-1.5 text-right">{item.sgstRate}%</td>
                              <td className="py-1.5 text-right">{formatCurrency(item.sgstAmount)}</td>
                            </>
                          ) : (
                            <>
                              <td className="py-1.5 text-right">{item.igstRate}%</td>
                              <td className="py-1.5 text-right">{formatCurrency(item.igstAmount)}</td>
                            </>
                          )}
                          <td className="py-1.5 text-right font-bold text-slate-800 dark:text-slate-300">
                            {formatCurrency(totalGst)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Remittance, Totals Breakdown and T&C block */}
            {activeTemplate.theme === 'b2p' ? (
              <div className="grid grid-cols-12 gap-6 pt-4 items-end text-xs">
                {/* Bank accounts on left */}
                <div className="col-span-7">
                  {activeCompany.bankDetails.bankName && (
                    <div className="border border-[#1e3654] p-4 rounded-none space-y-1 text-[#1e3654] bg-white max-w-sm">
                      <div className="font-bold text-xs flex"><span className="w-24 flex justify-between"><span>Account No</span><span>:</span></span> <span className="font-extrabold ml-1 font-mono text-sm">{activeCompany.bankDetails.accountNumber}</span></div>
                      <div className="font-bold text-xs flex"><span className="w-24 flex justify-between"><span>Acc Name</span><span>:</span></span> <span className="font-extrabold ml-1 text-sm">{activeCompany.bankDetails.accountName}</span></div>
                      <div className="font-bold text-xs flex"><span className="w-24 flex justify-between"><span>IFSC</span><span>:</span></span> <span className="font-extrabold ml-1 font-mono text-sm">{activeCompany.bankDetails.ifscCode}</span></div>
                      <div className="font-bold text-xs flex"><span className="w-24 flex justify-between"><span>Bank Details</span><span>:</span></span> <span className="font-extrabold ml-1 text-sm">{activeCompany.bankDetails.bankName}</span></div>
                      <div className="font-extrabold text-xs pl-25 tracking-wide">{activeCompany.bankDetails.branchName}</div>
                    </div>
                  )}
                </div>

                {/* Signature/Seal on right */}
                <div className="col-span-5 flex flex-col items-center justify-end text-center space-y-1 pb-2">
                  {activeCompany.companySealUrl ? (
                    <div className="w-24 h-24 overflow-hidden flex items-center justify-center p-1 bg-white rounded-full">
                      <img src={activeCompany.companySealUrl} className="max-h-full max-w-full object-contain" alt="Seal stamp" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 overflow-hidden flex items-center justify-center p-1 bg-white rounded-full">
                      {/* Realistic Stamp Monogram SVG */}
                      <svg width="80" height="80" viewBox="0 0 100 100" className="opacity-80">
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#1e3654" strokeWidth="2.5" strokeDasharray="3 3" />
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#1e3654" strokeWidth="1.2" />
                        <path d="M 18 50 A 32 32 0 0 1 82 50" id="stamp-path-b2p" fill="none" />
                        <text fill="#1e3654" fontSize="7" fontWeight="bold" letterSpacing="1" className="font-sans">
                          <textPath href="#stamp-path-b2p" startOffset="50%" textAnchor="middle">
                            B2P INTERNATIONAL
                          </textPath>
                        </text>
                        <text x="50" y="55" fill="#1e3654" fontSize="8" fontWeight="bold" textAnchor="middle" className="font-sans">THRISSUR</text>
                      </svg>
                    </div>
                  )}
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">
                    For {activeCompany.name}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-6 pt-4 border-t border-slate-150 dark:border-slate-850 text-xs">
                {/* Bank accounts on left */}
                <div className="col-span-7 space-y-4">
                  {activeTemplate.showBankDetails && doc.docType.includes('invoice') && activeCompany.bankDetails.bankName && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-0.5 text-[10px] text-slate-500 max-w-sm">
                      <p className="font-bold text-slate-700 dark:text-slate-350 flex items-center">
                        <Landmark className="w-3.5 h-3.5 mr-1" /> BANK SETTLEMENT REMITTANCE DETAILS
                      </p>
                      <p><span className="text-slate-400">Account Name:</span> {activeCompany.bankDetails.accountName}</p>
                      <p><span className="text-slate-400">Bank Name:</span> {activeCompany.bankDetails.bankName}</p>
                      <p><span className="text-slate-400">Account Number:</span> <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{activeCompany.bankDetails.accountNumber}</span></p>
                      <p><span className="text-slate-400">Bank IFSC Code:</span> <span className="font-mono text-slate-700 dark:text-slate-300">{activeCompany.bankDetails.ifscCode}</span> | <span className="text-slate-400">Branch:</span> {activeCompany.bankDetails.branchName}</p>
                    </div>
                  )}

                  {doc.termsAndConditions && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Terms & Conditions</span>
                      <p className="whitespace-pre-line mt-1 text-[10px] text-slate-500 max-w-md">{doc.termsAndConditions}</p>
                    </div>
                  )}
                </div>

                {/* Invoicing calculations on right */}
                <div className="col-span-5 text-right font-medium space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Items Gross Total:</span>
                    <span className="font-mono">{formatCurrency(doc.subTotal)}</span>
                  </div>
                  {doc.discountTotal > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span className="text-slate-400">Discount Applied:</span>
                      <span className="font-mono">-{formatCurrency(doc.discountTotal)}</span>
                    </div>
                  )}
                  {doc.taxTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Taxes Sub Total:</span>
                      <span className="font-mono">{formatCurrency(doc.taxTotal)}</span>
                    </div>
                  )}

                  <div 
                    className="flex justify-between text-sm font-bold border-t border-slate-200 dark:border-slate-800 pt-2 text-slate-900 dark:text-white"
                  >
                    <span>Grand Net Total:</span>
                    <span className="font-mono text-base font-extrabold" style={{ color: activeTemplate.primaryColor }}>
                      {formatCurrency(doc.grandTotal)}
                    </span>
                  </div>

                  {doc.docType.includes('invoice') && doc.paymentStatus !== 'paid' && (
                    <div className="flex justify-between text-[11px] font-bold text-red-650 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded">
                      <span>Outstanding Balance:</span>
                      <span className="font-mono">{formatCurrency(doc.grandTotal - (doc.amountPaid || 0))}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Signature & Seal line stamp */}
            {activeTemplate.theme !== 'b2p' && (
              <div className="flex justify-between items-end pt-8 text-xs">
                {activeTemplate.showSealArea && activeCompany.companySealUrl ? (
                  <div className="w-24 h-24 p-1 border rounded-full overflow-hidden flex items-center justify-center bg-white">
                    <img src={activeCompany.companySealUrl} className="max-h-full max-w-full object-contain" alt="Seal stamp" />
                  </div>
                ) : activeTemplate.showSealArea ? (
                  <div className="w-24 h-24 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-[8px] text-slate-400 rounded-full">
                    [ COMPANY SEAL ]
                  </div>
                ) : <div />}
                
                {activeTemplate.showSignatureArea ? (
                  <div className="text-center space-y-2">
                    <div className="w-36 h-12 flex items-center justify-center overflow-hidden">
                      {activeCompany.authorizedSignatureUrl ? (
                        <img src={activeCompany.authorizedSignatureUrl} className="max-h-full object-contain" alt="Signature" />
                      ) : (
                        <div className="text-[10px] text-slate-300 italic">Electronic Sign Off</div>
                      )}
                    </div>
                    <div className="w-36 border-b border-slate-400" />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Authorized Signatory</p>
                  </div>
                ) : <div />}
              </div>
            )}

            {/* Footer page identifier */}
            {activeTemplate.theme === 'b2p' ? (
              activeCompany.footerImageUrl ? (
                <div className="-mx-12 -mb-12 mt-8 select-none">
                  <img src={activeCompany.footerImageUrl} className="w-full h-auto object-contain" alt="Custom Footer Banner" />
                </div>
              ) : (
                <div className="flex relative overflow-hidden h-[65px] text-white -mx-12 -mb-12 mt-8 text-[11px] font-semibold select-none bg-white">
                  {/* SVG Background shapes */}
                  <svg viewBox="0 0 800 65" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    {/* Left blue slanted block */}
                    <path d="M0,0 H390 L375,65 H0 Z" fill="#1e3654" />
                    {/* Right orange slanted block */}
                    <path d="M410,0 H800 V65 H395 Z" fill="#f15a24" />
                  </svg>

                  {/* Left blue block content */}
                  <div className="absolute left-8 top-0 bottom-0 w-[45%] flex flex-col justify-center space-y-1 z-10">
                    <div className="flex items-center space-x-2">
                      {/* FB & IG icons */}
                      <div className="flex items-center space-x-1.5">
                        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                      </div>
                      <span className="text-white font-sans text-xs">/b2p international</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Globe icon */}
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                      <span className="text-white font-sans text-xs tracking-wide">w w w.b2pinternational.com</span>
                    </div>
                  </div>

                  {/* Right orange block content */}
                  <div className="absolute left-[53%] right-4 top-0 bottom-0 flex flex-col justify-center space-y-1 z-10">
                    <div className="flex items-center space-x-2">
                      {/* Phone icon */}
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      <span className="text-white font-sans text-xs">+91 8589 9090 34 | +91 8139 0090 34</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Envelope icon */}
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      <span className="text-white font-sans text-xs">info@b2pinternational.com</span>
                    </div>
                  </div>
                </div>
              )
            ) : (
              showLhFooter && (
                activeCompany.footerImageUrl ? (
                  <div className="-mx-12 -mb-12 mt-8 select-none">
                    <img src={activeCompany.footerImageUrl} className="w-full h-auto object-contain" alt="Custom Footer Banner" />
                  </div>
                ) : (
                  <div className="border-t border-slate-150 dark:border-slate-800 pt-3 text-center text-[9px] text-slate-400 font-medium">
                    Page 1 of 1 &bull; {activeCompany.website} &bull; Email: {activeCompany.email} &bull; Powered by BDM Pro
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>

      {/* Simulated Email Modal Overlay */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-955/45 backdrop-blur-md flex items-center justify-center p-4 z-50 no-print">
          <div className="glass-card w-full max-w-lg border border-white/20 dark:border-slate-800/80 shadow-2xl overflow-hidden font-sans">
            <form onSubmit={triggerSendEmail}>
              <div className="p-6 border-b border-slate-200/40 dark:border-slate-800/40">
                <h3 className="text-lg font-bold text-slate-850 dark:text-white">Simulated Email Dispatcher</h3>
                <p className="text-xs text-slate-455 dark:text-slate-500">BDM Pro Mailer Engine</p>
              </div>

              <div className="p-6 space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase mb-2">Recipient Email Address</label>
                  <input 
                    type="email" required
                    value={emailAddress}
                    onChange={e => setEmailAddress(e.target.value)}
                    className="w-full apple-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-455 dark:text-slate-500 uppercase mb-2">Email Subject Line</label>
                  <input 
                    type="text" required
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    className="w-full apple-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-455 dark:text-slate-500 uppercase mb-2">Message Body</label>
                  <textarea rows={4} required
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    className="w-full apple-input resize-none"
                  />
                </div>

                <div className="p-3 bg-slate-50/60 dark:bg-slate-900/60 rounded-xl flex items-center space-x-2 text-xs text-slate-450 border border-slate-200/40 dark:border-slate-800/40">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  <span>The document <b>{doc.docNumber}.pdf</b> will be attached automatically.</span>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200/40 dark:border-slate-800/40 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowEmailModal(false)}
                  className="apple-btn-secondary px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={emailStatus !== 'idle'}
                  className="apple-btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50 inline-flex items-center"
                >
                  {emailStatus === 'sending' ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Dispatching...
                    </>
                  ) : emailStatus === 'sent' ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5" /> Dispatched!
                    </>
                  ) : (
                    'Dispatch Email'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
