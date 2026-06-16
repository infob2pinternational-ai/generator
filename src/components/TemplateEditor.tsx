import React, { useState } from 'react';
import { db } from '../services/db';
import type { DocumentTemplate, Company, TemplateTheme } from '../types';
import { Palette, Layers, Copy, Star, Settings2, Eye, Plus, Sparkles } from 'lucide-react';


interface TemplateEditorProps {
  currentCompanyId: string;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ currentCompanyId }) => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>(db.getTemplates());
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(
    templates.find(t => t.companyId === currentCompanyId && t.isDefault) || 
    templates.find(t => t.isDefault) || 
    templates[0] || 
    null
  );
  
  const [companies] = useState<Company[]>(db.getCompanies());
  const activeCompany = companies.find(c => c.id === currentCompanyId) || companies[0] || {
    id: '',
    name: 'Your Company Name',
    address: '123 Business Street, City, State - 000000',
    phone: '+91 00000 00000',
    email: 'contact@yourcompany.com',
    website: 'www.yourcompany.com',
    gstNumber: '00AAAAA0000A1Z5',
    panNumber: 'AAAAA0000A',
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0000112',
      branchName: 'Main Branch',
      accountName: 'Your Company Name'
    },
    createdAt: ''
  } as Company;

  const handlePresetSelect = (theme: TemplateTheme) => {
    if (!selectedTemplate) return;
    let updates: Partial<DocumentTemplate> = { theme };
    
    if (theme === 'modern') {
      updates = {
        theme,
        primaryColor: '#2563eb', // Indigo Blue
        fontFamily: 'Outfit',
        logoPosition: 'left',
        showHeader: true,
        showFooter: true,
        showWatermark: true,
        watermarkText: 'OFFICIAL DOCUMENT',
        tableStyle: 'striped'
      };
    } else if (theme === 'corporate') {
      updates = {
        theme,
        primaryColor: '#1e3a8a', // Dark Navy
        fontFamily: 'Inter',
        logoPosition: 'right',
        showHeader: true,
        showFooter: true,
        showWatermark: false,
        tableStyle: 'grid'
      };
    } else if (theme === 'minimal') {
      updates = {
        theme,
        primaryColor: '#334155', // Slate Gray
        fontFamily: 'Inter',
        logoPosition: 'left',
        showHeader: false,
        showFooter: true,
        showWatermark: false,
        tableStyle: 'minimalist'
      };
    } else if (theme === 'traditional') {
      updates = {
        theme,
        primaryColor: '#b91c1c', // Deep Red
        fontFamily: 'Inter',
        logoPosition: 'center',
        showHeader: true,
        showFooter: true,
        showWatermark: true,
        watermarkText: 'APEX DIGITAL',
        tableStyle: 'grid'
      };
    }

    const updated = { ...selectedTemplate, ...updates };
    setSelectedTemplate(updated);
    db.saveTemplate(updated);
    setTemplates(db.getTemplates());
  };

  const updateField = (field: keyof DocumentTemplate, value: any) => {
    if (!selectedTemplate) return;
    const updated = { ...selectedTemplate, [field]: value };
    setSelectedTemplate(updated);
    db.saveTemplate(updated);
    setTemplates(db.getTemplates());
  };

  const handleSetDefault = () => {
    if (!selectedTemplate) return;
    const updated = { ...selectedTemplate, isDefault: true };
    setSelectedTemplate(updated);
    db.saveTemplate(updated);
    setTemplates(db.getTemplates());
  };

  const handleDuplicate = () => {
    if (!selectedTemplate) return;
    const newTemplate: DocumentTemplate = {
      ...selectedTemplate,
      id: `temp-${Date.now()}`,
      name: `${selectedTemplate.name} Copy`,
      isDefault: false
    };
    setSelectedTemplate(newTemplate);
    db.saveTemplate(newTemplate);
    setTemplates(db.getTemplates());
  };

  const handleCreateNew = () => {
    const newTemplate: DocumentTemplate = {
      id: `temp-${Date.now()}`,
      name: 'Custom Template Plan',
      companyId: currentCompanyId,
      theme: 'modern',
      primaryColor: '#3b82f6',
      fontFamily: 'Inter',
      logoPosition: 'left',
      showHeader: true,
      showFooter: true,
      showWatermark: false,
      watermarkText: 'PREVIEW',
      showBankDetails: true,
      showSignatureArea: true,
      showSealArea: true,
      tableStyle: 'striped',
      isDefault: false
    };
    setSelectedTemplate(newTemplate);
    db.saveTemplate(newTemplate);
    setTemplates(db.getTemplates());
  };

  // Preview styling values
  const themeFontClass = selectedTemplate?.fontFamily === 'Outfit' ? 'font-outfit' : 'font-inter';

  // Guard: no templates exist yet (fresh install before any company is added)
  if (!selectedTemplate) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Templates Found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Click "Add Template" to create your first document template.</p>
        <button onClick={handleCreateNew} className="apple-btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Template
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 glass-card p-6 border border-black/5 dark:border-white/5">
        <div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center">
            <Palette className="w-6 h-6 mr-2.5 text-[#007AFF]" />
            Document Template Canvas
          </h2>
          <p className="text-sm text-slate-450 mt-1">
            Build custom letterheads, typography sets, color branding, and watermarks for invoices and quotations.
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleCreateNew}
            className="apple-btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Template
          </button>
        </div>
      </div>

      {/* Editor & Preview Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left sidebar: Controllers drawer */}
        <div className="lg:col-span-5 glass-card border border-black/5 dark:border-white/5 p-6 space-y-6">
          
          {/* Template Selection Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Active Template</label>
            <select
              value={selectedTemplate.id}
              onChange={e => {
                const selected = templates.find(t => t.id === e.target.value);
                if (selected) setSelectedTemplate(selected);
              }}
              className="apple-input w-full font-semibold"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isDefault ? '⭐' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quick theme presets */}
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Presets</span>
            <div className="grid grid-cols-2 gap-2.5">
              <button 
                type="button" 
                onClick={() => handlePresetSelect('modern')}
                className={`p-3 border rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 ${
                  selectedTemplate.theme === 'modern' ? 'border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] dark:bg-[#007AFF]/10' : 'border-black/5 dark:border-white/5 dark:text-white'
                }`}
              >
                <Sparkles className="w-4.5 h-4.5" />
                <span>Modern Accent</span>
              </button>
              <button 
                type="button" 
                onClick={() => handlePresetSelect('corporate')}
                className={`p-3 border rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 ${
                  selectedTemplate.theme === 'corporate' ? 'border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] dark:bg-[#007AFF]/10' : 'border-black/5 dark:border-white/5 dark:text-white'
                }`}
              >
                <Layers className="w-4.5 h-4.5" />
                <span>Corporate Royal</span>
              </button>
              <button 
                type="button" 
                onClick={() => handlePresetSelect('minimal')}
                className={`p-3 border rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 ${
                  selectedTemplate.theme === 'minimal' ? 'border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] dark:bg-[#007AFF]/10' : 'border-black/5 dark:border-white/5 dark:text-white'
                }`}
              >
                <Settings2 className="w-4.5 h-4.5" />
                <span>Minimalist Slate</span>
              </button>
              <button 
                type="button" 
                onClick={() => handlePresetSelect('traditional')}
                className={`p-3 border rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 ${
                  selectedTemplate.theme === 'traditional' ? 'border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] dark:bg-[#007AFF]/10' : 'border-black/5 dark:border-white/5 dark:text-white'
                }`}
              >
                <Palette className="w-4.5 h-4.5" />
                <span>Traditional Red</span>
              </button>
            </div>
          </div>

          <div className="border-t border-black/5 dark:border-white/5 pt-5 space-y-5">
            {/* Custom Theme Configs */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Template Display Name</label>
              <input 
                type="text"
                value={selectedTemplate.name}
                onChange={e => updateField('name', e.target.value)}
                className="apple-input w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Brand Accent Color</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="color"
                    value={selectedTemplate.primaryColor}
                    onChange={e => updateField('primaryColor', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <input 
                    type="text"
                    value={selectedTemplate.primaryColor.toUpperCase()}
                    onChange={e => updateField('primaryColor', e.target.value)}
                    className="apple-input w-full text-xs font-mono font-bold py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Typography</label>
                <select
                  value={selectedTemplate.fontFamily}
                  onChange={e => updateField('fontFamily', e.target.value)}
                  className="apple-input w-full text-xs"
                >
                  <option value="Inter">Inter (Standard)</option>
                  <option value="Outfit">Outfit (Modern Rounded)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Logo Position</label>
                <select
                  value={selectedTemplate.logoPosition}
                  onChange={e => updateField('logoPosition', e.target.value)}
                  className="apple-input w-full text-xs"
                >
                  <option value="left">Left Align</option>
                  <option value="center">Center Align</option>
                  <option value="right">Right Align</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Table Print Style</label>
                <select
                  value={selectedTemplate.tableStyle}
                  onChange={e => updateField('tableStyle', e.target.value)}
                  className="apple-input w-full text-xs"
                >
                  <option value="striped">Zebra Striped Rows</option>
                  <option value="grid">Structured Grid</option>
                  <option value="minimalist">Minimal Borderless</option>
                </select>
              </div>
            </div>

            {/* Toggle Config Blocks */}
            <div className="space-y-3 bg-black/[0.015] dark:bg-white/[0.015] p-4 rounded-2xl border border-black/5 dark:border-white/5">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Toggle Layout Elements</span>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium dark:text-slate-350">Show Company Header Letterhead</span>
                <input 
                  type="checkbox"
                  checked={selectedTemplate.showHeader}
                  onChange={e => updateField('showHeader', e.target.checked)}
                  className="rounded text-[#007AFF] focus:ring-[#007AFF]/20"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium dark:text-slate-350">Show Company Footer Brand</span>
                <input 
                  type="checkbox"
                  checked={selectedTemplate.showFooter}
                  onChange={e => updateField('showFooter', e.target.checked)}
                  className="rounded text-[#007AFF] focus:ring-[#007AFF]/20"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium dark:text-slate-350">Show Bank Account Details</span>
                <input 
                  type="checkbox"
                  checked={selectedTemplate.showBankDetails}
                  onChange={e => updateField('showBankDetails', e.target.checked)}
                  className="rounded text-[#007AFF] focus:ring-[#007AFF]/20"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium dark:text-slate-350">Show Signature Box Area</span>
                <input 
                  type="checkbox"
                  checked={selectedTemplate.showSignatureArea}
                  onChange={e => updateField('showSignatureArea', e.target.checked)}
                  className="rounded text-[#007AFF] focus:ring-[#007AFF]/20"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium dark:text-slate-350">Show Company Seal Area</span>
                <input 
                  type="checkbox"
                  checked={selectedTemplate.showSealArea}
                  onChange={e => updateField('showSealArea', e.target.checked)}
                  className="rounded text-[#007AFF] focus:ring-[#007AFF]/20"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium dark:text-slate-350">Enable Draft/Background Watermark</span>
                <input 
                  type="checkbox"
                  checked={selectedTemplate.showWatermark}
                  onChange={e => updateField('showWatermark', e.target.checked)}
                  className="rounded text-[#007AFF] focus:ring-[#007AFF]/20"
                />
              </label>
            </div>

            {selectedTemplate.showWatermark && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Watermark Background Text</label>
                <input 
                  type="text"
                  value={selectedTemplate.watermarkText}
                  onChange={e => updateField('watermarkText', e.target.value.toUpperCase())}
                  className="apple-input w-full font-mono font-bold uppercase"
                />
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col space-y-2 pt-4 border-t border-black/5 dark:border-white/5">
            {!selectedTemplate.isDefault && (
              <button 
                type="button" 
                onClick={handleSetDefault}
                className="apple-btn-secondary text-xs text-[#007AFF] hover:text-[#005cb8]"
              >
                <Star className="w-4 h-4 mr-2" /> Set as Default for Company
              </button>
            )}
            <button 
              type="button" 
              onClick={handleDuplicate}
              className="apple-btn-secondary text-xs"
            >
              <Copy className="w-4 h-4 mr-2" /> Duplicate Template Configuration
            </button>
          </div>
        </div>

        {/* Right pane: Visual A4 Simulated Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="text-center mb-2 flex items-center space-x-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <Eye className="w-4 h-4" /> <span>Visual Preview Canvas (A4 Aspect Ratio)</span>
          </div>

          <div 
            className={`w-full max-w-[595px] min-h-[842px] bg-white dark:bg-slate-950 p-8 shadow-lg border border-slate-250 dark:border-slate-800 rounded relative watermark-container text-slate-800 dark:text-slate-200 ${themeFontClass}`}
            id="simulated-a4-canvas"
          >
            {/* Background Watermark */}
            {selectedTemplate.showWatermark && selectedTemplate.watermarkText && (
              <div className="watermark-text" style={{ fontSize: '3rem' }}>
                {selectedTemplate.watermarkText}
              </div>
            )}

            {/* Simulated Content Layout */}
            <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
              
              {/* Template Header block */}
              {selectedTemplate.showHeader && (
                <div 
                  className={`flex items-center justify-between pb-6 border-b-2`}
                  style={{ borderBottomColor: selectedTemplate.primaryColor }}
                >
                  {/* Left Logo, right details or vice versa based on logoPosition */}
                  <div className={`flex w-full items-center justify-between ${
                    selectedTemplate.logoPosition === 'right' ? 'flex-row-reverse' : selectedTemplate.logoPosition === 'center' ? 'flex-col space-y-3' : 'flex-row'
                  }`}>
                    {/* Mock Logo */}
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs font-bold font-display">
                      [ LOGO ]
                    </div>
                    
                    {/* Mock Company Info */}
                    <div className={`text-xs space-y-1 ${
                      selectedTemplate.logoPosition === 'right' ? 'text-left' : selectedTemplate.logoPosition === 'center' ? 'text-center' : 'text-right'
                    }`}>
                      <h4 className="font-bold text-sm" style={{ color: selectedTemplate.primaryColor }}>{activeCompany.name}</h4>
                      <p className="max-w-xs">{activeCompany.address}</p>
                      <p>GSTIN: {activeCompany.gstNumber} | PAN: {activeCompany.panNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Info Metadata Block */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">BILLED TO:</span>
                  <div className="space-y-0.5 font-medium">
                    <p className="font-bold text-slate-900 dark:text-white">Acme Corporates Inc</p>
                    <p>45, Corporate Road, Andheri West</p>
                    <p>Mumbai, Maharashtra, 400053</p>
                    <p className="font-semibold text-slate-600 dark:text-slate-300">GSTIN: 27ACME1234A1Z5</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <h3 className="text-base font-bold uppercase tracking-wider" style={{ color: selectedTemplate.primaryColor }}>
                    TAX INVOICE
                  </h3>
                  <p><span className="text-slate-400 font-semibold">Invoice No:</span> <span className="font-bold font-mono">INV-2026-001</span></p>
                  <p><span className="text-slate-400 font-semibold">Date:</span> 2026-06-11</p>
                  <p><span className="text-slate-400 font-semibold">Due Date:</span> 2026-07-11</p>
                </div>
              </div>

              {/* Table rendering demo */}
              <div className="mt-4">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr 
                      className={`text-white font-bold`} 
                      style={{ backgroundColor: selectedTemplate.primaryColor }}
                    >
                      <th className="p-2 rounded-l">Item Description</th>
                      <th className="p-2">HSN</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">GST %</th>
                      <th className="p-2 text-right rounded-r">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={selectedTemplate.tableStyle === 'striped' ? 'bg-slate-50 dark:bg-slate-900/50' : selectedTemplate.tableStyle === 'grid' ? 'border-b border-slate-200 dark:border-slate-800' : ''}>
                      <td className="p-2 font-semibold">Web Application Development</td>
                      <td className="p-2 font-mono">998311</td>
                      <td className="p-2 text-right">10</td>
                      <td className="p-2 text-right">3,500.00</td>
                      <td className="p-2 text-right">18%</td>
                      <td className="p-2 text-right font-bold">41,300.00</td>
                    </tr>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <td className="p-2 font-semibold">Premium UI/UX Figma Design</td>
                      <td className="p-2 font-mono">998314</td>
                      <td className="p-2 text-right">1</td>
                      <td className="p-2 text-right">15,000.00</td>
                      <td className="p-2 text-right">18%</td>
                      <td className="p-2 text-right font-bold">17,700.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="grid grid-cols-12 gap-4 text-xs pt-4 border-t border-slate-100 dark:border-slate-850">
                <div className="col-span-7 space-y-3">
                  {/* Bank Details section */}
                  {selectedTemplate.showBankDetails && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-0.5 text-[10px] text-slate-500 max-w-sm">
                      <p className="font-bold text-slate-700 dark:text-slate-350">REMITTANCE BANK DETAILS:</p>
                      <p><span className="text-slate-400">Bank Name:</span> {activeCompany.bankDetails.bankName || 'HDFC Bank Ltd'}</p>
                      <p><span className="text-slate-400">Account No:</span> {activeCompany.bankDetails.accountNumber || '50200012345678'}</p>
                      <p><span className="text-slate-400">IFSC Code:</span> {activeCompany.bankDetails.ifscCode || 'HDFC0000112'}</p>
                    </div>
                  )}
                  
                  <div className="text-[10px] text-slate-450 italic">
                    Terms: All checks payable to the company name directly. Net-30 payment duration.
                  </div>
                </div>

                <div className="col-span-5 space-y-1.5 text-right font-medium">
                  <p><span className="text-slate-400">Sub Total:</span> 50,000.00</p>
                  <p><span className="text-slate-400">Taxes (GST 18%):</span> 9,000.00</p>
                  <p className="text-sm font-bold border-t border-slate-200 dark:border-slate-800 pt-1.5" style={{ color: selectedTemplate.primaryColor }}>
                    Grand Total: 59,000.00
                  </p>
                </div>
              </div>

              {/* Signature Seal Blocks */}
              <div className="flex justify-between items-end pt-8 text-xs">
                {selectedTemplate.showSealArea ? (
                  <div className="w-24 h-24 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-[9px] text-slate-400 rounded-full">
                    [ OFFICE SEAL ]
                  </div>
                ) : <div />}
                
                {selectedTemplate.showSignatureArea ? (
                  <div className="text-center space-y-1">
                    <div className="w-32 border-b border-slate-450" />
                    <p className="text-[10px] text-slate-400">Authorized Signatory</p>
                  </div>
                ) : <div />}
              </div>

              {/* Template Footer block */}
              {selectedTemplate.showFooter && (
                <div className="border-t border-slate-150 dark:border-slate-800 pt-3 text-center text-[9px] text-slate-400 font-medium">
                  Page 1 of 1 &bull; {activeCompany.website} &bull; Email: {activeCompany.email}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
