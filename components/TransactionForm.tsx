import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { Transaction, AssetType } from '../types';
import { Button } from './ui/Button';

interface TransactionFormProps {
  initialData?: Transaction;
  minAllowedDate?: string;
  maxAllowedDate?: string;
  onSave: (t: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ initialData, minAllowedDate, maxAllowedDate, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    type: initialData?.type || 'RSU' as AssetType,
    symbol: initialData?.symbol || '',
    quantity: initialData?.quantity?.toString() || '',
    acquisitionDate: initialData?.acquisitionDate || '',
    acquisitionFmvUsd: initialData?.acquisitionFmvUsd?.toString() || '',
    acquisitionExchangeRate: initialData?.acquisitionExchangeRate?.toString() || '',
    saleDate: initialData?.saleDate || '',
    salePriceUsd: initialData?.salePriceUsd?.toString() || '',
    saleExchangeRate: initialData?.saleExchangeRate?.toString() || '',
    expensesInr: initialData?.expensesInr?.toString() || '0'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type: formData.type,
      symbol: formData.symbol.toUpperCase(),
      quantity: Number(formData.quantity),
      acquisitionDate: formData.acquisitionDate,
      acquisitionFmvUsd: Number(formData.acquisitionFmvUsd),
      acquisitionExchangeRate: Number(formData.acquisitionExchangeRate),
      saleDate: formData.saleDate,
      salePriceUsd: Number(formData.salePriceUsd),
      saleExchangeRate: Number(formData.saleExchangeRate),
      expensesInr: Number(formData.expensesInr)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">{initialData ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Type & Symbol */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Asset Type</label>
              <div className="flex rounded-lg bg-slate-100 p-1">
                {(['RSU', 'ESPP'] as AssetType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type }))}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
                      formData.type === type 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Ticker Symbol</label>
              <input
                required
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="e.g. GOOGL, MSFT"
                className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Quantity Sold</label>
              <input
                required
                type="number"
                step="0.0001"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
              />
            </div>
             <div className="space-y-2">
                 {/* Spacer */}
            </div>


            {/* Acquisition Details */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                 Acquisition Details ({formData.type === 'RSU' ? 'Vesting' : 'Purchase'})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600">Date</label>
                    <input
                    required
                    type="date"
                    name="acquisitionDate"
                    value={formData.acquisitionDate}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-200 focus:border-blue-500 py-2 px-3 border text-sm"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600">FMV (USD)</label>
                    <input
                    required
                    type="number"
                    step="0.01"
                    name="acquisitionFmvUsd"
                    value={formData.acquisitionFmvUsd}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-lg border-slate-200 focus:border-blue-500 py-2 px-3 border text-sm"
                    />
                </div>
                <div className="space-y-2">
                     <label className="block text-xs font-medium text-slate-600 flex items-center gap-1">
                        Exchange Rate
                        <span className="group relative">
                            <Info className="w-3 h-3 text-slate-400 cursor-help" />
                            <span className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-800 text-white text-xs p-2 rounded z-50">
                                SBI TT Buying Rate on last day of preceding month of acquisition.
                            </span>
                        </span>
                    </label>
                    <input
                    required
                    type="number"
                    step="0.01"
                    name="acquisitionExchangeRate"
                    value={formData.acquisitionExchangeRate}
                    onChange={handleChange}
                    placeholder="₹ 83.50"
                    className="w-full rounded-lg border-slate-200 focus:border-blue-500 py-2 px-3 border text-sm"
                    />
                </div>
              </div>
            </div>

            {/* Sale Details */}
            <div className="md:col-span-2 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-green-600 mb-3">Sale Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600">Date</label>
                    <input
                    required
                    type="date"
                    name="saleDate"
                    min={minAllowedDate || '2024-04-01'}
                    max={maxAllowedDate}
                    value={formData.saleDate}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-200 focus:border-blue-500 py-2 px-3 border text-sm"
                    />
                    {minAllowedDate && maxAllowedDate && (
                      <p className="text-[10px] text-slate-500 leading-tight">Must fall within established FY ({new Date(minAllowedDate).getFullYear()}-{new Date(maxAllowedDate).getFullYear().toString().slice(2)})</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600">Sale Price (USD)</label>
                    <input
                    required
                    type="number"
                    step="0.01"
                    name="salePriceUsd"
                    value={formData.salePriceUsd}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-lg border-slate-200 focus:border-blue-500 py-2 px-3 border text-sm"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600 flex items-center gap-1">
                        Exchange Rate
                        <span className="group relative">
                            <Info className="w-3 h-3 text-slate-400 cursor-help" />
                            <span className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-800 text-white text-xs p-2 rounded z-50">
                                SBI TT Buying Rate on last day of preceding month of sale.
                            </span>
                        </span>
                    </label>
                    <input
                    required
                    type="number"
                    step="0.01"
                    name="saleExchangeRate"
                    value={formData.saleExchangeRate}
                    onChange={handleChange}
                    placeholder="₹ 84.00"
                    className="w-full rounded-lg border-slate-200 focus:border-blue-500 py-2 px-3 border text-sm"
                    />
                </div>
              </div>
            </div>
            
             <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Expenses (In INR)</label>
                <input
                type="number"
                step="1"
                name="expensesInr"
                value={formData.expensesInr}
                onChange={handleChange}
                placeholder="Brokerage fees etc."
                className="w-full rounded-lg border-slate-200 focus:border-blue-500 py-2 px-3 border"
                />
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{initialData ? 'Save Changes' : 'Add Transaction'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};