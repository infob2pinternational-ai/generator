import React from 'react';
import { db } from '../services/db';
import type { BusinessDocument, UserRole } from '../types';
import { 
  FileText, Briefcase, FileSpreadsheet, DollarSign, Clock, 
  TrendingUp, ArrowRight, Plus, CheckCircle, AlertCircle, XCircle 
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string, view?: 'list' | 'create' | 'view', docId?: string, docType?: any) => void;
  userRole: UserRole;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userRole }) => {
  const stats = db.getDashboardStats();
  
  // Format currency in Indian Rupees format (or generic $)
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Paid</span>;
      case 'partially_paid':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3.5 h-3.5 mr-1" /> Partial</span>;
      case 'unpaid':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Unpaid</span>;
      case 'overdue':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-300"><XCircle className="w-3.5 h-3.5 mr-1" /> Overdue</span>;
      
      // Job orders
      case 'completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Completed</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">In Progress</span>;
      case 'approved':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400">Approved</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400">Cancelled</span>;

      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400">{status}</span>;
    }
  };

  // SVG Chart Computations (Monthly Sales Bar Chart)
  const maxSales = Math.max(...stats.monthlySales.map(s => s.amount), 10000);
  const chartHeight = 160;
  const barWidth = 36;

  // SVG Chart Computations (Invoice Trends Area Chart)
  const maxTrend = Math.max(...stats.trends.flatMap(t => [t.invoices, t.quotations]), 5);
  const trendHeight = 160;
  const trendWidth = 420;
  const pointsInv = stats.trends.map((t, idx) => {
    const x = (idx / (stats.trends.length - 1 || 1)) * (trendWidth - 40) + 20;
    const y = trendHeight - (t.invoices / maxTrend) * (trendHeight - 40) - 20;
    return `${x},${y}`;
  }).join(' ');

  const pointsQt = stats.trends.map((t, idx) => {
    const x = (idx / (stats.trends.length - 1 || 1)) * (trendWidth - 40) + 20;
    const y = trendHeight - (t.quotations / maxTrend) * (trendHeight - 40) - 20;
    return `${x},${y}`;
  }).join(' ');

  // Calculate path definitions for SVG area and line rendering
  const generatePaths = (pointsStr: string) => {
    if (!pointsStr) return { line: '', area: '' };
    const coords = pointsStr.split(' ');
    if (coords.length === 0 || coords[0] === '') return { line: '', area: '' };
    const linePath = `M ${coords.join(' L ')}`;
    const firstCoord = coords[0];
    const lastCoord = coords[coords.length - 1];
    const firstX = firstCoord.split(',')[0];
    const lastX = lastCoord.split(',')[0];
    const areaPath = `M ${firstX},${trendHeight - 20} L ${coords.join(' L ')} L ${lastX},${trendHeight - 20} Z`;
    return { line: linePath, area: areaPath };
  };

  const invPaths = generatePaths(pointsInv);
  const qtPaths = generatePaths(pointsQt);

  const canCreate = userRole !== 'accountant';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 glass-card p-6 border border-black/5 dark:border-white/5">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-slate-800 dark:text-white">
            Workspace Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of company accounts, billables, Quotation conversions and active works.
          </p>
        </div>
        
        {canCreate && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate('documents', 'create', undefined, 'tax_invoice')}
              className="apple-btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" /> New Tax Invoice
            </button>
            <button
              onClick={() => onNavigate('documents', 'create', undefined, 'quotation')}
              className="apple-btn-secondary"
            >
              <Plus className="w-4 h-4 mr-2" /> New Quotation
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="glass-card p-5 border border-black/5 dark:border-white/5 flex items-center space-x-4">
          <div className="p-3 bg-[#007AFF]/10 text-[#007AFF] rounded-2xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue Collected</p>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5 font-mono">{formatCurrency(stats.monthlyRevenue)}</h3>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-5 border border-black/5 dark:border-white/5 flex items-center space-x-4">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</p>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5 font-mono">{formatCurrency(stats.pendingPayments)}</h3>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-5 border border-black/5 dark:border-white/5 flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoices Issued</p>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5 font-mono">{stats.totalInvoices}</h3>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card p-5 border border-black/5 dark:border-white/5 flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quotations Sent</p>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5 font-mono">{stats.totalQuotations}</h3>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="glass-card p-5 border border-black/5 dark:border-white/5 flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quote Conv. Rate</p>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5 font-mono">{stats.quotationConversionRate}%</h3>
          </div>
        </div>
      </div>

      {/* SVG Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales chart */}
        <div className="glass-card p-6 border border-black/5 dark:border-white/5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Revenue Collections Trend (Last 6 Months)</h4>
          <div className="flex justify-center items-end h-[180px] w-full pt-4">
            <div className="flex items-end space-x-6">
              {stats.monthlySales.map((s, idx) => {
                const height = (s.amount / maxSales) * chartHeight || 10;
                return (
                  <div key={idx} className="flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-sm text-white text-[10px] rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md pointer-events-none z-10 border border-white/10">
                      {formatCurrency(s.amount)}
                    </div>
                    {/* Bar */}
                    <div 
                      className="bg-gradient-to-t from-[#007AFF]/60 to-[#007AFF] dark:from-[#007AFF]/40 dark:to-[#0A84FF] rounded-t-lg transition-all duration-300 ease-out group-hover:from-[#007AFF] group-hover:to-[#0A84FF] shadow-[0_4px_12px_rgba(0,122,255,0.15)] group-hover:shadow-[0_4px_16px_rgba(0,122,255,0.3)]"
                      style={{ height: `${height}px`, width: `${barWidth}px` }}
                    />
                    {/* Label */}
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 mt-2 font-semibold font-sans">{s.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Invoice vs Quote trends */}
        <div className="glass-card p-6 border border-black/5 dark:border-white/5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Volume Trends (Quotes vs Invoices)</h4>
          <div className="relative h-[160px] w-full pt-4">
            <svg viewBox={`0 0 ${trendWidth} ${trendHeight}`} className="w-full h-full">
              {/* Gradients */}
              <defs>
                <linearGradient id="invGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#007AFF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#007AFF" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="qtGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF9500" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#FF9500" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="20" x2={trendWidth - 20} y2="20" stroke="currentColor" className="text-black/5 dark:text-white/5" strokeWidth="1" />
              <line x1="20" y1={trendHeight / 2} x2={trendWidth - 20} y2={trendHeight / 2} stroke="currentColor" className="text-black/5 dark:text-white/5" strokeWidth="1" />
              <line x1="20" y1={trendHeight - 20} x2={trendWidth - 20} y2={trendHeight - 20} stroke="currentColor" className="text-black/15 dark:text-white/10" strokeWidth="1.5" />

              {/* Quotations Area & Path */}
              {qtPaths.area && <path d={qtPaths.area} fill="url(#qtGradient)" />}
              {qtPaths.line && (
                <path
                  d={qtPaths.line}
                  fill="none"
                  stroke="#FF9500"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {stats.trends.map((t, idx) => {
                const x = (idx / (stats.trends.length - 1 || 1)) * (trendWidth - 40) + 20;
                const y = trendHeight - (t.quotations / maxTrend) * (trendHeight - 40) - 20;
                return (
                  <circle 
                    key={`q-${idx}`} 
                    cx={x} 
                    cy={y} 
                    r="4" 
                    fill="#FF9500" 
                    className="stroke-white dark:stroke-[#16161C] transition-all hover:r-5 cursor-pointer" 
                    strokeWidth="1.5" 
                  />
                );
              })}

              {/* Invoices Area & Path */}
              {invPaths.area && <path d={invPaths.area} fill="url(#invGradient)" />}
              {invPaths.line && (
                <path
                  d={invPaths.line}
                  fill="none"
                  stroke="#007AFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {stats.trends.map((t, idx) => {
                const x = (idx / (stats.trends.length - 1 || 1)) * (trendWidth - 40) + 20;
                const y = trendHeight - (t.invoices / maxTrend) * (trendHeight - 40) - 20;
                return (
                  <circle 
                    key={`i-${idx}`} 
                    cx={x} 
                    cy={y} 
                    r="4" 
                    fill="#007AFF" 
                    className="stroke-white dark:stroke-[#16161C] transition-all hover:r-5 cursor-pointer" 
                    strokeWidth="1.5" 
                  />
                );
              })}
            </svg>
          </div>
          {/* Legend */}
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF] inline-block"></span>
              <span>Invoices Issued</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF9500] inline-block"></span>
              <span>Quotations Sent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="glass-card border border-black/5 dark:border-white/5 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-5 border-b border-black/5 dark:border-white/5">
          <h4 className="text-base font-extrabold text-slate-800 dark:text-white">Recent Documents</h4>
          <button 
            onClick={() => onNavigate('documents')}
            className="text-xs font-bold text-[#007AFF] hover:text-[#005cb8] inline-flex items-center transition-all"
          >
            View All Documents <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="divide-y divide-black/5 dark:divide-white/5">
          {stats.recentDocs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500">
              No recent documents created. Click above to create one.
            </div>
          ) : (
            stats.recentDocs.map((doc: BusinessDocument) => (
              <div key={doc.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-150">
                <div className="flex items-start space-x-4">
                  <div className={`p-2.5 rounded-2xl ${
                    doc.docType.includes('invoice') 
                      ? 'bg-[#007AFF]/10 text-[#007AFF]' 
                      : doc.docType === 'quotation' 
                      ? 'bg-amber-500/10 text-amber-500' 
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {doc.docType.includes('invoice') ? (
                      <FileSpreadsheet className="w-5 h-5" />
                    ) : doc.docType === 'quotation' ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <Briefcase className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 dark:text-white font-mono">{doc.docNumber}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">({doc.date})</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{doc.customerName}</p>
                    <span className="inline-block text-[9px] bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mt-1.5">
                      {doc.docType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-6">
                  <div className="text-right">
                    <span className="text-base font-bold text-slate-800 dark:text-white font-mono">
                      {formatCurrency(doc.grandTotal)}
                    </span>
                    <div className="mt-1 flex justify-end">
                      {getStatusBadge(doc.paymentStatus || doc.jobStatus)}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => onNavigate('documents', 'view', doc.id)}
                    className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-[#007AFF] transition-all"
                    title="View Document"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
