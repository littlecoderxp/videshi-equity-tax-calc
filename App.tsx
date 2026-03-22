import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  PlusCircle,
  Calculator,
  Trash2,
  Settings,
  FileSpreadsheet,
  FileCode,
  Save,
  Upload,
  Pencil
} from 'lucide-react';
import { Transaction, TaxResult } from './types';
import { calculateTax, calculateAggregateTaxes, formatCurrency, formatUSD } from './utils/taxCalculator';
import { TransactionForm } from './components/TransactionForm';
import { Button } from './components/ui/Button';
import { SummaryChart } from './components/SummaryChart';
import { exportToExcel, exportToHtml } from './utils/exportUtils';
import { clsx } from 'clsx';
import { getFinancialYearBounds, MIN_ALLOWED_DATE } from './utils/dateUtils';

export function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [slabRate, setSlabRate] = useState(30); // Default 30% without cess
  const [isLoaded, setIsLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('globalEquityDb');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          setTransactions(parsed.transactions);
        }
        if (parsed.slabRate) {
          setSlabRate(Number(parsed.slabRate));
        }
      } catch (e) {
        console.error("Failed to load local data", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('globalEquityDb', JSON.stringify({ transactions, slabRate }));
    }
  }, [transactions, slabRate, isLoaded]);

  const handleSaveTransaction = (tData: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(t =>
        t.id === editingTransaction.id ? { ...tData, id: t.id } : t
      ));
    } else {
      setTransactions(prev => [...prev, { ...tData, id: crypto.randomUUID() }]);
    }
  };

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const sessionBounds = useMemo(() => {
    if (transactions.length === 0) return null;
    return getFinancialYearBounds(transactions[0].saleDate);
  }, [transactions]);

  const results: TaxResult[] = useMemo(() => {
    return transactions.map(t => calculateTax(t, slabRate));
  }, [transactions, slabRate]);

  const totals = useMemo(() => {
    const rawTotals = results.reduce((acc, curr) => {
      const t = transactions.find(tx => tx.id === curr.transactionId);
      const isESPP = t?.type === 'ESPP';

      return {
        gain: acc.gain + curr.capitalGainInr,
        saleValue: acc.saleValue + curr.sellValueInr,
        esppAcquisitionCost: acc.esppAcquisitionCost + (isESPP ? curr.buyValueInr : 0)
      };
    }, { gain: 0, saleValue: 0, esppAcquisitionCost: 0 });

    const aggregate = calculateAggregateTaxes(results, slabRate);

    return {
      ...rawTotals,
      aggregate
    };
  }, [results, transactions, slabRate]);

  const handleExportExcel = () => {
    if (transactions.length === 0) return;
    exportToExcel(transactions, results);
  };

  const handleExportHtml = () => {
    if (transactions.length === 0) return;
    const oldTotals = {
      gain: totals.gain,
      tax: totals.aggregate.totalTax,
      saleValue: totals.saleValue,
      esppAcquisitionCost: totals.esppAcquisitionCost
    };
    exportToHtml(transactions, results, oldTotals);
  };

  const handleSaveDb = () => {
    const data = JSON.stringify({
      transactions,
      slabRate,
      version: 1,
      exportedAt: new Date().toISOString()
    }, null, 2);

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `global-equity-db-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadDbClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearData = () => {
    if (window.confirm('Are you strictly certain you want to CLEAR ALL transactions? This will permanently delete your data from the browser to protect your privacy.')) {
      setTransactions([]);
      localStorage.removeItem('globalEquityDb');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let foundTransactions = false;
        let sessionFyStart = '';

        const sanitizeTransaction = (t: any): Transaction => {
          const saleDateStr = t.saleDate || '';
          if (saleDateStr && new Date(saleDateStr) < new Date(MIN_ALLOWED_DATE)) {
            throw new Error(`Transaction ${t.symbol || ''} sale date (${saleDateStr}) is before the supported date ${MIN_ALLOWED_DATE}.`);
          }
          if (saleDateStr) {
            const bounds = getFinancialYearBounds(saleDateStr);
            if (bounds.start) {
              if (!sessionFyStart) {
                sessionFyStart = bounds.start;
              } else if (sessionFyStart !== bounds.start) {
                throw new Error("Cannot mix transactions from multiple financial years in a single import file.");
              }
            }
          }

          return {
            ...t,
            id: t.id || crypto.randomUUID(),
            quantity: Number(t.quantity) || 0,
            acquisitionFmvUsd: Number(t.acquisitionFmvUsd) || 0,
            acquisitionExchangeRate: Number(t.acquisitionExchangeRate) || 0,
            salePriceUsd: Number(t.salePriceUsd) || 0,
            saleExchangeRate: Number(t.saleExchangeRate) || 0,
            expensesInr: Number(t.expensesInr) || 0
          };
        };

        if (Array.isArray(parsed)) {
          setTransactions(parsed.map(sanitizeTransaction));
          foundTransactions = true;
        } else if (parsed.transactions && Array.isArray(parsed.transactions)) {
          setTransactions(parsed.transactions.map(sanitizeTransaction));
          foundTransactions = true;
        }

        if (parsed.slabRate) {
          setSlabRate(Number(parsed.slabRate));
        }

        if (!foundTransactions) {
          throw new Error("No transactions found. Make sure the JSON format is correct.");
        }
      } catch (err: any) {
        alert("Invalid database file format: " + (err.message || ''));
        console.error(err);
      } finally {
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">Videshi Equity Tax Calc</h1>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight sm:hidden">Tax Calc</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md">
              <Settings className="w-4 h-4" />
              <span>Slab Rate:</span>
              <input
                type="number"
                value={slabRate}
                onChange={(e) => setSlabRate(Number(e.target.value))}
                className="w-14 bg-transparent border-b border-slate-300 focus:border-blue-500 focus:outline-none text-slate-900 font-medium text-center"
              />
              <span>%</span>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* DB Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleSaveDb}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block"
                title="Save Data (JSON)"
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={handleLoadDbClick}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block"
                title="Load Data (JSON)"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>

            {/* Export Buttons */}
            {transactions.length > 0 && (
              <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1 sm:pl-4 sm:ml-2">
                <button
                  onClick={handleExportExcel}
                  className="p-2 text-slate-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  title="Download Report (Excel)"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                </button>
                <button
                  onClick={handleExportHtml}
                  className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Download Report (HTML)"
                >
                  <FileCode className="w-5 h-5" />
                </button>
              </div>
            )}

            <Button onClick={() => { setEditingTransaction(null); setShowForm(true); }} size="sm" className="gap-2 ml-2">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Core Financials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-blue-100 text-sm font-medium mb-1">Total Estimated Tax Liability</h2>
              <div className="text-4xl font-bold">{formatCurrency(totals.aggregate.totalTax)}</div>
              <div className="text-sm text-blue-200 mt-2">
                Includes Base Tax {formatCurrency(totals.aggregate.totalBaseTax)} + 4% Cess {formatCurrency(totals.aggregate.cessAmount)}
              </div>
            </div>
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm hidden sm:block">
              <Calculator className="w-8 h-8 text-blue-50" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center gap-4">
              <div>
                  <h3 className="text-slate-500 text-sm font-medium mb-1">Total Sale Value</h3>
                  <div className="text-2xl font-bold text-slate-800">{formatCurrency(totals.saleValue)}</div>
              </div>
              <div className="h-px bg-slate-100 w-full" />
              <div>
                  <h3 className="text-slate-500 text-sm font-medium mb-1">ESPP Acquisition Cost</h3>
                  <div className="text-2xl font-bold text-slate-800">{formatCurrency(totals.esppAcquisitionCost)}</div>
              </div>
          </div>
        </div>

        {/* Detailed Tax Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* STCG Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Short Term (STCG)</h3>
             <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total STCG (Gross)</span>
                  <span className="font-medium text-slate-900">{formatCurrency(totals.aggregate.stcgGross)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total STCL (Loss)</span>
                  <span className="font-medium text-red-600">- {formatCurrency(totals.aggregate.stclGross)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-medium text-slate-800">Effective STCG/Loss</span>
                  <span className={clsx("font-bold", totals.aggregate.stcgEffective >= 0 ? "text-green-600" : "text-red-600")}>
                    {totals.aggregate.stcgEffective >= 0 ? '+' : ''}{formatCurrency(totals.aggregate.stcgEffective)}
                  </span>
                </div>
                <div className="flex justify-between bg-blue-50 p-3 rounded-lg mt-4 items-center">
                  <span className="font-semibold text-blue-900">Base Tax STCG ({slabRate}%)</span>
                  <span className="font-bold text-blue-900 text-lg">{formatCurrency(totals.aggregate.stcgBaseTax)}</span>
                </div>
             </div>
          </div>

          {/* LTCG Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Long Term (LTCG)</h3>
             <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total LTCG (Gross)</span>
                  <span className="font-medium text-slate-900">{formatCurrency(totals.aggregate.ltcgGross)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total LTCL (Loss)</span>
                  <span className="font-medium text-red-600">- {formatCurrency(totals.aggregate.ltclGross)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-medium text-slate-800">Effective LTCG/Loss</span>
                  <span className={clsx("font-bold", totals.aggregate.ltcgEffective >= 0 ? "text-green-600" : "text-red-600")}>
                    {totals.aggregate.ltcgEffective >= 0 ? '+' : ''}{formatCurrency(totals.aggregate.ltcgEffective)}
                  </span>
                </div>
                <div className="flex justify-between bg-purple-50 p-3 rounded-lg mt-4 items-center">
                  <span className="font-semibold text-purple-900">Base Tax LTCG (12.5%)</span>
                  <span className="font-bold text-purple-900 text-lg">{formatCurrency(totals.aggregate.ltcgBaseTax)}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Charts */}
        <SummaryChart taxResults={results} totalTax={totals.aggregate.totalTax} />

        {/* Transaction List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-slate-800">Transactions</h3>
              <span className="text-sm text-slate-500">{transactions.length} items</span>
            </div>
            {transactions.length > 0 && (
              <Button 
                onClick={handleClearData} 
                variant="ghost" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                title="Permanently erase all data from browser storage"
              >
                <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Clear All Data</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                <PlusCircle className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No transactions added</h3>
              <p className="mt-1 text-slate-400">Add your first RSU or ESPP sale to calculate taxes.</p>
              <div className="flex gap-4 justify-center mt-4">
                <Button onClick={() => { setEditingTransaction(null); setShowForm(true); }} variant="secondary">
                  Add Transaction
                </Button>
                <Button onClick={handleLoadDbClick} variant="ghost" className="border border-dashed border-slate-300">
                  <Upload className="w-4 h-4 mr-2" />
                  Load Data File
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium">
                  <tr>
                    <th className="px-6 py-3">Asset</th>
                    <th className="px-6 py-3">Dates</th>
                    <th className="px-6 py-3 text-right">Cost Basis (INR)</th>
                    <th className="px-6 py-3 text-right">Sale Value (INR)</th>
                    <th className="px-6 py-3 text-right">Gain/Loss</th>
                    <th className="px-6 py-3 text-right">Est. Tax</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => {
                    const t = transactions.find(tr => tr.id === r.transactionId)!;
                    return (
                      <tr key={r.transactionId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-10 rounded-full ${r.gainType === 'LTCG' ? 'bg-blue-500' : 'bg-amber-500'}`} title={r.gainType}></div>
                            <div>
                              <div className="font-semibold text-slate-900">{t.symbol}</div>
                              <div className="text-xs text-slate-500">{t.type} • {t.quantity} qty</div>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mt-1 ${r.gainType === 'LTCG' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                {r.gainType} ({r.holdingDays} days)
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                              <span className="w-8 text-slate-400">Buy:</span>
                              <span>{t.acquisitionDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-8 text-slate-400">Sell:</span>
                              <span>{t.saleDate}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-600">
                          {formatCurrency(r.buyValueInr)}
                          <div className="text-xs text-slate-400">
                            {formatUSD(t.acquisitionFmvUsd)} @ {t.acquisitionExchangeRate}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-600">
                          {formatCurrency(r.sellValueInr)}
                          <div className="text-xs text-slate-400">
                            {formatUSD(t.salePriceUsd)} @ {t.saleExchangeRate}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={clsx("font-bold", r.capitalGainInr >= 0 ? "text-green-600" : "text-red-600")}>
                            {r.capitalGainInr >= 0 ? '+' : ''}{formatCurrency(r.capitalGainInr)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-bold text-slate-800">{formatCurrency(r.estimatedTaxInr)}</div>
                          <div className="text-[10px] text-slate-400 max-w-[100px] ml-auto leading-tight">
                            {r.applicableRate}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => { setEditingTransaction(t); setShowForm(true); }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeTransaction(t.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
          <Calculator className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Tax Calculation Logic (India)</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700/80">
              <li><strong>LTCG:</strong> Holding period &gt; 24 months. Taxed at a flat 12.5%.</li>
              <li><strong>STCG:</strong> Holding period &le; 24 months. Taxed at your applicable slab rate (marginal rate).</li>
              <li><strong>Set-offs:</strong> Short-term losses offset short-term gains, then long-term gains. Long-term losses only offset long-term gains.</li>
              <li><strong>Exchange Rate:</strong> Uses SBI TT Buying Rate on the last day of the preceding month of transfer/acquisition (Rule 115).</li>
            </ul>
          </div>
        </div>

      </main>

      {showForm && (
        <TransactionForm
          initialData={editingTransaction || undefined}
          minAllowedDate={sessionBounds?.start}
          maxAllowedDate={sessionBounds?.end}
          onSave={handleSaveTransaction}
          onClose={() => { setShowForm(false); setEditingTransaction(null); }}
        />
      )}
    </div>
  );
}