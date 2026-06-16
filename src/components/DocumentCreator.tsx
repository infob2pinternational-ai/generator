import React, { useState, useEffect } from 'react';
import { db, generateNextDocNumber } from '../services/db';
import { 
  type Company, type Customer, type ProductService, 
  type BusinessDocument, type DocumentType, type UserRole, type PaymentStatus, type JobOrderStatus 
} from '../types';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

interface DocumentCreatorProps {
  userRole: UserRole;
  documentId: string | null; // null if creating a new one
  defaultType: DocumentType | null; // e.g. 'tax_invoice' or 'quotation'
  onBack: () => void;
  activeCompanyId: string;
}

export const DocumentCreator: React.FC<DocumentCreatorProps> = ({ 
  userRole, documentId, defaultType, onBack, activeCompanyId 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [companies] = useState<Company[]>(db.getCompanies());
  const [customers] = useState<Customer[]>(db.getCustomers());
  const [catalogProducts] = useState<ProductService[]>(db.getProducts());

  const [companyId, setCompanyId] = useState(activeCompanyId);
  const [docType, setDocType] = useState<DocumentType>(defaultType || 'invoice');
  const [docNumber, setDocNumber] = useState('AUTO');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [validityDate, setValidityDate] = useState('');
  const [customerId, setCustomerId] = useState('');
  
  // Job Order fields
  const [projectName, setProjectName] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [materialsRequired, setMaterialsRequired] = useState('');
  const [jobStatus, setJobStatus] = useState<JobOrderStatus>('pending');
  
  // Invoice fields
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [amountPaid, setAmountPaid] = useState(0);

  const [items, setItems] = useState<any[]>([]);
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [notes, setNotes] = useState('');
  
  // Loading an existing document for editing
  useEffect(() => {
    if (documentId) {
      const doc = db.getDocumentById(documentId);
      if (doc) {
        setCompanyId(doc.companyId);
        setDocType(doc.docType);
        setDocNumber(doc.docNumber);
        setDate(doc.date);
        setCustomerId(doc.customerId);
        setItems(doc.items);
        setTermsAndConditions(doc.termsAndConditions || '');
        setNotes(doc.notes || '');

        if (doc.docType.includes('invoice')) {
          setDueDate(doc.dueDate || '');
          setPaymentTerms(doc.paymentTerms || 'Net 30');
          setPaymentStatus(doc.paymentStatus || 'unpaid');
          setAmountPaid(doc.amountPaid || 0);
        } else if (doc.docType === 'quotation') {
          setValidityDate(doc.validityDate || '');
        } else if (doc.docType === 'job_order') {
          setProjectName(doc.projectName || '');
          setWorkDescription(doc.workDescription || '');
          setStartDate(doc.startDate || '');
          setEndDate(doc.endDate || '');
          setAssignedStaff(doc.assignedStaff || '');
          setMaterialsRequired(doc.materialsRequired || '');
          setJobStatus(doc.jobStatus || 'pending');
        }
      }
    } else {
      // New document default item row
      setItems([{ id: `item-0-${Date.now()}`, name: '', description: '', unit: 'Pcs', hsnCode: '', quantity: 1, rate: 0, discountPercentage: 0, gstPercentage: 18 }]);
      
      // Auto-populate invoice due dates
      const today = new Date();
      today.setDate(today.getDate() + 30);
      setDueDate(today.toISOString().split('T')[0]);
      
      // Auto-populate quote validity
      const quoteVal = new Date();
      quoteVal.setDate(quoteVal.getDate() + 15);
      setValidityDate(quoteVal.toISOString().split('T')[0]);
    }
  }, [documentId]);

  // Update document number series preview when company or docType changes
  useEffect(() => {
    if (!documentId) {
      const nextNum = generateNextDocNumber(companyId, docType as DocumentType);
      setDocNumber(`AUTO (${nextNum})`);
    }
  }, [companyId, docType, documentId]);

  // Handle Customer Selection
  const handleCustomerChange = (cid: string) => {
    setCustomerId(cid);
    // Autofill notes if any
    const cust = customers.find(c => c.id === cid);
    if (cust && cust.notes) {
      setNotes(prev => prev ? prev + '\n' + cust.notes : cust.notes || '');
    }
  };

  // Add item row
  const addItemRow = () => {
    setItems([
      ...items,
      { id: `item-${items.length}-${Date.now()}`, name: '', description: '', unit: 'Pcs', hsnCode: '', quantity: 1, rate: 0, discountPercentage: 0, gstPercentage: 18 }
    ]);
  };

  // Delete item row
  const deleteItemRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  // Update item field value
  const updateItemRow = (idx: number, field: string, value: any) => {
    const list = [...items];
    list[idx][field] = value;
    setItems(list);
  };

  // Auto-fill details when product catalog item is selected
  const handleProductSelect = (idx: number, pid: string) => {
    const prod = catalogProducts.find(p => p.id === pid);
    if (prod) {
      const list = [...items];
      list[idx] = {
        ...list[idx],
        productId: prod.id,
        name: prod.name,
        description: prod.description || '',
        unit: prod.unit,
        hsnCode: prod.hsnCode,
        rate: prod.sellingPrice,
        gstPercentage: prod.gstPercentage
      };
      setItems(list);
    }
  };

  // Core Math Calculations
  const company = companies.find(c => c.id === companyId) || companies[0];
  const customer = customers.find(c => c.id === customerId);

  // Guard: if no companies exist yet, show an empty state instead of crashing
  if (!company) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Company Found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Please add a company in Settings before creating a document.
        </p>
        <button onClick={onBack} className="apple-btn-primary">Go Back</button>
      </div>
    );
  }

  const companyState = company.gstNumber ? company.gstNumber.substr(0, 2) : '09';
  const customerState = customer?.gstNumber ? customer.gstNumber.substr(0, 2) : companyState;
  
  // Only tax_invoice gets GST calculations; quotation and standard invoice do not split CGST/SGST
  const isTax = docType === 'tax_invoice';
  const calculations = db.recalculateDocument(items, isTax, companyState, customerState);

  // Validate and Save Document
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert('Please select a customer.');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one item.');
      return;
    }

    const currentDocNum = documentId ? docNumber : generateNextDocNumber(companyId, docType as DocumentType);


    const docToSave: BusinessDocument = {
      id: documentId || `doc-${Date.now()}`,
      docType,
      docNumber: currentDocNum,
      date,
      companyId,
      customerId,
      customerName: customer?.name || 'Unknown Client',
      customerDetails: customer || { id: 'anon', name: 'Anonymous', address: '', phone: '', email: '', createdAt: '' },
      items: calculations.processedItems,
      subTotal: calculations.subTotal,
      discountTotal: calculations.discountTotal,
      taxTotal: calculations.taxTotal,
      cgstTotal: calculations.cgstTotal,
      sgstTotal: calculations.sgstTotal,
      igstTotal: calculations.igstTotal,
      grandTotal: calculations.grandTotal,
      termsAndConditions,
      notes,
      
      // Role metadata
      createdBy: documentId ? (db.getDocumentById(documentId)?.createdBy || userRole) : userRole,
      // Preserve original createdAt when editing; only set fresh timestamp on create
      createdAt: documentId ? (db.getDocumentById(documentId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (docType.includes('invoice')) {
      docToSave.dueDate = dueDate;
      docToSave.paymentTerms = paymentTerms;
      docToSave.paymentStatus = paymentStatus;
      docToSave.amountPaid = paymentStatus === 'paid' ? calculations.grandTotal : paymentStatus === 'unpaid' ? 0 : amountPaid;
    } else if (docType === 'quotation') {
      docToSave.validityDate = validityDate;
    } else if (docType === 'job_order') {
      docToSave.projectName = projectName;
      docToSave.workDescription = workDescription;
      docToSave.startDate = startDate;
      docToSave.endDate = endDate;
      docToSave.assignedStaff = assignedStaff;
      docToSave.materialsRequired = materialsRequired;
      docToSave.jobStatus = jobStatus;
    }

    // Role Enforcement edit checks: Staff can only edit their own
    if (documentId) {
      const original = db.getDocumentById(documentId);
      if (original && userRole === 'staff' && original.createdBy !== 'staff') {
        alert('Access Denied: Staff members can only edit documents that they created.');
        return;
      }
    }

    db.saveDocument(docToSave);
    onBack();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center glass-card p-6 border border-black/5 dark:border-white/5">
        <div className="flex items-center space-x-3">
          <button 
            type="button"
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-display font-extrabold tracking-tight text-slate-800 dark:text-white">
              {documentId ? `Edit Document: ${docNumber}` : 'Create Business Document'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fill out document items, customer records, and verify GST taxes.
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form & Wizard (Step-by-Step) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step Indicator / Apple-style Segmented Control */}
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/5">
            {[
              { num: 1, label: 'Profile' },
              { num: 2, label: 'Line Items' },
              { num: 3, label: 'T&C & Save' }
            ].map((step) => (
              <button
                key={step.num}
                type="button"
                onClick={() => setCurrentStep(step.num)}
                className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                  currentStep === step.num
                    ? 'bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Step {step.num}: {step.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* STEP 1: DOCUMENT PROFILE & META */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Base settings card */}
                <div className="glass-card p-6 border border-black/5 dark:border-white/5 space-y-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Document Type & Origin</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Doc Type Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Document Type *</label>
                      <select
                        value={docType}
                        onChange={e => setDocType(e.target.value as DocumentType)}
                        disabled={!!documentId}
                        className="apple-input w-full font-semibold"
                      >
                        <option value="tax_invoice">Tax Invoice (GST Active)</option>
                        <option value="invoice">Standard Invoice</option>
                        <option value="quotation">Quotation / Proposal</option>
                        <option value="job_order">Job / Work Order</option>
                      </select>
                    </div>

                    {/* Company Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Issuing Company *</label>
                      <select
                        value={companyId}
                        onChange={e => setCompanyId(e.target.value)}
                        disabled={!!documentId}
                        className="apple-input w-full font-semibold"
                      >
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Selection */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer / Client *</label>
                      <select
                        value={customerId}
                        onChange={e => handleCustomerChange(e.target.value)}
                        className="apple-input w-full font-semibold"
                      >
                        <option value="">-- Select Customer --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.companyName ? `(${c.companyName})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Document Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Document Date *</label>
                      <input 
                        type="date" required
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="apple-input w-full font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Doc Type Specific Fields Card */}
                {docType.includes('invoice') && (
                  <div className="glass-card p-6 border border-black/5 dark:border-white/5 space-y-5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Payment & Terms Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Terms</label>
                        <input 
                          type="text"
                          value={paymentTerms}
                          onChange={e => setPaymentTerms(e.target.value)}
                          placeholder="Net 30, COD, Due on receipt"
                          className="apple-input w-full font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Due Date</label>
                        <input 
                          type="date"
                          value={dueDate}
                          onChange={e => setDueDate(e.target.value)}
                          className="apple-input w-full font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Status</label>
                        <select
                          value={paymentStatus}
                          onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
                          className="apple-input w-full font-semibold"
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="partially_paid">Partially Paid</option>
                          <option value="paid">Fully Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </div>
                    </div>

                    {paymentStatus === 'partially_paid' && (
                      <div className="max-w-xs">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Amount Paid (INR)</label>
                        <input 
                          type="number" min="0" step="any"
                          value={amountPaid}
                          onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                          placeholder="25000"
                          className="apple-input w-full font-mono font-semibold"
                        />
                      </div>
                    )}
                  </div>
                )}

                {docType === 'quotation' && (
                  <div className="glass-card p-6 border border-black/5 dark:border-white/5 space-y-5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Quotation Expiry</h3>
                    <div className="max-w-xs">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Validity Expiry Date</label>
                      <input 
                        type="date"
                        value={validityDate}
                        onChange={e => setValidityDate(e.target.value)}
                        className="apple-input w-full font-semibold"
                      />
                    </div>
                  </div>
                )}

                {docType === 'job_order' && (
                  <div className="glass-card p-6 border border-black/5 dark:border-white/5 space-y-5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Job Execution Context</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Project Name</label>
                        <input 
                          type="text"
                          value={projectName}
                          onChange={e => setProjectName(e.target.value)}
                          placeholder="AWS Cloud Upgrade"
                          className="apple-input w-full font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Staff</label>
                        <input 
                          type="text"
                          value={assignedStaff}
                          onChange={e => setAssignedStaff(e.target.value)}
                          placeholder="Neha (DevOps)"
                          className="apple-input w-full font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Job Status</label>
                        <select
                          value={jobStatus}
                          onChange={e => setJobStatus(e.target.value as JobOrderStatus)}
                          className="apple-input w-full font-semibold"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Scheduled Start Date</label>
                        <input 
                          type="date"
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          className="apple-input w-full font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Scheduled End Date</label>
                        <input 
                          type="date"
                          value={endDate}
                          onChange={e => setEndDate(e.target.value)}
                          className="apple-input w-full font-semibold"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Work Description</label>
                        <textarea rows={3}
                          value={workDescription}
                          onChange={e => setWorkDescription(e.target.value)}
                          placeholder="Detail scope specifications..."
                          className="apple-input w-full resize-none h-24 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Materials Required</label>
                        <textarea rows={3}
                          value={materialsRequired}
                          onChange={e => setMaterialsRequired(e.target.value)}
                          placeholder="List license credentials..."
                          className="apple-input w-full resize-none h-24 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Wizard Controls */}
                <div className="flex justify-end bg-white/30 dark:bg-black/10 p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="apple-btn-primary"
                  >
                    Next: Manage Line Items
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LINE ITEMS GRID */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="glass-card p-6 border border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Document Line Items</h3>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="inline-flex items-center px-3.5 py-2 text-xs font-bold text-[#007AFF] hover:bg-[#007AFF]/10 rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Row
                    </button>
                  </div>

                  <div className="space-y-5">
                    {items.map((item, idx) => (
                      <div key={item.id} className="p-4 bg-black/[0.015] dark:bg-white/[0.015] rounded-2xl border border-black/5 dark:border-white/5 space-y-4 relative">
                        
                        {/* Selector / Base inputs row */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          {/* Product quick autofill selection */}
                          <div className="md:col-span-5">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Catalog Lookup</label>
                            <select
                              value={item.productId || ''}
                              onChange={e => handleProductSelect(idx, e.target.value)}
                              className="apple-input w-full text-xs font-semibold py-1.5 px-2.5"
                            >
                              <option value="">-- Choose Catalog Product --</option>
                              {catalogProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.sellingPrice)})</option>
                              ))}
                            </select>
                          </div>

                          {/* Manual Title Override */}
                          <div className="md:col-span-5">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Item Title / Service *</label>
                            <input 
                              type="text" required
                              value={item.name}
                              onChange={e => updateItemRow(idx, 'name', e.target.value)}
                              placeholder="Service / Product Name"
                              className="apple-input w-full text-xs py-1.5 px-2.5 font-medium"
                            />
                          </div>

                          {/* HSN Code */}
                          <div className="md:col-span-2">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">HSN/SAC</label>
                            <input 
                              type="text"
                              value={item.hsnCode}
                              onChange={e => updateItemRow(idx, 'hsnCode', e.target.value)}
                              placeholder="998311"
                              className="apple-input w-full text-xs py-1.5 px-2.5 font-mono"
                            />
                          </div>
                        </div>

                        {/* Sub row: Description, prices, quantities */}
                        <div className="grid grid-cols-2 md:grid-cols-12 gap-3 pt-1">
                          <div className="col-span-2 md:col-span-3">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Row Description</label>
                            <input 
                              type="text"
                              value={item.description || ''}
                              onChange={e => updateItemRow(idx, 'description', e.target.value)}
                              placeholder="Detail scope subtext..."
                              className="apple-input w-full text-xs py-1.5 px-2.5 font-medium"
                            />
                          </div>

                          <div className="md:col-span-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Qty</label>
                            <input 
                              type="number" min="0.01" step="any" required
                              value={item.quantity}
                              onChange={e => updateItemRow(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="apple-input w-full text-xs py-1.5 px-2.5 font-mono font-bold"
                            />
                          </div>

                          <div className="md:col-span-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Days</label>
                            <input 
                              type="number" min="1" step="1"
                              value={item.days || ''}
                              onChange={e => updateItemRow(idx, 'days', e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="-"
                              className="apple-input w-full text-xs py-1.5 px-2.5 font-mono font-bold"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rate (INR) *</label>
                            <input 
                              type="number" min="0" step="any" required
                              value={item.rate || ''}
                              onChange={e => updateItemRow(idx, 'rate', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="apple-input w-full text-xs py-1.5 px-2.5 font-mono font-bold"
                            />
                          </div>

                          <div className="md:col-span-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Disc %</label>
                            <input 
                              type="number" min="0" max="100" step="any"
                              value={item.discountPercentage}
                              onChange={e => updateItemRow(idx, 'discountPercentage', parseFloat(e.target.value) || 0)}
                              className="apple-input w-full text-xs py-1.5 px-2.5 font-mono font-bold"
                            />
                          </div>

                          <div className="md:col-span-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Unit</label>
                            <input 
                              type="text"
                              value={item.unit}
                              onChange={e => updateItemRow(idx, 'unit', e.target.value)}
                              placeholder="Pcs"
                              className="apple-input w-full text-xs py-1.5 px-2.5 font-semibold"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">GST Tax %</label>
                            <select
                              value={item.gstPercentage}
                              onChange={e => updateItemRow(idx, 'gstPercentage', parseInt(e.target.value) || 0)}
                              disabled={!isTax}
                              className="apple-input w-full text-xs py-1.5 px-2.5 font-bold"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </div>

                          {/* Delete Action button inside row */}
                          <div className="col-span-2 md:col-span-1 flex items-end justify-center">
                            <button
                              type="button"
                              onClick={() => deleteItemRow(idx)}
                              disabled={items.length === 1}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl disabled:opacity-30 transition-all mb-0.5"
                              title="Delete row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                {/* Wizard Controls */}
                <div className="flex justify-between bg-white/30 dark:bg-black/10 p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="apple-btn-secondary"
                  >
                    Back to Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="apple-btn-primary"
                  >
                    Next: Notes & Terms
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: NOTES & REVIEW */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Notes and Terms T&C Card */}
                <div className="glass-card p-6 border border-black/5 dark:border-white/5 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Remarks & Terms</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Terms & Conditions</label>
                      <textarea rows={3}
                        value={termsAndConditions}
                        onChange={e => setTermsAndConditions(e.target.value)}
                        placeholder="Payment terms, delivery schedules..."
                        className="apple-input w-full resize-none h-24 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Internal Office Notes</label>
                      <textarea rows={3}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Internal review references..."
                        className="apple-input w-full resize-none h-24 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Totals breakdown (for small screens where preview is hidden) */}
                <div className="lg:hidden glass-card p-6 border border-black/5 dark:border-white/5 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Calculations Summary</h3>
                  <div className="space-y-2 text-sm font-medium text-slate-500">
                    <div className="flex justify-between">
                      <span>Sub Total:</span>
                      <span className="font-bold text-slate-800 dark:text-white font-mono">{formatCurrency(calculations.subTotal)}</span>
                    </div>
                    {calculations.discountTotal > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Discount:</span>
                        <span className="font-bold font-mono">-{formatCurrency(calculations.discountTotal)}</span>
                      </div>
                    )}
                    {isTax && calculations.taxTotal > 0 && (
                      <div className="border-t border-dashed border-black/5 dark:border-white/5 py-2 space-y-1 my-1 text-xs">
                        {companyState === customerState ? (
                          <>
                            <div className="flex justify-between">
                              <span>CGST:</span>
                              <span className="font-mono">{formatCurrency(calculations.cgstTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>SGST:</span>
                              <span className="font-mono">{formatCurrency(calculations.sgstTotal)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between">
                            <span>IGST (Interstate):</span>
                            <span className="font-mono">{formatCurrency(calculations.igstTotal)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-slate-800 dark:text-white border-t border-black/5 dark:border-white/5 pt-2">
                      <span>Total Amount:</span>
                      <span className="text-lg text-[#007AFF] font-extrabold font-mono">{formatCurrency(calculations.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Action controls */}
                <div className="flex justify-between bg-white/30 dark:bg-black/10 p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="apple-btn-secondary"
                  >
                    Back to Line Items
                  </button>
                  <div className="flex space-x-2">
                    <button 
                      type="button" 
                      onClick={onBack}
                      className="apple-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="apple-btn-primary"
                    >
                      <Save className="w-4 h-4 mr-2" /> Save Document
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </form>
        </div>

        {/* Right Column: Sticky Live Receipt Preview (A4 styled card) */}
        <div className="sticky top-24 hidden lg:block lg:col-span-5 bg-white dark:bg-[#16161C] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-lg max-h-[82vh] overflow-y-auto font-sans relative watermark-container">
          
          {/* Watermark */}
          <div className="watermark-text font-inter">PREVIEW</div>

          {/* Letterhead Preview Header */}
          <div className="flex justify-between items-start border-b border-black/5 dark:border-white/5 pb-6">
            <div>
              {company.logoUrl ? (
                <img src={company.logoUrl} alt="Logo" className="max-h-12 max-w-[140px] object-contain mb-3" />
              ) : (
                <div className="w-10 h-10 bg-[#007AFF] text-white rounded-xl flex items-center justify-center font-bold text-lg mb-3">
                  {company.name.charAt(0)}
                </div>
              )}
              <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-tight">{company.name}</h4>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed whitespace-pre-wrap">{company.address}</p>
              {company.gstNumber && <p className="text-[9px] text-slate-400 mt-1 font-mono">GSTIN: {company.gstNumber}</p>}
            </div>
            
            <div className="text-right">
              <span className="inline-block text-[9px] bg-[#007AFF]/10 text-[#007AFF] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mb-2">
                {docType.replace('_', ' ')}
              </span>
              <h2 className="text-base font-mono font-bold text-slate-800 dark:text-white">
                {documentId ? docNumber : docNumber.replace('AUTO', 'DRAFT-XXXX')}
              </h2>
              <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
                <div>Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{date}</span></div>
                {docType.includes('invoice') && dueDate && (
                  <div>Due Date: <span className="font-semibold text-slate-700 dark:text-slate-350">{dueDate}</span></div>
                )}
                {docType === 'quotation' && validityDate && (
                  <div>Validity: <span className="font-semibold text-slate-700 dark:text-slate-350">{validityDate}</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Billing metadata */}
          <div className="grid grid-cols-2 gap-4 py-6 border-b border-black/5 dark:border-white/5 text-[10px]">
            <div>
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</span>
              {customer ? (
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 dark:text-white text-xs">{customer.name}</div>
                  {customer.companyName && <div className="font-semibold text-slate-500">{customer.companyName}</div>}
                  <div className="text-slate-400 leading-relaxed whitespace-pre-wrap">{customer.address}</div>
                  {customer.phone && <div className="text-slate-450">Ph: {customer.phone}</div>}
                  {customer.gstNumber && <div className="text-[#007AFF] font-semibold font-mono mt-0.5">GSTIN: {customer.gstNumber}</div>}
                </div>
              ) : (
                <span className="text-slate-400 italic">No Client Selected</span>
              )}
            </div>

            {docType === 'job_order' && (
              <div>
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Details</span>
                <div className="space-y-1">
                  {projectName && <div><span className="text-slate-400">Project:</span> <span className="font-semibold text-slate-700 dark:text-slate-300">{projectName}</span></div>}
                  {assignedStaff && <div><span className="text-slate-400">Assigned:</span> <span className="font-semibold text-slate-700 dark:text-slate-300">{assignedStaff}</span></div>}
                  {startDate && <div><span className="text-slate-400">Start:</span> <span className="font-semibold font-mono">{startDate}</span></div>}
                  {endDate && <div><span className="text-slate-400">End:</span> <span className="font-semibold font-mono">{endDate}</span></div>}
                </div>
              </div>
            )}

            {docType.includes('invoice') && (
              <div className="text-right">
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Status</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  paymentStatus === 'paid' ? 'bg-green-500/10 text-green-650 dark:text-green-400' :
                  paymentStatus === 'partially_paid' ? 'bg-amber-500/10 text-amber-650 dark:text-amber-400' :
                  paymentStatus === 'unpaid' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-rose-500/20 text-rose-600'
                }`}>
                  {paymentStatus}
                </span>
                {paymentStatus === 'partially_paid' && (
                  <div className="mt-2 text-[10px] text-slate-400 font-semibold font-mono">
                    Paid: {formatCurrency(amountPaid)}
                    <br />
                    Bal: {formatCurrency(calculations.grandTotal - amountPaid)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Table of items */}
          <div className="py-6 border-b border-black/5 dark:border-white/5 text-[10px]">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[8px] font-bold text-slate-400 uppercase tracking-wider border-b border-black/5 dark:border-white/5 pb-1">
                  <th className="pb-2 w-[45%]">Description</th>
                  <th className="pb-2 text-right w-[18%]">Rate</th>
                  <th className="pb-2 text-center w-[10%]">Qty</th>
                  {isTax && calculations.taxTotal > 0 && <th className="pb-2 text-center w-[12%]">GST</th>}
                  <th className="pb-2 text-right w-[15%]">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {items.map((item, idx) => {
                  const lineTotal = (item.quantity * item.rate) * (1 - (item.discountPercentage || 0)/100);
                  return (
                    <tr key={item.id} className="align-top">
                      <td className="py-3 pr-2">
                        <div className="font-bold text-slate-800 dark:text-white leading-tight">{item.name || `Item ${idx+1}`}</div>
                        {item.description && <div className="text-[9px] text-slate-400 mt-0.5 leading-normal">{item.description}</div>}
                        {item.hsnCode && <span className="text-[8px] bg-black/5 dark:bg-white/5 text-slate-450 px-1 py-0.2 rounded font-mono mt-1.5 inline-block">HSN: {item.hsnCode}</span>}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-500 dark:text-slate-400">{formatCurrency(item.rate)}</td>
                      <td className="py-3 text-center text-slate-500 dark:text-slate-400">{item.quantity} {item.unit}</td>
                      {isTax && calculations.taxTotal > 0 && (
                        <td className="py-3 text-center text-slate-500 dark:text-slate-400 font-semibold">{item.gstPercentage}%</td>
                      )}
                      <td className="py-3 text-right font-mono font-bold text-slate-800 dark:text-white">
                        {formatCurrency(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Totals layout */}
          <div className="py-6 border-b border-black/5 dark:border-white/5 grid grid-cols-12 gap-4 text-[10px]">
            <div className="col-span-6 text-slate-400 whitespace-pre-wrap leading-relaxed pr-2">
              {termsAndConditions && (
                <>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Terms & Conditions</span>
                  <div className="text-[9px] text-slate-450">{termsAndConditions}</div>
                </>
              )}
            </div>
            
            <div className="col-span-6 space-y-2 text-right text-slate-500 font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-450 font-medium">Sub Total:</span>
                <span className="font-mono text-slate-800 dark:text-white">{formatCurrency(calculations.subTotal)}</span>
              </div>
              {calculations.discountTotal > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="font-medium">Discount:</span>
                  <span className="font-mono">-{formatCurrency(calculations.discountTotal)}</span>
                </div>
              )}
              {isTax && calculations.taxTotal > 0 && (
                <div className="border-t border-dashed border-black/5 dark:border-white/5 pt-2 space-y-1.5 text-[9px] text-slate-400">
                  {companyState === customerState ? (
                    <>
                      <div className="flex justify-between">
                        <span>CGST:</span>
                        <span className="font-mono">{formatCurrency(calculations.cgstTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST:</span>
                        <span className="font-mono">{formatCurrency(calculations.sgstTotal)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span>IGST (Interstate):</span>
                      <span className="font-mono">{formatCurrency(calculations.igstTotal)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-white border-t border-black/5 dark:border-white/5 pt-2">
                <span>Grand Total:</span>
                <span className="text-sm text-[#007AFF] font-extrabold font-mono">{formatCurrency(calculations.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Letterhead Footer Banner */}
          <div className="pt-6 text-center text-[9px] text-slate-400 font-semibold select-none leading-normal">
            Thank you for your business! If you have any inquiries, contact {company.email}.
          </div>

        </div>

      </div>
    </div>
  );
};
