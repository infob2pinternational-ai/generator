import { 
  type Company, type Customer, type ProductService, type Letterhead, type DocumentTemplate, 
  type BusinessDocument, type DashboardStats, type DocumentType
} from '../types';

// Storage keys
const KEYS = {
  COMPANIES: 'bdm_companies',
  CUSTOMERS: 'bdm_customers',
  PRODUCTS: 'bdm_products',
  LETTERHEADS: 'bdm_letterheads',
  TEMPLATES: 'bdm_templates',
  DOCUMENTS: 'bdm_documents',
  ACTIVE_ROLE: 'bdm_active_role'
};

// Initial Mock Data Seeds
const DEFAULT_COMPANIES: Company[] = [];
const DEFAULT_CUSTOMERS: Customer[] = [];
const DEFAULT_PRODUCTS: ProductService[] = [];
const DEFAULT_LETTERHEADS: Letterhead[] = [];

const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'temp-modern',
    name: 'Modern Accent Template',
    companyId: 'all',
    theme: 'modern',
    primaryColor: '#2563eb', // Blue
    fontFamily: 'Outfit',
    logoPosition: 'left',
    showHeader: true,
    showFooter: true,
    showWatermark: true,
    watermarkText: 'OFFICIAL DOCUMENT',
    showBankDetails: true,
    showSignatureArea: true,
    showSealArea: true,
    tableStyle: 'striped',
    isDefault: true
  },
  {
    id: 'temp-corporate',
    name: 'Corporate Royal Template',
    companyId: 'all',
    theme: 'corporate',
    primaryColor: '#1e3a8a', // Dark Blue
    fontFamily: 'Inter',
    logoPosition: 'right',
    showHeader: true,
    showFooter: true,
    showWatermark: false,
    watermarkText: 'COPY',
    showBankDetails: true,
    showSignatureArea: true,
    showSealArea: true,
    tableStyle: 'grid',
    isDefault: false
  },
  {
    id: 'temp-minimal',
    name: 'Minimalist Slate Template',
    companyId: 'all',
    theme: 'minimal',
    primaryColor: '#475569', // Slate
    fontFamily: 'Inter',
    logoPosition: 'left',
    showHeader: false,
    showFooter: true,
    showWatermark: false,
    watermarkText: 'CONFIDENTIAL',
    showBankDetails: true,
    showSignatureArea: true,
    showSealArea: false,
    tableStyle: 'minimalist',
    isDefault: false
  },
  {
    id: 'temp-b2p',
    name: 'B2P International Premium Template',
    companyId: 'all',
    theme: 'b2p',
    primaryColor: '#f15a24', // Orange
    fontFamily: 'Inter',
    logoPosition: 'left',
    showHeader: true,
    showFooter: true,
    showWatermark: false,
    watermarkText: '',
    showBankDetails: true,
    showSignatureArea: true,
    showSealArea: true,
    tableStyle: 'grid',
    isDefault: false
  }
];

// Generates correct individual CGST/SGST/IGST breakdown based on states
function calculateItemsTotals(items: any[], isTaxInvoice: boolean, companyStateCode: string, customerStateCode?: string) {
  let subTotal = 0;
  let taxTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let discountTotal = 0;

  const processedItems = items.map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const daysMultiplier = (item.days !== undefined && item.days !== null && Number(item.days) > 0) ? Number(item.days) : 1;
    const rate = Number(item.rate) || 0;
    const discPercent = Number(item.discountPercentage) || 0;
    const baseValue = qty * daysMultiplier * rate;
    const discountAmt = baseValue * (discPercent / 100);
    const taxableValue = baseValue - discountAmt;
    
    let cgstRate = 0;
    let cgstAmt = 0;
    let sgstRate = 0;
    let sgstAmt = 0;
    let igstRate = 0;
    let igstAmt = 0;
    const gstPct = Number(item.gstPercentage) || 0;

    if (isTaxInvoice && gstPct > 0) {
      if (!customerStateCode || companyStateCode === customerStateCode) {
        // Local: CGST & SGST
        cgstRate = gstPct / 2;
        cgstAmt = taxableValue * (cgstRate / 100);
        sgstRate = gstPct / 2;
        sgstAmt = taxableValue * (sgstRate / 100);
      } else {
        // Out of State: IGST
        igstRate = gstPct;
        igstAmt = taxableValue * (igstRate / 100);
      }
    }

    const itemTotal = taxableValue + cgstAmt + sgstAmt + igstAmt;

    subTotal += baseValue;
    discountTotal += discountAmt;
    cgstTotal += cgstAmt;
    sgstTotal += sgstAmt;
    igstTotal += igstAmt;
    taxTotal += (cgstAmt + sgstAmt + igstAmt);

    return {
      id: item.id || `item-${idx}-${Date.now()}`,
      productId: item.productId,
      name: item.name,
      description: item.description || '',
      unit: item.unit || 'Pcs',
      hsnCode: item.hsnCode || '',
      quantity: qty,
      days: item.days,
      rate: rate,
      discountPercentage: discPercent,
      gstPercentage: gstPct,
      cgstRate,
      cgstAmount: Math.round(cgstAmt * 100) / 100,
      sgstRate,
      sgstAmount: Math.round(sgstAmt * 100) / 100,
      igstRate,
      igstAmount: Math.round(igstAmt * 100) / 100,
      totalAmount: Math.round(itemTotal * 100) / 100
    };
  });

  return {
    processedItems,
    subTotal: Math.round(subTotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    cgstTotal: Math.round(cgstTotal * 100) / 100,
    sgstTotal: Math.round(sgstTotal * 100) / 100,
    igstTotal: Math.round(igstTotal * 100) / 100,
    grandTotal: Math.round((subTotal - discountTotal + taxTotal) * 100) / 100
  };
}

