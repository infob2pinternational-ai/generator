import React, { useState } from 'react';
import { db } from '../services/db';
import type { Customer, UserRole } from '../types';
import { Plus, Search, User, Trash2, Edit2, X } from 'lucide-react';

interface CustomerManagerProps {
  userRole: UserRole;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({ userRole }) => {
  const [customers, setCustomers] = useState<Customer[]>(db.getCustomers());
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  const canEdit = userRole !== 'accountant';

  const handleEdit = (cust: Customer) => {
    if (!canEdit) return;
    setCurrentCustomer({ ...cust });
    setIsEditing(true);
  };

  const handleCreate = () => {
    if (!canEdit) return;
    setCurrentCustomer({
      id: `cust-${Date.now()}`,
      name: '',
      companyName: '',
      address: '',
      phone: '',
      email: '',
      gstNumber: '',
      notes: '',
      createdAt: new Date().toISOString()
    });
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (userRole !== 'admin') {
      alert('Only admins can delete customers.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this customer? This will remove them from the directory.')) {
      db.deleteCustomer(id);
      setCustomers(db.getCustomers());
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCustomer) {
      db.saveCustomer(currentCustomer);
      setCustomers(db.getCustomers());
      setIsEditing(false);
      setCurrentCustomer(null);
    }
  };

  // Filter clients based on query
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.companyName || '').toLowerCase().includes(q) ||
      (c.gstNumber || '').toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 glass-card p-6 border border-black/5 dark:border-white/5">
        <div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center">
            <User className="w-6 h-6 mr-2.5 text-[#007AFF]" />
            Customer Directory
          </h2>
          <p className="text-sm text-slate-450 mt-1">
            Store and manage billing addresses, company contacts, and GST credentials.
          </p>
        </div>

        {canEdit && !isEditing && (
          <button
            onClick={handleCreate}
            className="apple-btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Customer
          </button>
        )}
      </div>

      {isEditing && currentCustomer ? (
        /* Edit / Create Form */
        <form onSubmit={handleSave} className="glass-card border border-black/5 dark:border-white/5 overflow-hidden transition-all duration-300">
          <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex justify-between items-center">
            <h3 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-white">
              {currentCustomer.name ? `Edit Customer: ${currentCustomer.name}` : 'Add New Customer'}
            </h3>
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setCurrentCustomer(null); }}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Full Name *</label>
              <input 
                type="text" required
                value={currentCustomer.name}
                onChange={e => setCurrentCustomer({ ...currentCustomer, name: e.target.value })}
                placeholder="John Doe"
                className="apple-input w-full font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Company Name</label>
              <input 
                type="text"
                value={currentCustomer.companyName || ''}
                onChange={e => setCurrentCustomer({ ...currentCustomer, companyName: e.target.value })}
                placeholder="Acme Corporates Ltd"
                className="apple-input w-full font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address *</label>
              <input 
                type="email" required
                value={currentCustomer.email}
                onChange={e => setCurrentCustomer({ ...currentCustomer, email: e.target.value })}
                placeholder="contact@acme.com"
                className="apple-input w-full font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number *</label>
              <input 
                type="text" required
                value={currentCustomer.phone}
                onChange={e => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })}
                placeholder="+91 99887 76655"
                className="apple-input w-full font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">GSTIN (Optional)</label>
              <input 
                type="text"
                value={currentCustomer.gstNumber || ''}
                onChange={e => setCurrentCustomer({ ...currentCustomer, gstNumber: e.target.value.toUpperCase() })}
                placeholder="27ACME1234A1Z5"
                className="apple-input w-full font-mono font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Address *</label>
              <textarea required rows={2}
                value={currentCustomer.address}
                onChange={e => setCurrentCustomer({ ...currentCustomer, address: e.target.value })}
                placeholder="Floor 4, Block C, Commerce Towers, Mumbai, MH"
                className="apple-input w-full resize-none h-20 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</label>
              <textarea rows={2}
                value={currentCustomer.notes || ''}
                onChange={e => setCurrentCustomer({ ...currentCustomer, notes: e.target.value })}
                placeholder="Any remarks..."
                className="apple-input w-full resize-none h-20 font-medium"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setCurrentCustomer(null); }}
              className="apple-btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="apple-btn-primary"
            >
              Save Customer Details
            </button>
          </div>
        </form>
      ) : (
        /* Customers List Screen */
        <div className="space-y-4">
          {/* Search bar */}
          <div className="glass-card p-4 border border-black/5 dark:border-white/5 flex items-center shadow-sm">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by client name, email, company, phone, GSTIN..."
              className="w-full bg-transparent border-none text-xs focus:outline-none dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-2 glass-card p-8 text-center text-slate-450">
                No customers found matching your search.
              </div>
            ) : (
              filteredCustomers.map(cust => (
                <div key={cust.id} className="glass-card p-5 border border-black/5 dark:border-white/5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">{cust.name}</h3>
                        {cust.companyName && (
                          <p className="text-xs text-[#007AFF] font-bold mt-0.5">{cust.companyName}</p>
                        )}
                      </div>
                      
                      {cust.gstNumber ? (
                        <span className="text-[9px] font-mono font-bold bg-green-500/10 text-green-650 dark:text-green-400 px-2 py-0.5 rounded uppercase tracking-wider">
                          GST: {cust.gstNumber}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-black/5 dark:bg-white/5 text-slate-450 dark:text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider">
                          Non-Registered
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-450">
                      <p className="flex items-start">
                        <span className="font-bold w-14 uppercase tracking-wider text-[8px] mt-0.5">Address:</span>
                        <span className="flex-1 text-slate-700 dark:text-slate-300 font-medium">{cust.address}</span>
                      </p>
                      <p className="flex items-center">
                        <span className="font-bold w-14 uppercase tracking-wider text-[8px]">Phone:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{cust.phone}</span>
                      </p>
                      <p className="flex items-center">
                        <span className="font-bold w-14 uppercase tracking-wider text-[8px]">Email:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">{cust.email}</span>
                      </p>
                    </div>

                    {cust.notes && (
                      <div className="mt-3.5 p-2.5 bg-black/[0.015] dark:bg-white/[0.015] border border-black/5 dark:border-white/5 rounded-xl text-[10px] text-slate-400 italic">
                        Note: {cust.notes}
                      </div>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex justify-end space-x-1.5 border-t border-black/5 dark:border-white/5 pt-3 mt-4">
                      {userRole === 'admin' && (
                        <button 
                          onClick={() => handleDelete(cust.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Delete client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(cust)}
                        className="px-3.5 py-1.5 text-xs font-bold text-[#007AFF] hover:bg-[#007AFF]/15 rounded-xl transition-all flex items-center"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Client
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
