export type UserRole = 'admin' | 'staff' | 'accountant';

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountName: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gstNumber: string;
  panNumber: string;
  bankDetails: BankDetails;
  logoUrl?: string; // Base64 or standard URL
  authorizedSignatureUrl?: string; // Base64 or standard URL
  companySealUrl?: string; // Base64 or standard URL
  headerImageUrl?: string; // Base64 custom header letterhead image
  footerImageUrl?: string; // Base64 custom footer letterhead image
  createdAt: string;
}

export interface Letterhead {
  id: string;
  name: string;
  companyId: string;
  headerImageUrl?: string;
  footerImageUrl?: string;
  watermarkText?: string;
  signatureUrl?: string;
  sealUrl?: string;
  showHeader: boolean;
  showFooter: boolean;
  showWatermark: boolean;
}

export type TemplateTheme = 'modern' | 'corporate' | 'minimal' | 'traditional' | 'b2p';

export interface DocumentTemplate {
  id: string;
  name: string;
  companyId: string; // 'all' or specific company
  theme: TemplateTheme;
  primaryColor: string; // Hex color code
  fontFamily: string;
  logoPosition: 'left' | 'center' | 'right';
  showHeader: boolean;
  showFooter: boolean;
  showWatermark: boolean;
  watermarkText: string;
  showBankDetails: boolean;
  showSignatureArea: boolean;
  showSealArea: boolean;
  tableStyle: 'striped' | 'grid' | 'minimalist';
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  address: string;
  phone: string;
  email: string;
  gstNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface ProductService {
  id: string;
  name: string;
  description: string;
  unit: string; // e.g. Pcs, Hrs, Mtr, Box
  hsnCode: string; // HSN or SAC code
  gstPercentage: number; // e.g., 0, 5, 12, 18, 28
  sellingPrice: number;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  productId?: string;
  name: string;
  description: string;
  unit: string;
  hsnCode: string;
  quantity: number;
  days?: number;
  rate: number;
  discountPercentage: number; // item level discount
  gstPercentage: number;
  cgstRate: number; // cgst% (usually gstPercentage / 2)
  cgstAmount: number;
  sgstRate: number; // sgst% (usually gstPercentage / 2)
  sgstAmount: number;
  igstRate: number; // igst% (usually gstPercentage if out of state, else 0)
  igstAmount: number;
  totalAmount: number; // quantity * rate - discount + taxes
}

export type DocumentType = 'quotation' | 'job_order' | 'invoice' | 'tax_invoice';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
export type JobOrderStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

export interface BusinessDocument {
  id: string;
  docType: DocumentType;
  docNumber: string;
  date: string;
  companyId: string;
  letterheadId?: string;
  templateId?: string;
  customerId: string;
  customerName: string; // stored for quick display
  customerDetails: Customer; // snapshot of customer details at print time
  items: DocumentItem[];
  
  // Financial Summary
  subTotal: number;
  discountTotal: number;
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  
  // Terms and conditions
  termsAndConditions?: string;
  notes?: string;
  
  // Invoice Specific
  paymentTerms?: string;
  paymentStatus?: PaymentStatus;
  amountPaid?: number;
  dueDate?: string;
  
  // Quotation Specific
  validityDate?: string;
  convertedToInvoiceId?: string;
  
  // Job Order Specific
  projectName?: string;
  workDescription?: string;
  startDate?: string;
  endDate?: string;
  assignedStaff?: string;
  materialsRequired?: string;
  jobStatus?: JobOrderStatus;
  convertedToInvoice?: boolean;
  
  // Metadata
  createdBy: string; // username / role
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalQuotations: number;
  totalJobOrders: number;
  totalInvoices: number;
  monthlyRevenue: number;
  pendingPayments: number;
  quotationConversionRate: number;
}