// Generate Default Invoices spanning March, April, May, June 2026 for graph visualization
function getSeededDocuments(): BusinessDocument[] {
  return [];
}

export const initializeDB = () => {
  // Wipe out old seeds when upgrading db version to v2 (clean slate)
  if (localStorage.getItem('bdm_db_version') !== 'v2') {
    localStorage.removeItem(KEYS.COMPANIES);
    localStorage.removeItem(KEYS.CUSTOMERS);
    localStorage.removeItem(KEYS.PRODUCTS);
    localStorage.removeItem(KEYS.LETTERHEADS);
    localStorage.removeItem(KEYS.TEMPLATES);
    localStorage.removeItem(KEYS.DOCUMENTS);
    localStorage.setItem('bdm_db_version', 'v2');
  }

  if (!localStorage.getItem(KEYS.COMPANIES)) {
    localStorage.setItem(KEYS.COMPANIES, JSON.stringify(DEFAULT_COMPANIES));
  }

  if (!localStorage.getItem(KEYS.CUSTOMERS)) {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
  }

  if (!localStorage.getItem(KEYS.PRODUCTS)) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
  }

  if (!localStorage.getItem(KEYS.LETTERHEADS)) {
    localStorage.setItem(KEYS.LETTERHEADS, JSON.stringify(DEFAULT_LETTERHEADS));
  }

  if (!localStorage.getItem(KEYS.TEMPLATES)) {
    localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
  }

  if (!localStorage.getItem(KEYS.DOCUMENTS)) {
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(getSeededDocuments()));
  }

  if (!localStorage.getItem(KEYS.ACTIVE_ROLE)) {
    localStorage.setItem(KEYS.ACTIVE_ROLE, 'admin');
  }
};

