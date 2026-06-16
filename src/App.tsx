import { useState, useEffect } from 'react';
import { db, initializeDB } from './services/db';
import type { Company, BusinessDocument, UserRole, DocumentType } from './types';
import { Dashboard } from './components/Dashboard';
import { CompanyManager } from './components/CompanyManager';
import { CustomerManager } from './components/CustomerManager';
import { ProductCatalog } from './components/ProductCatalog';
import { TemplateEditor } from './components/TemplateEditor';
import { DocumentCreator } from './components/DocumentCreator';
import { DocumentViewer } from './components/DocumentViewer';
import { Reports } from './components/Reports';
import { CustomerPortal } from './components/CustomerPortal';

// Lucide React Icons
import { 
  LayoutDashboard, FileText, Users, Tag, CreditCard, 
  BarChart3, Settings, Eye, Sun, Moon, Plus, Search, 
  Trash2, Edit2, Shield, Download, Upload, Menu, X, Building
} from 'lucide-react';

function App() {
  // Navigation / View states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeView, setActiveView] = useState<'list' | 'create' | 'view' | 'edit' | 'portal'>('list');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [creatorDefaultType, setCreatorDefaultType] = useState<DocumentType | null>(null);

  // Settings sub-tab state
  const [settingsTab, setSettingsTab] = useState<'profile' | 'templates'>('profile');

  // Role and settings simulation states
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('all');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);

  // Search & Filter within documents list
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docFilterType, setDocFilterType] = useState<'all' | 'quotation' | 'job_order' | 'invoice'>('all');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Load configuration from local storage
  useEffect(() => {
    initializeDB();
    setUserRole(db.getActiveRole());
    setCompanies(db.getCompanies());
    setDocuments(db.getDocuments());
    
    // Check local preferences
    const prefersDark = localStorage.getItem('bdm_theme') === 'dark';
    setDarkMode(prefersDark);
    if (prefersDark) {
      document.body.classList.add('dark');
    }
  }, []);

  // Update lists from DB
  const refreshDBState = () => {
    setCompanies(db.getCompanies());
    setDocuments(db.getDocuments());
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    localStorage.setItem('bdm_theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  // Toggle simulated User Roles
  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    db.setActiveRole(role);
    // Reset view if role changes to Accountant and viewing templates
    if (role === 'accountant' && activeTab === 'settings') {
      setActiveTab('dashboard');
    }
  };

  // Backup and Restore Actions
  const handleBackupExport = () => {
    const jsonStr = db.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BDM_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const success = db.importBackup(text);
        if (success) {
          alert('Backup database restored successfully!');
          refreshDBState();
          window.location.reload();
        } else {
          alert('Error: Invalid backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Navigate actions helper with backward compatibility for 'documents' tab
  const navigateTo = (tab: string, view: 'list' | 'create' | 'view' | 'edit' | 'portal' = 'list', docId: string | null = null, docType: DocumentType | null = null) => {
    const resolvedTab = tab === 'documents' ? 'payments' : tab;
    setActiveTab(resolvedTab);
    setActiveView(view);
    setSelectedDocId(docId);
    setCreatorDefaultType(docType);
    setMobileSidebarOpen(false);
    refreshDBState();
  };

  // Document management handlers
  const handleDocDelete = (id: string) => {
    if (userRole !== 'admin') {
      alert('Access Denied: Only Admins can delete documents.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this document? This cannot be undone.')) {
      db.deleteDocument(id);
      refreshDBState();
    }
  };

  // Format currencies
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  // Filter documents list based on company filter & search query
  const filteredDocuments = documents.filter(d => {
    // Company filter
    if (activeCompanyId !== 'all' && d.companyId !== activeCompanyId) return false;
    
    // Type filter
    if (docFilterType !== 'all') {
      if (docFilterType === 'invoice' && !(d.docType === 'invoice' || d.docType === 'tax_invoice')) return false;
      if (docFilterType === 'quotation' && d.docType !== 'quotation') return false;
      if (docFilterType === 'job_order' && d.docType !== 'job_order') return false;
    }

    // Search query
    const q = docSearchQuery.toLowerCase();
    return (
      d.docNumber.toLowerCase().includes(q) ||
      d.customerName.toLowerCase().includes(q) ||
      (d.projectName || '').toLowerCase().includes(q)
    );
  });

  const isAccountant = userRole === 'accountant';

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0E0E10] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col font-sans transition-colors duration-300">
      
      {/* Simulation Controls Top-bar (Frosted Navbar) */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#16161C]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs no-print select-none shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between md:justify-start gap-4">
          <button 
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4 text-[#007AFF]" />
            <span>Workspace Panel</span>
          </div>

          <div className="hidden md:block w-[1px] h-4 bg-black/10 dark:bg-white/10" />

          {/* Role selector */}
          <div className="flex items-center bg-black/5 dark:bg-white/5 p-0.5 rounded-xl border border-black/5 dark:border-white/5">
            <button 
              onClick={() => handleRoleChange('admin')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-200 ${
                userRole === 'admin' ? 'bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Admin
            </button>
            <button 
              onClick={() => handleRoleChange('staff')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-200 ${
                userRole === 'staff' ? 'bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Staff
            </button>
            <button 
              onClick={() => handleRoleChange('accountant')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-200 ${
                userRole === 'accountant' ? 'bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Accountant
            </button>
          </div>
        </div>

        {/* Global actions & backups */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          {/* Active Company Filter */}
          <div className="flex items-center bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5">
            <span className="text-slate-400 font-bold uppercase mr-2 scale-[0.9]">Scope:</span>
            <select
              value={activeCompanyId}
              onChange={e => setActiveCompanyId(e.target.value)}
              className="bg-transparent text-[#1D1D1F] dark:text-[#F5F5F7] border-none focus:outline-none font-semibold pr-2 cursor-pointer"
            >
              <option value="all">All Companies</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Dark Mode */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl border border-transparent transition-all"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Backup */}
            <button
              onClick={handleBackupExport}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl border border-transparent text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold transition-all"
              title="Backup Database"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Restore */}
            <label 
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl border border-transparent text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold cursor-pointer transition-all"
              title="Restore Backup"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" className="hidden" onChange={handleBackupImport} />
            </label>
          </div>
        </div>
      </header>

      {/* Main Grid Shell */}
      <div className="flex-1 flex flex-row relative overflow-hidden">
        
        {/* SIDEBAR NAVIGATION (Frosted Glass Panel) */}
        <aside className={`w-64 glass-sidebar flex flex-col justify-between p-5 md:flex no-print shadow-sm z-30 transition-all duration-300 ${
          mobileSidebarOpen ? 'fixed inset-y-0 left-0 bg-white dark:bg-[#16161C] pt-20' : 'hidden md:flex'
        }`}>
          <div className="space-y-6">
            {/* Header Title branding */}
            <div className="flex items-center space-x-3 px-2 py-3 border-b border-black/5 dark:border-white/5">
              <div className="w-10 h-10 bg-[#007AFF] rounded-2xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,122,255,0.25)] font-display font-extrabold text-xl">
                B
              </div>
              <div>
                <h1 className="font-display font-extrabold text-base tracking-tight text-slate-800 dark:text-white leading-tight">BDM Studio</h1>
                <span className="text-[9px] text-[#007AFF] font-bold uppercase tracking-wider">Premium SaaS</span>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1">
              <button
                onClick={() => navigateTo('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === 'dashboard' && activeView !== 'create'
                    ? 'bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.15)]' 
                    : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-4.5 h-4.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => navigateTo('create-invoice', 'create', null, 'invoice')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === 'create-invoice' || activeView === 'create'
                    ? 'bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.15)]' 
                    : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Create Invoice</span>
              </button>

              <button
                onClick={() => navigateTo('customers')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === 'customers' 
                    ? 'bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.15)]' 
                    : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-4.5 h-4.5" />
                <span>Clients</span>
              </button>

              <button
                onClick={() => navigateTo('products')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === 'products' 
                    ? 'bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.15)]' 
                    : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Tag className="w-4.5 h-4.5" />
                <span>Products & Services</span>
              </button>

              <button
                onClick={() => navigateTo('payments')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === 'payments' && activeView === 'list'
                    ? 'bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.15)]' 
                    : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-4.5 h-4.5" />
                <span>Payments</span>
              </button>

              <button
                onClick={() => navigateTo('reports')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === 'reports' 
                    ? 'bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.15)]' 
                    : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4.5 h-4.5" />
                <span>Reports</span>
              </button>

              {!isAccountant && (
                <button
                  onClick={() => navigateTo('settings')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === 'settings' 
                      ? 'bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.15)]' 
                      : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Settings className="w-4.5 h-4.5" />
                  <span>Settings</span>
                </button>
              )}
            </nav>
          </div>

          {/* Bottom info footer block */}
          <div className="p-3.5 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 text-[10px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-655 dark:text-slate-300">Apple HID Active Studio</p>
            <p className="font-mono text-[9px] truncate">business-document-manager-pro</p>
          </div>
        </aside>

        {/* VIEW MAIN CONTAINER */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto z-10 max-w-full">
          
          {/* Active view state Router logic */}
          {activeView === 'portal' && selectedDocId ? (
            /* Client portal simulator view */
            <CustomerPortal 
              documentId={selectedDocId} 
              onBack={() => navigateTo('payments', 'view', selectedDocId)} 
            />
          ) : activeView === 'view' && selectedDocId ? (
            /* View document */
            <DocumentViewer 
              documentId={selectedDocId} 
              userRole={userRole}
              onBack={() => navigateTo('payments')} 
              onEdit={(id) => navigateTo('payments', 'edit', id)}
              onNavigate={(t, v, id) => navigateTo(t, v, id)}
            />
          ) : activeView === 'edit' && selectedDocId ? (
            /* Edit Document Form */
            <DocumentCreator 
              userRole={userRole} 
              documentId={selectedDocId}
              defaultType={creatorDefaultType}
              onBack={() => navigateTo('payments')}
              activeCompanyId={activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId}
            />
          ) : (activeTab === 'create-invoice' || activeView === 'create') ? (
            /* Create Document Form */
            <DocumentCreator 
              userRole={userRole} 
              documentId={null}
              defaultType={creatorDefaultType || 'invoice'}
              onBack={() => navigateTo(activeTab === 'create-invoice' ? 'dashboard' : 'payments')}
              activeCompanyId={activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId}
            />
          ) : (
            /* Standard Listing Views */
            <>
              {activeTab === 'dashboard' && (
                <Dashboard 
                  onNavigate={(tab, view, id, docType) => navigateTo(tab, view, id, docType)} 
                  userRole={userRole} 
                />
              )}

              {activeTab === 'customers' && (
                <CustomerManager userRole={userRole} />
              )}

              {activeTab === 'products' && (
                <ProductCatalog userRole={userRole} />
              )}

              {activeTab === 'reports' && (
                <Reports onNavigate={(t, v, id) => navigateTo(t, v, id)} />
              )}

              {activeTab === 'settings' && !isAccountant && (
                <div className="space-y-6">
                  {/* Settings sub-navbar (frosted layout) */}
                  <div className="flex justify-between items-center bg-white/70 dark:bg-[#16161C]/70 backdrop-blur-md p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                    <div className="flex space-x-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-xl">
                      <button
                        onClick={() => setSettingsTab('profile')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center ${
                          settingsTab === 'profile'
                            ? 'bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <Building className="w-3.5 h-3.5 mr-1.5" />
                        Company Profiles
                      </button>
                      <button
                        onClick={() => setSettingsTab('templates')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center ${
                          settingsTab === 'templates'
                            ? 'bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        Print Templates Configurations
                      </button>
                    </div>
                  </div>

                  {settingsTab === 'profile' ? (
                    <CompanyManager userRole={userRole} />
                  ) : (
                    <TemplateEditor currentCompanyId={activeCompanyId === 'all' ? (companies[0]?.id || 'comp-1') : activeCompanyId} />
                  )}
                </div>
              )}

              {activeTab === 'payments' && (
                /* Documents / Payments Ledger Tab */
                <div className="space-y-6">
                  {/* Top Header Card */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 bg-white/70 dark:bg-[#16161C]/70 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5">
                    <div>
                      <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center">
                        <CreditCard className="w-6 h-6 mr-2.5 text-[#007AFF]" />
                        Payments Ledger Directory
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Track customer outstanding balances, invoice payments histories, and client quotes.
                      </p>
                    </div>

                    {!isAccountant && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigateTo('payments', 'create', null, 'tax_invoice')}
                          className="apple-btn-primary"
                        >
                          <Plus className="w-4 h-4 mr-1.5" /> Tax Invoice
                        </button>
                        <button
                          onClick={() => navigateTo('payments', 'create', null, 'invoice')}
                          className="apple-btn-secondary"
                        >
                          <Plus className="w-4 h-4 mr-1.5" /> Standard Invoice
                        </button>
                        <button
                          onClick={() => navigateTo('payments', 'create', null, 'quotation')}
                          className="apple-btn-secondary"
                        >
                          <Plus className="w-4 h-4 mr-1.5" /> Quotation
                        </button>
                        <button
                          onClick={() => navigateTo('payments', 'create', null, 'job_order')}
                          className="apple-btn-secondary"
                        >
                          <Plus className="w-4 h-4 mr-1.5" /> Job Order
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Filters & search panel */}
                  <div className="bg-white/70 dark:bg-[#16161C]/70 backdrop-blur-md p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Tabs filtering */}
                    <div className="flex bg-black/5 dark:bg-white/5 p-0.5 rounded-xl border border-transparent">
                      <button
                        onClick={() => setDocFilterType('all')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                          docFilterType === 'all' ? 'bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm' : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setDocFilterType('invoice')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                          docFilterType === 'invoice' ? 'bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm' : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        Invoices
                      </button>
                      <button
                        onClick={() => setDocFilterType('quotation')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                          docFilterType === 'quotation' ? 'bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm' : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        Quotations
                      </button>
                      <button
                        onClick={() => setDocFilterType('job_order')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                          docFilterType === 'job_order' ? 'bg-white dark:bg-[#2C2C35] text-[#007AFF] shadow-sm' : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        Job Orders
                      </button>
                    </div>

                    {/* Search */}
                    <div className="flex items-center bg-black/5 dark:bg-white/5 px-3.5 py-2 rounded-xl border border-transparent flex-1 md:max-w-md">
                      <Search className="w-4.5 h-4.5 text-slate-400 mr-2" />
                      <input 
                        type="text"
                        value={docSearchQuery}
                        onChange={e => setDocSearchQuery(e.target.value)}
                        placeholder="Search document ID, client name..."
                        className="w-full bg-transparent border-none text-xs focus:outline-none dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Document Grid directory */}
                  <div className="bg-white/70 dark:bg-[#16161C]/70 backdrop-blur-md rounded-3xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-slate-400 uppercase text-[9px] tracking-wider font-bold">
                            <th className="px-6 py-4">Document</th>
                            <th className="px-6 py-4">Company Scope</th>
                            <th className="px-6 py-4">Client Name</th>
                            <th className="px-6 py-4 text-right">Invoice Total</th>
                            <th className="px-6 py-4 text-center">Payment Status</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                          {filteredDocuments.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-10 text-center text-slate-450 dark:text-slate-500">
                                No records found matching your filter selections.
                              </td>
                            </tr>
                          ) : (
                            filteredDocuments.map(doc => {
                              const activeCompany = companies.find(c => c.id === doc.companyId);
                              
                              // Badges
                              const getStatusColor = (val: string) => {
                                switch(val) {
                                  case 'paid': return 'bg-green-500/10 text-green-600 dark:text-green-400';
                                  case 'partially_paid': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
                                  case 'unpaid': return 'bg-red-500/10 text-red-600 dark:text-red-400';
                                  case 'overdue': return 'bg-rose-500/20 text-rose-600 dark:text-rose-450';
                                  case 'completed': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                                  case 'in_progress': return 'bg-blue-500/10 text-blue-650 dark:text-blue-400';
                                  case 'approved': return 'bg-teal-500/10 text-teal-600 dark:text-teal-400';
                                  case 'cancelled': return 'bg-slate-500/10 text-slate-500';
                                  default: return 'bg-slate-500/10 text-slate-600';
                                }
                              };

                              return (
                                <tr key={doc.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150">
                                  <td className="px-6 py-4.5">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-bold text-slate-800 dark:text-white font-mono">{doc.docNumber}</span>
                                      <span className="text-[9px] bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                        {doc.docType.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-1 font-medium">Issued: {doc.date}</div>
                                  </td>
                                  
                                  <td className="px-6 py-4.5">
                                    <div className="font-semibold text-slate-700 dark:text-slate-350 truncate max-w-xs">{activeCompany?.name}</div>
                                  </td>

                                  <td className="px-6 py-4.5">
                                    <div className="font-semibold text-slate-700 dark:text-slate-350">{doc.customerName}</div>
                                    {doc.projectName && <span className="text-[9px] text-[#007AFF] font-bold block mt-0.5">Scope: {doc.projectName}</span>}
                                  </td>

                                  <td className="px-6 py-4.5 text-right font-bold text-slate-800 dark:text-white font-mono">
                                    {formatCurrency(doc.grandTotal)}
                                  </td>

                                  <td className="px-6 py-4.5 text-center">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      getStatusColor(doc.paymentStatus || doc.jobStatus || 'pending')
                                    }`}>
                                      {doc.paymentStatus || doc.jobStatus || 'pending'}
                                    </span>
                                  </td>

                                  <td className="px-6 py-4.5 text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                      <button
                                        onClick={() => navigateTo('payments', 'view', doc.id)}
                                        className="p-1.5 text-slate-400 hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                                        title="View Details"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      
                                      {/* Only let creator or admins edit */}
                                      {(userRole === 'admin' || (userRole === 'staff' && doc.createdBy === 'staff')) && (
                                        <button
                                          onClick={() => navigateTo('payments', 'edit', doc.id)}
                                          className="p-1.5 text-slate-400 hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                                          title="Edit Document"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                      )}

                                      {userRole === 'admin' && (
                                        <button
                                          onClick={() => handleDocDelete(doc.id)}
                                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                          title="Delete Document"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;
