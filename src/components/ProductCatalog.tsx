import React, { useState } from 'react';
import { db } from '../services/db';
import type { ProductService, UserRole } from '../types';
import { Plus, Search, Tag, Trash2, Edit2, X } from 'lucide-react';


interface ProductCatalogProps {
  userRole: UserRole;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ userRole }) => {
  const [products, setProducts] = useState<ProductService[]>(db.getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductService | null>(null);

  const canEdit = userRole !== 'accountant';

  const handleEdit = (prod: ProductService) => {
    if (!canEdit) return;
    setCurrentProduct({ ...prod });
    setIsEditing(true);
  };

  const handleCreate = () => {
    if (!canEdit) return;
    setCurrentProduct({
      id: `prod-${Date.now()}`,
      name: '',
      description: '',
      unit: 'Pcs',
      hsnCode: '',
      gstPercentage: 18,
      sellingPrice: 0,
      createdAt: new Date().toISOString()
    });
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (userRole !== 'admin') {
      alert('Only admins can delete inventory products.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this product/service?')) {
      db.deleteProduct(id);
      setProducts(db.getProducts());
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentProduct) {
      db.saveProduct(currentProduct);
      setProducts(db.getProducts());
      setIsEditing(false);
      setCurrentProduct(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.hsnCode || '').includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 glass-card p-6 border border-black/5 dark:border-white/5">
        <div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center">
            <Tag className="w-6 h-6 mr-2.5 text-[#007AFF]" />
            Product & Service Catalog
          </h2>
          <p className="text-sm text-slate-450 mt-1">
            Maintain item prices, tax structures (HSN/SAC), and invoicing base metrics.
          </p>
        </div>

        {canEdit && !isEditing && (
          <button
            onClick={handleCreate}
            className="apple-btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product / Service
          </button>
        )}
      </div>

      {isEditing && currentProduct ? (
        /* Edit / Create Form */
        <form onSubmit={handleSave} className="glass-card border border-black/5 dark:border-white/5 overflow-hidden transition-all duration-300">
          <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/[0.01] dark:bg-white/[0.01]">
            <h3 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-white">
              {currentProduct.name ? `Edit Item: ${currentProduct.name}` : 'Add New Item / Service'}
            </h3>
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setCurrentProduct(null); }}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Item Name / Service Title *</label>
              <input 
                type="text" required
                value={currentProduct.name}
                onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                placeholder="Database Optimization Consulting"
                className="apple-input w-full font-semibold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description / Scope of Work</label>
              <textarea rows={3}
                value={currentProduct.description}
                onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                placeholder="Provide detailed specifications, tools used, or milestones..."
                className="apple-input w-full resize-none h-20 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Selling Price (INR) *</label>
              <input 
                type="number" required min="0" step="any"
                value={currentProduct.sellingPrice || ''}
                onChange={e => setCurrentProduct({ ...currentProduct, sellingPrice: parseFloat(e.target.value) || 0 })}
                placeholder="2500"
                className="apple-input w-full font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Unit of Measurement *</label>
              <select 
                value={currentProduct.unit}
                onChange={e => setCurrentProduct({ ...currentProduct, unit: e.target.value })}
                className="apple-input w-full font-semibold"
              >
                <option value="Pcs">Pcs (Pieces)</option>
                <option value="Hrs">Hrs (Hours)</option>
                <option value="Days">Days</option>
                <option value="Box">Box</option>
                <option value="Mtr">Mtr (Meters)</option>
                <option value="Kg">Kg (Kilograms)</option>
                <option value="Lot">Lot</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">HSN / SAC Code *</label>
              <input 
                type="text" required
                value={currentProduct.hsnCode}
                onChange={e => setCurrentProduct({ ...currentProduct, hsnCode: e.target.value })}
                placeholder="998311"
                className="apple-input w-full font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">GST Percentage *</label>
              <select 
                value={currentProduct.gstPercentage}
                onChange={e => setCurrentProduct({ ...currentProduct, gstPercentage: parseInt(e.target.value) || 0 })}
                className="apple-input w-full font-bold"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18% (Standard Service)</option>
                <option value="28">28%</option>
              </select>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setCurrentProduct(null); }}
              className="apple-btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="apple-btn-primary"
            >
              Save Catalog Item
            </button>
          </div>
        </form>
      ) : (
        /* Inventory List Table */
        <div className="space-y-4">
          {/* Search bar */}
          <div className="glass-card p-4 border border-black/5 dark:border-white/5 flex items-center shadow-sm">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by item name, details, HSN / SAC..."
              className="w-full bg-transparent border-none text-xs focus:outline-none dark:text-white"
            />
          </div>

          <div className="glass-card border border-black/5 dark:border-white/5 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-slate-400 uppercase text-[9px] tracking-wider font-bold">
                    <th className="px-6 py-4">Item Details</th>
                    <th className="px-6 py-4">HSN/SAC</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4 text-right">GST Rate</th>
                    <th className="px-6 py-4 text-right">Selling Price</th>
                    {canEdit && <th className="px-6 py-4 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-455">
                        No catalog items match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(prod => (
                      <tr key={prod.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 dark:text-white">{prod.name}</div>
                          {prod.description && (
                            <div className="text-[11px] text-slate-400 mt-1 max-w-sm truncate" title={prod.description}>
                              {prod.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{prod.hsnCode}</td>
                        <td className="px-6 py-4 font-medium">{prod.unit}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            prod.gstPercentage === 18 ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-black/5 dark:bg-white/5 text-slate-500'
                          }`}>
                            {prod.gstPercentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white font-mono">
                          {formatCurrency(prod.sellingPrice)}
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex space-x-1.5">
                              <button 
                                onClick={() => handleEdit(prod)}
                                className="p-1.5 text-slate-400 hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
                                title="Edit item"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {userRole === 'admin' && (
                                <button 
                                  onClick={() => handleDelete(prod.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                  title="Delete item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
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