// Generic read/write helpers
function readData<T>(key: string): T[] {
  initializeDB();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeData<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Company DB Accessors
export const db = {
  // Companies
  getCompanies: (): Company[] => readData<Company>(KEYS.COMPANIES),
  saveCompany: (company: Company): Company => {
    const list = db.getCompanies();
    const index = list.findIndex(c => c.id === company.id);
    if (index >= 0) {
      list[index] = { ...company };
    } else {
      list.push(company);
    }
    writeData(KEYS.COMPANIES, list);
    return company;
  },
  deleteCompany: (id: string) => {
    const list = db.getCompanies().filter(c => c.id !== id);
    writeData(KEYS.COMPANIES, list);
  },

  // Customers
  getCustomers: (): Customer[] => readData<Customer>(KEYS.CUSTOMERS),
  saveCustomer: (customer: Customer): Customer => {
    const list = db.getCustomers();
    const index = list.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      list[index] = { ...customer };
    } else {
      list.push(customer);
    }
    writeData(KEYS.CUSTOMERS, list);
    return customer;
  },
  deleteCustomer: (id: string) => {
    const list = db.getCustomers().filter(c => c.id !== id);
    writeData(KEYS.CUSTOMERS, list);
  },

  // Products
  getProducts: (): ProductService[] => readData<ProductService>(KEYS.PRODUCTS),
  saveProduct: (product: ProductService): ProductService => {
    const list = db.getProducts();
    const index = list.findIndex(p => p.id === product.id);
    if (index >= 0) {
      list[index] = { ...product };
    } else {
      list.push(product);
    }
    writeData(KEYS.PRODUCTS, list);
    return product;
  },
  deleteProduct: (id: string) => {
    const list = db.getProducts().filter(p => p.id !== id);
    writeData(KEYS.PRODUCTS, list);
  },

  // Letterheads
  getLetterheads: (): Letterhead[] => readData<Letterhead>(KEYS.LETTERHEADS),
  saveLetterhead: (lh: Letterhead): Letterhead => {
    const list = db.getLetterheads();
    const index = list.findIndex(l => l.id === lh.id);
    if (index >= 0) {
      list[index] = { ...lh };
    } else {
      list.push(lh);
    }
    writeData(KEYS.LETTERHEADS, list);
    return lh;
  },
  deleteLetterhead: (id: string) => {
    const list = db.getLetterheads().filter(l => l.id !== id);
    writeData(KEYS.LETTERHEADS, list);
  },

  // Templates
  getTemplates: (): DocumentTemplate[] => readData<DocumentTemplate>(KEYS.TEMPLATES),
  saveTemplate: (template: DocumentTemplate): DocumentTemplate => {
    const list = db.getTemplates();
    // If setting default, unset other templates for that company / all
    if (template.isDefault) {
      list.forEach(t => {
        if (t.companyId === template.companyId) {
          t.isDefault = false;
        }
      });
    }
    const index = list.findIndex(t => t.id === template.id);
    if (index >= 0) {
      list[index] = { ...template };
    } else {
      list.push(template);
    }
    writeData(KEYS.TEMPLATES, list);
    return template;
  },
  deleteTemplate: (id: string) => {
    const list = db.getTemplates().filter(t => t.id !== id);
    writeData(KEYS.TEMPLATES, list);
  },

  // Documents
  getDocuments: (): BusinessDocument[] => readData<BusinessDocument>(KEYS.DOCUMENTS),
  getDocumentById: (id: string): BusinessDocument | undefined => {
    return db.getDocuments().find(d => d.id === id);
  },
  saveDocument: (doc: BusinessDocument): BusinessDocument => {
    const list = db.getDocuments();
    const index = list.findIndex(d => d.id === doc.id);
    
    // Auto-calculate numbers on first save if needed
    if (!doc.docNumber || doc.docNumber === 'AUTO') {
      doc.docNumber = generateNextDocNumber(doc.companyId, doc.docType);
    }
    
    if (index >= 0) {
      list[index] = { ...doc, updatedAt: new Date().toISOString() };
    } else {
      list.push({
        ...doc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    writeData(KEYS.DOCUMENTS, list);
    return doc;
  },
  deleteDocument: (id: string) => {
    const list = db.getDocuments().filter(d => d.id !== id);
    writeData(KEYS.DOCUMENTS, list);
  },

  // Calculations
  recalculateDocument: (items: any[], isTaxInvoice: boolean, companyStateCode: string, customerStateCode?: string) => {
    return calculateItemsTotals(items, isTaxInvoice, companyStateCode, customerStateCode);
  },

  // Active Role Simulation (Simulate Admin, Staff, Accountant views)
  getActiveRole: (): 'admin' | 'staff' | 'accountant' => {
    return (localStorage.getItem(KEYS.ACTIVE_ROLE) as any) || 'admin';
  },
  setActiveRole: (role: 'admin' | 'staff' | 'accountant') => {
    localStorage.setItem(KEYS.ACTIVE_ROLE, role);
  },

  // Backup & Restore
  exportBackup: (): string => {
    initializeDB();
    const backup: Record<string, any> = {};
    Object.values(KEYS).forEach(key => {
      const val = localStorage.getItem(key);
      if (val) backup[key] = JSON.parse(val);
    });
    return JSON.stringify(backup, null, 2);
  },
  importBackup: (jsonString: string): boolean => {
    try {
      const backup = JSON.parse(jsonString);
      Object.keys(backup).forEach(key => {
        if (Object.values(KEYS).includes(key)) {
          localStorage.setItem(key, JSON.stringify(backup[key]));
        }
      });
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  // Dashboard Aggregates
  getDashboardStats: (): DashboardStats & { 
    monthlySales: { month: string; amount: number }[];
    trends: { month: string; invoices: number; quotations: number }[];
    recentDocs: BusinessDocument[];
  } => {
    const docs = db.getDocuments();
    
    const invoices = docs.filter(d => d.docType === 'invoice' || d.docType === 'tax_invoice');
    const quotations = docs.filter(d => d.docType === 'quotation');
    const jobOrders = docs.filter(d => d.docType === 'job_order');

    // Revenue calculations
    const monthlyRevenue = invoices
      .filter(inv => inv.paymentStatus === 'paid' || inv.paymentStatus === 'partially_paid')
      .reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

    const pendingPayments = invoices
      .filter(inv => inv.paymentStatus === 'unpaid' || inv.paymentStatus === 'partially_paid' || inv.paymentStatus === 'overdue')
      .reduce((sum, inv) => sum + (inv.grandTotal - (inv.amountPaid || 0)), 0);

    // Conversion rate
    const convertedQuotations = quotations.filter(q => q.convertedToInvoiceId !== undefined).length;
    const quotationConversionRate = quotations.length > 0 
      ? Math.round((convertedQuotations / quotations.length) * 100)
      : 0;

    // Monthly aggregation for graphs (Last 6 Months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Seed standard structure for charts
    const monthlySalesMap: Record<string, number> = {};
    const monthlyDocsMap: Record<string, { invoices: number; quotations: number }> = {};
    
    // Last 6 months range setup
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
      monthlySalesMap[mLabel] = 0;
      monthlyDocsMap[mLabel] = { invoices: 0, quotations: 0 };
    }

    // Populate actuals
    docs.forEach(doc => {
      const docDate = new Date(doc.date);
      const mLabel = `${months[docDate.getMonth()]} ${docDate.getFullYear().toString().substr(-2)}`;
      
      // If it matches our range keys
      if (monthlySalesMap[mLabel] !== undefined) {
        if (doc.docType === 'invoice' || doc.docType === 'tax_invoice') {
          if (doc.paymentStatus === 'paid' || doc.paymentStatus === 'partially_paid') {
            monthlySalesMap[mLabel] += doc.amountPaid || 0;
          }
          monthlyDocsMap[mLabel].invoices += 1;
        } else if (doc.docType === 'quotation') {
          monthlyDocsMap[mLabel].quotations += 1;
        }
      }
    });

    const monthlySales = Object.entries(monthlySalesMap).map(([month, amount]) => ({
      month,
      amount: Math.round(amount)
    }));

    const trends = Object.entries(monthlyDocsMap).map(([month, counts]) => ({
      month,
      invoices: counts.invoices,
      quotations: counts.quotations
    }));

    // Sort recent documents
    const recentDocs = [...docs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      totalQuotations: quotations.length,
      totalJobOrders: jobOrders.length,
      totalInvoices: invoices.length,
      monthlyRevenue: Math.round(monthlyRevenue),
      pendingPayments: Math.round(pendingPayments),
      quotationConversionRate,
      monthlySales,
      trends,
      recentDocs
    };
  }
};

// Generates next incremental doc number based on Company rules
// e.g., Company A (comp-1): INV-2026-001
//       Company B (comp-2): INV-B-2026-001
export function generateNextDocNumber(companyId: string, docType: DocumentType): string {
  const docs = db.getDocuments();
  const year = new Date().getFullYear();
  
  // Filter documents of matching company and docType
  const companyDocs = docs.filter(d => d.companyId === companyId && (d.docType as string) === (docType as string));

  let prefix = '';
  let companySuffix = '';
  
  const typeStr = docType as string;
  if (typeStr === 'invoice' || typeStr === 'tax_invoice') {
    prefix = 'INV';
  } else if (typeStr === 'quotation') {
    prefix = 'QT';
  } else if (typeStr === 'job_order') {
    prefix = 'JO';
  }

  // Company specific formats
  if (companyId === 'comp-2') {
    companySuffix = '-B';
  }

  // Auto-increment matching pattern
  // Pattern: ${PREFIX}${companySuffix}-${YEAR}-XXX
  // Let's count current ones in that pattern and increment
  let lastNum = 0;
  const matchRegex = new RegExp(`^${prefix}${companySuffix}-${year}-(\\d+)$`);
  
  companyDocs.forEach(d => {
    const match = d.docNumber.match(matchRegex);
    if (match) {
      const num = parseInt(match[1]);
      if (num > lastNum) lastNum = num;
    }
  });

  const nextNum = lastNum + 1;
  const padding = String(nextNum).padStart(3, '0');
  return `${prefix}${companySuffix}-${year}-${padding}`;
}

