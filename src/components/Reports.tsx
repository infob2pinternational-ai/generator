import React, { useState } from 'react';
import { db } from '../services/db';
import type { Company } from '../types';
import { FileSpreadsheet, Download, DollarSign, ArrowRight } from 'lucide-react';

interface ReportsProps {
  onNavigate: (tab: string, view?: 'list' | 'create' | 'view', docId?: string) => void;
}

export const Reports: React.FC<ReportsProps> = ({ onNavigate }) => {
  const [activeReport, setActiveReport] = useState<'outstanding' | 'gst'>('outstanding');
  const [companies] = useState<Company[]>(db.getCompanies());
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  
  const documents = db.getDocuments();
  
  // Filter by company if selected
  const filteredDocs = documents.filter(d => {
    if (selectedCompanyId === 'all') return true;
    return d.companyId === selectedCompanyId;
  });

  // 1. Outstanding Payments filter
  const outstandingInvoices = filteredDocs.filter(d => 
    (d.docType === 'invoice' || d.docType === 'tax_invoice') && 
    d.paymentStatus !== 'paid'
  );

  const totalOutstandingAmount = outstandingInvoices.reduce((sum, inv) => 
    sum + (inv.grandTotal - (inv.amountPaid || 0)), 0
  );

  // 2. GST Report filters (Only Tax Invoices with GST)
  const gstInvoices = filteredDocs.filter(d => 
    d.docType === 'tax_invoice' && 
    d.taxTotal > 0
  );

  const totalCGST = gstInvoices.reduce((sum, inv) => sum + (inv.cgstTotal || 0), 0);
  const totalSGST = gstInvoices.reduce((sum, inv) => sum + (inv.sgstTotal || 0), 0);
  const totalIGST = gstInvoices.reduce((sum, inv) => sum + (inv.igstTotal || 0), 0);
  const totalTaxable = gstInvoices.reduce((sum, inv) => sum + (inv.subTotal - (inv.discountTotal || 0)), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };


  // CSV Exporter Utility
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (activeReport === 'outstanding') {
      csvContent += 'Invoice Number,Date,Due Date,Customer,Grand Total,Amount Paid,Amount Outstanding,Status\r\n';
      outstandingInvoices.forEach(inv => {
        const balance = inv.grandTotal - (inv.amountPaid || 0);
        csvContent += `"${inv.docNumber}","${inv.date}","${inv.dueDate || ''}","${inv.customerName.replace(/"/g, '""')}","${inv.grandTotal}","${inv.amountPaid || 0}","${balance}","${inv.paymentStatus}"\r\n`;
      });
    } else {
      csvContent += 'Invoice Number,Date,Customer,GSTIN,Taxable Value,CGST,SGST,IGST,Total GST,Invoice Total\r\n';
      gstInvoices.forEach(inv => {
        const taxable = inv.subTotal - (inv.discountTotal || 0);
        const gst = inv.cgstTotal + inv.sgstTotal + inv.igstTotal;
        csvContent += `"${inv.docNumber}","${inv.date}","${inv.customerName.replace(/"/g, '""')}","${inv.customerDetails.gstNumber || 'N/A'}","${taxable}","${inv.cgstTotal || 0}","${inv.sgstTotal || 0}","${inv.igstTotal || 0}","${gst}","${inv.grandTotal}"\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white flex items-center">
            <FileSpreadsheet className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            Tax & Ledger Reports
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track GST collections, monitor account balances, and download CSV reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {/* Company Filter */}
          <select
            value={selectedCompanyId}
            onChange={e => setSelectedCompanyId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2 text-sm focus:outline-none dark:text-white font-medium"
          >
            <option value="all">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Download className="w-4 h-4 mr-2" /> Export Excel (CSV)
          </button>
        </div>
      </div>

      {/* Selector tab switch */}
      <div className="flex space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveReport('outstanding')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
            activeReport === 'outstanding' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          Outstanding Payments Ledger
        </button>
        <button
          onClick={() => setActiveReport('gst')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
            activeReport === 'gst' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          GST Sales & Tax Summary
        </button>
      </div>

      {activeReport === 'outstanding' ? (
        /* Report 1: Outstanding Ledger */
        <div className="space-y-6">
          {/* KPI banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-100 uppercase tracking-widest">Aggregate Accounts Receivable</span>
              <h3 className="text-3xl font-extrabold font-mono mt-1">{formatCurrency(totalOutstandingAmount)}</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl">
              <DollarSign className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                    <th className="px-6 py-4">Invoice No</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4 text-right">Net Amount</th>
                    <th className="px-6 py-4 text-right">Paid Amount</th>
                    <th className="px-6 py-4 text-right text-red-600 dark:text-red-400">Balance Due</th>
                    <th className="px-6 py-4 text-center">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {outstandingInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                        Zero outstanding balances! All invoices are fully paid.
                      </td>
                    </tr>
                  ) : (
                    outstandingInvoices.map(inv => {
                      const balance = inv.grandTotal - (inv.amountPaid || 0);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="px-6 py-4 font-bold font-mono text-slate-800 dark:text-white">{inv.docNumber}</td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{inv.customerName}</span>
                          </td>
                          <td className="px-6 py-4 font-medium text-red-650">{inv.dueDate || 'N/A'}</td>
                          <td className="px-6 py-4 text-right font-mono font-medium">{formatCurrency(inv.grandTotal)}</td>
                          <td className="px-6 py-4 text-right font-mono font-medium text-green-600">{formatCurrency(inv.amountPaid || 0)}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-red-600 dark:text-red-400">{formatCurrency(balance)}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => onNavigate('documents', 'view', inv.id)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-450 hover:text-slate-700 transition-all"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
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
      ) : (
        /* Report 2: GST Sales Table */
        <div className="space-y-6">
          {/* GST KPI cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taxable Sales</span>
              <h4 className="text-xl font-bold font-mono text-slate-800 dark:text-white mt-1">{formatCurrency(totalTaxable)}</h4>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CGST Collected</span>
              <h4 className="text-xl font-bold font-mono text-slate-800 dark:text-white mt-1">{formatCurrency(totalCGST)}</h4>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SGST Collected</span>
              <h4 className="text-xl font-bold font-mono text-slate-800 dark:text-white mt-1">{formatCurrency(totalSGST)}</h4>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IGST Collected</span>
              <h4 className="text-xl font-bold font-mono text-slate-800 dark:text-white mt-1">{formatCurrency(totalIGST)}</h4>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                    <th className="px-6 py-4">Invoice No</th>
                    <th className="px-6 py-4">Client Details</th>
                    <th className="px-6 py-4">Taxable Value</th>
                    <th className="px-6 py-4 text-right">CGST</th>
                    <th className="px-6 py-4 text-right">SGST</th>
                    <th className="px-6 py-4 text-right">IGST</th>
                    <th className="px-6 py-4 text-right">Tax Collected</th>
                    <th className="px-6 py-4 text-right font-bold">Total Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 font-mono text-xs">
                  {gstInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-sm font-sans text-slate-400 dark:text-slate-500">
                        No GST invoices filed for this company.
                      </td>
                    </tr>
                  ) : (
                    gstInvoices.map(inv => {
                      const taxableVal = inv.subTotal - (inv.discountTotal || 0);
                      const gstTotal = inv.cgstTotal + inv.sgstTotal + inv.igstTotal;
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors text-slate-650 dark:text-slate-350">
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-white font-sans text-sm">{inv.docNumber}</td>
                          <td className="px-6 py-4 font-sans text-sm">
                            <span className="font-semibold text-slate-850 dark:text-slate-200 block">{inv.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{inv.customerDetails.gstNumber || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 text-right">{formatCurrency(taxableVal)}</td>
                          <td className="px-6 py-4 text-right text-slate-500">{formatCurrency(inv.cgstTotal || 0)}</td>
                          <td className="px-6 py-4 text-right text-slate-500">{formatCurrency(inv.sgstTotal || 0)}</td>
                          <td className="px-6 py-4 text-right text-slate-500">{formatCurrency(inv.igstTotal || 0)}</td>
                          <td className="px-6 py-4 text-right text-slate-800 dark:text-slate-250 font-bold">{formatCurrency(gstTotal)}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(inv.grandTotal)}</td>
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

    </div>
  );
};
