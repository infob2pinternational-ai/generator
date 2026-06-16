import React, { useState } from 'react';
import { db } from '../services/db';
import type { Company, UserRole } from '../types';
import { Plus, Building2, Landmark, FileText, Upload, Trash2, X } from 'lucide-react';


interface CompanyManagerProps {
  userRole: UserRole;
}

export const CompanyManager: React.FC<CompanyManagerProps> = ({ userRole }) => {
  const [companies, setCompanies] = useState<Company[]>(db.getCompanies());
  const [isEditing, setIsEditing] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [dragActiveField, setDragActiveField] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent, field: string, isActive: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (isActive) {
      setDragActiveField(field);
    } else {
      setDragActiveField(null);
    }
  };

  const handleDrop = (e: React.DragEvent, field: 'logoUrl' | 'authorizedSignatureUrl' | 'companySealUrl' | 'headerImageUrl' | 'footerImageUrl') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveField(null);
    const file = e.dataTransfer.files?.[0];
    if (file && currentCompany) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentCompany({
          ...currentCompany,
          [field]: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Base64 file reader helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'authorizedSignatureUrl' | 'companySealUrl' | 'headerImageUrl' | 'footerImageUrl') => {
    const file = e.target.files?.[0];
    if (file && currentCompany) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentCompany({
          ...currentCompany,
          [field]: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (company: Company) => {
    if (!isAdmin) return;
    setCurrentCompany({
      ...company,
      bankDetails: company.bankDetails || {
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        accountName: ''
      }
    });
    setIsEditing(true);
  };

  const handleCreateClick = () => {
    if (!isAdmin) return;
    setCurrentCompany({
      id: `comp-${Date.now()}`,
      name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      gstNumber: '',
      panNumber: '',
      bankDetails: {
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        accountName: ''
      },
      createdAt: new Date().toISOString()
    });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCompany) {
      db.saveCompany(currentCompany);
      setCompanies(db.getCompanies());
      setIsEditing(false);
      setCurrentCompany(null);
    }
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to delete this company profile? This action cannot be undone.')) {
      db.deleteCompany(id);
      setCompanies(db.getCompanies());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white flex items-center">
            <Building2 className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            Company Profiles
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage multi-company setups, banking information, billing identities, and electronic seals.
          </p>
        </div>

        {isAdmin && !isEditing && (
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Company
          </button>
        )}
      </div>

      {isEditing && currentCompany ? (
        /* Edit / Create Form */
        <form onSubmit={handleSave} className="glass-card border border-black/5 dark:border-white/5 overflow-hidden transition-all duration-300">
          <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/[0.01] dark:bg-white/[0.01]">
            <h3 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-white">
              {currentCompany.name ? `Edit Profile: ${currentCompany.name}` : 'Create New Company Profile'}
            </h3>
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setCurrentCompany(null); }}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Primary Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Company Name *</label>
                <input 
                  type="text" required
                  value={currentCompany.name || ''}
                  onChange={e => setCurrentCompany({ ...currentCompany, name: e.target.value })}
                  placeholder="Apex Software Solutions Ltd"
                  className="apple-input w-full font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address *</label>
                <input 
                  type="email" required
                  value={currentCompany.email || ''}
                  onChange={e => setCurrentCompany({ ...currentCompany, email: e.target.value })}
                  placeholder="billing@company.com"
                  className="apple-input w-full font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number *</label>
                <input 
                  type="text" required
                  value={currentCompany.phone || ''}
                  onChange={e => setCurrentCompany({ ...currentCompany, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="apple-input w-full font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Website</label>
                <input 
                  type="url"
                  value={currentCompany.website || ''}
                  onChange={e => setCurrentCompany({ ...currentCompany, website: e.target.value })}
                  placeholder="https://company.com"
                  className="apple-input w-full font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">GST Number</label>
                <input 
                  type="text"
                  value={currentCompany.gstNumber || ''}
                  onChange={e => setCurrentCompany({ ...currentCompany, gstNumber: e.target.value.toUpperCase() })}
                  placeholder="09AAAAA1111A1Z1"
                  className="apple-input w-full font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">PAN Number</label>
                <input 
                  type="text"
                  value={currentCompany.panNumber || ''}
                  onChange={e => setCurrentCompany({ ...currentCompany, panNumber: e.target.value.toUpperCase() })}
                  placeholder="AAAAA1111A"
                  className="apple-input w-full font-mono font-bold"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Office Address *</label>
                <textarea required rows={3}
                  value={currentCompany.address || ''}
                  onChange={e => setCurrentCompany({ ...currentCompany, address: e.target.value })}
                  placeholder="Suite 404, Tech Park, City, State, ZIP"
                  className="apple-input w-full resize-none h-20 font-medium"
                />
              </div>
            </div>

            {/* Bank Details section */}
            <div className="border-t border-black/5 dark:border-white/5 pt-6">
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center mb-4 uppercase tracking-wider text-xs text-slate-400">
                <Landmark className="w-4.5 h-4.5 mr-2 text-[#007AFF]" /> Bank Details (For Invoice Remittance)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bank Account Name</label>
                  <input 
                    type="text"
                    value={currentCompany.bankDetails?.accountName || ''}
                    onChange={e => setCurrentCompany({ 
                      ...currentCompany, 
                      bankDetails: { ...(currentCompany.bankDetails || {}), accountName: e.target.value } as any
                    })}
                    placeholder="Apex Software Solutions Ltd"
                    className="apple-input w-full font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bank Name</label>
                  <input 
                    type="text"
                    value={currentCompany.bankDetails?.bankName || ''}
                    onChange={e => setCurrentCompany({ 
                      ...currentCompany, 
                      bankDetails: { ...(currentCompany.bankDetails || {}), bankName: e.target.value } as any
                    })}
                    placeholder="HDFC Bank Ltd"
                    className="apple-input w-full font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Account Number</label>
                  <input 
                    type="text"
                    value={currentCompany.bankDetails?.accountNumber || ''}
                    onChange={e => setCurrentCompany({ 
                      ...currentCompany, 
                      bankDetails: { ...(currentCompany.bankDetails || {}), accountNumber: e.target.value } as any
                    })}
                    placeholder="50200012345678"
                    className="apple-input w-full font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">IFSC Code</label>
                  <input 
                    type="text"
                    value={currentCompany.bankDetails?.ifscCode || ''}
                    onChange={e => setCurrentCompany({ 
                      ...currentCompany, 
                      bankDetails: { ...(currentCompany.bankDetails || {}), ifscCode: e.target.value.toUpperCase() } as any
                    })}
                    placeholder="HDFC0000112"
                    className="apple-input w-full font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Branch Name</label>
                  <input 
                    type="text"
                    value={currentCompany.bankDetails?.branchName || ''}
                    onChange={e => setCurrentCompany({ 
                      ...currentCompany, 
                      bankDetails: { ...(currentCompany.bankDetails || {}), branchName: e.target.value } as any
                    })}
                    placeholder="Sector 62 Noida"
                    className="apple-input w-full font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Logo, Signature, Seal uploads */}
            <div className="border-t border-black/5 dark:border-white/5 pt-6 space-y-6">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center mb-4 uppercase tracking-wider text-xs text-slate-400">
                  <FileText className="w-4.5 h-4.5 mr-2 text-[#007AFF]" /> Branding Assets (Drag & Drop Active)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Logo file */}
                  <div className="bg-black/[0.01] dark:bg-white/[0.01] p-5 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-450 uppercase mb-3">Company Logo</span>
                    {currentCompany.logoUrl ? (
                      <div className="relative group w-32 h-16 bg-white border border-black/5 dark:border-white/5 rounded-xl p-1 mb-3 flex items-center justify-center">
                        <img src={currentCompany.logoUrl} className="max-h-full max-w-full object-contain" alt="Logo preview" />
                        <button 
                          type="button" 
                          onClick={() => setCurrentCompany({ ...currentCompany, logoUrl: '' })}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity text-xs"
                        >
                          Remove Logo
                        </button>
                      </div>
                    ) : (
                      <div 
                        onDragEnter={(e) => handleDrag(e, 'logoUrl', true)}
                        onDragOver={(e) => handleDrag(e, 'logoUrl', true)}
                        onDragLeave={(e) => handleDrag(e, 'logoUrl', false)}
                        onDrop={(e) => { handleDrag(e, 'logoUrl', false); handleDrop(e, 'logoUrl'); }}
                        className={`flex flex-col items-center justify-center w-32 h-16 border-2 border-dashed rounded-xl cursor-pointer mb-3 transition-all ${
                          dragActiveField === 'logoUrl' ? 'border-[#007AFF] bg-[#007AFF]/5' : 'border-black/15 dark:border-white/10 hover:border-[#007AFF]'
                        }`}
                      >
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                          <Upload className="w-5 h-5 text-slate-400" />
                          <span className="text-[9px] text-slate-400 font-bold mt-1 text-center leading-tight">Drop or Click</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'logoUrl')} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Signature file */}
                  <div className="bg-black/[0.01] dark:bg-white/[0.01] p-5 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-450 uppercase mb-3">Authorized Signature</span>
                    {currentCompany.authorizedSignatureUrl ? (
                      <div className="relative group w-32 h-16 bg-white border border-black/5 dark:border-white/5 rounded-xl p-1 mb-3 flex items-center justify-center">
                        <img src={currentCompany.authorizedSignatureUrl} className="max-h-full max-w-full object-contain" alt="Signature preview" />
                        <button 
                          type="button" 
                          onClick={() => setCurrentCompany({ ...currentCompany, authorizedSignatureUrl: '' })}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity text-xs"
                        >
                          Remove Signature
                        </button>
                      </div>
                    ) : (
                      <div 
                        onDragEnter={(e) => handleDrag(e, 'authorizedSignatureUrl', true)}
                        onDragOver={(e) => handleDrag(e, 'authorizedSignatureUrl', true)}
                        onDragLeave={(e) => handleDrag(e, 'authorizedSignatureUrl', false)}
                        onDrop={(e) => { handleDrag(e, 'authorizedSignatureUrl', false); handleDrop(e, 'authorizedSignatureUrl'); }}
                        className={`flex flex-col items-center justify-center w-32 h-16 border-2 border-dashed rounded-xl cursor-pointer mb-3 transition-all ${
                          dragActiveField === 'authorizedSignatureUrl' ? 'border-[#007AFF] bg-[#007AFF]/5' : 'border-black/15 dark:border-white/10 hover:border-[#007AFF]'
                        }`}
                      >
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                          <Upload className="w-5 h-5 text-slate-400" />
                          <span className="text-[9px] text-slate-400 font-bold mt-1 text-center leading-tight">Drop or Click</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'authorizedSignatureUrl')} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Company seal file */}
                  <div className="bg-black/[0.01] dark:bg-white/[0.01] p-5 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-450 uppercase mb-3">Official Seal / Stamp</span>
                    {currentCompany.companySealUrl ? (
                      <div className="relative group w-32 h-16 bg-white border border-black/5 dark:border-white/5 rounded-xl p-1 mb-3 flex items-center justify-center">
                        <img src={currentCompany.companySealUrl} className="max-h-full max-w-full object-contain" alt="Seal preview" />
                        <button 
                          type="button" 
                          onClick={() => setCurrentCompany({ ...currentCompany, companySealUrl: '' })}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity text-xs"
                        >
                          Remove Seal
                        </button>
                      </div>
                    ) : (
                      <div 
                        onDragEnter={(e) => handleDrag(e, 'companySealUrl', true)}
                        onDragOver={(e) => handleDrag(e, 'companySealUrl', true)}
                        onDragLeave={(e) => handleDrag(e, 'companySealUrl', false)}
                        onDrop={(e) => { handleDrag(e, 'companySealUrl', false); handleDrop(e, 'companySealUrl'); }}
                        className={`flex flex-col items-center justify-center w-32 h-16 border-2 border-dashed rounded-xl cursor-pointer mb-3 transition-all ${
                          dragActiveField === 'companySealUrl' ? 'border-[#007AFF] bg-[#007AFF]/5' : 'border-black/15 dark:border-white/10 hover:border-[#007AFF]'
                        }`}
                      >
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                          <Upload className="w-5 h-5 text-slate-400" />
                          <span className="text-[9px] text-slate-400 font-bold mt-1 text-center leading-tight">Drop or Click</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'companySealUrl')} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Letterhead Banner uploaders */}
              <div className="border-t border-black/5 dark:border-white/5 pt-6">
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center mb-4 uppercase tracking-wider text-xs text-slate-400">
                  <FileText className="w-4.5 h-4.5 mr-2 text-[#007AFF]" /> Custom Letterhead Banners (Optional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Header Image */}
                  <div className="bg-black/[0.01] dark:bg-white/[0.01] p-5 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase mb-3">Custom Header Banner (Full Width)</span>
                    {currentCompany.headerImageUrl ? (
                      <div className="relative group w-full h-20 bg-white border border-black/5 dark:border-white/5 rounded-xl p-1 mb-3 flex items-center justify-center overflow-hidden">
                        <img src={currentCompany.headerImageUrl} className="max-h-full max-w-full object-contain" alt="Header banner preview" />
                        <button 
                          type="button" 
                          onClick={() => setCurrentCompany({ ...currentCompany, headerImageUrl: '' })}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity text-xs"
                        >
                          Remove Header Banner
                        </button>
                      </div>
                    ) : (
                      <div 
                        onDragEnter={(e) => handleDrag(e, 'headerImageUrl', true)}
                        onDragOver={(e) => handleDrag(e, 'headerImageUrl', true)}
                        onDragLeave={(e) => handleDrag(e, 'headerImageUrl', false)}
                        onDrop={(e) => { handleDrag(e, 'headerImageUrl', false); handleDrop(e, 'headerImageUrl'); }}
                        className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer mb-3 transition-all ${
                          dragActiveField === 'headerImageUrl' ? 'border-[#007AFF] bg-[#007AFF]/5' : 'border-black/15 dark:border-white/10 hover:border-[#007AFF]'
                        }`}
                      >
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                          <Upload className="w-5 h-5 text-slate-400" />
                          <span className="text-[10px] text-slate-400 font-bold mt-1">Drop banner here or click to select</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'headerImageUrl')} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Footer Image */}
                  <div className="bg-black/[0.01] dark:bg-white/[0.01] p-5 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase mb-3">Custom Footer Banner (Full Width)</span>
                    {currentCompany.footerImageUrl ? (
                      <div className="relative group w-full h-20 bg-white border border-black/5 dark:border-white/5 rounded-xl p-1 mb-3 flex items-center justify-center overflow-hidden">
                        <img src={currentCompany.footerImageUrl} className="max-h-full max-w-full object-contain" alt="Footer banner preview" />
                        <button 
                          type="button" 
                          onClick={() => setCurrentCompany({ ...currentCompany, footerImageUrl: '' })}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity text-xs"
                        >
                          Remove Footer Banner
                        </button>
                      </div>
                    ) : (
                      <div 
                        onDragEnter={(e) => handleDrag(e, 'footerImageUrl', true)}
                        onDragOver={(e) => handleDrag(e, 'footerImageUrl', true)}
                        onDragLeave={(e) => handleDrag(e, 'footerImageUrl', false)}
                        onDrop={(e) => { handleDrag(e, 'footerImageUrl', false); handleDrop(e, 'footerImageUrl'); }}
                        className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer mb-3 transition-all ${
                          dragActiveField === 'footerImageUrl' ? 'border-[#007AFF] bg-[#007AFF]/5' : 'border-black/15 dark:border-white/10 hover:border-[#007AFF]'
                        }`}
                      >
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                          <Upload className="w-5 h-5 text-slate-400" />
                          <span className="text-[10px] text-slate-400 font-bold mt-1">Drop banner here or click to select</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'footerImageUrl')} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setCurrentCompany(null); }}
              className="apple-btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="apple-btn-primary"
            >
              Save Company Profile
            </button>
          </div>
        </form>
      ) : (
        /* Company List */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {companies.map(company => (
            <div key={company.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} className="max-h-full max-w-full object-contain" alt="Logo" />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">{company.name}</h3>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{company.website || 'No website listed'}</p>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    ID: {company.id}
                  </span>
                </div>

                <div className="mt-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <p className="flex items-start">
                    <span className="font-semibold w-20 text-slate-400 uppercase text-[10px] tracking-wider mt-1">Address:</span>
                    <span className="flex-1">{company.address}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-semibold w-20 text-slate-400 uppercase text-[10px] tracking-wider">Phone:</span>
                    <span>{company.phone}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-semibold w-20 text-slate-400 uppercase text-[10px] tracking-wider">Email:</span>
                    <span>{company.email}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-3">
                    <p>
                      <span className="block font-semibold text-slate-400 uppercase text-[10px] tracking-wider">GSTIN:</span>
                      <span className="font-mono text-xs">{company.gstNumber || 'Not Registered'}</span>
                    </p>
                    <p>
                      <span className="block font-semibold text-slate-400 uppercase text-[10px] tracking-wider">PAN:</span>
                      <span className="font-mono text-xs">{company.panNumber || 'N/A'}</span>
                    </p>
                  </div>
                </div>

                {/* Bank Preview */}
                {company.bankDetails.bankName && (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-xs space-y-1 text-slate-500 dark:text-slate-400">
                    <div className="font-semibold text-slate-600 dark:text-slate-300 flex items-center mb-1">
                      <Landmark className="w-3.5 h-3.5 mr-1" /> {company.bankDetails.bankName}
                    </div>
                    <p><span className="text-slate-400">Account:</span> {company.bankDetails.accountNumber}</p>
                    <p><span className="text-slate-400">IFSC:</span> {company.bankDetails.ifscCode} | <span className="text-slate-400">Branch:</span> {company.bankDetails.branchName}</p>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-700/50 pt-4 mt-6">
                  <button 
                    onClick={() => handleDelete(company.id)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    title="Delete profile"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => handleEditClick(company)}
                    className="px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
