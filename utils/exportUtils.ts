import * as XLSX from 'xlsx';
import { Transaction, TaxResult } from '../types';
import { formatCurrency } from './taxCalculator';

export const exportToExcel = (transactions: Transaction[], results: TaxResult[]) => {
  const data = transactions.map(t => {
    const r = results.find(res => res.transactionId === t.id);
    return {
      'Asset Type': t.type,
      'Symbol': t.symbol,
      'Quantity': t.quantity,
      'Buy Date': t.acquisitionDate,
      'Buy FMV ($)': t.acquisitionFmvUsd,
      'Buy FX Rate': t.acquisitionExchangeRate,
      'Cost Basis (INR)': r?.buyValueInr || 0,
      'Sell Date': t.saleDate,
      'Sell Price ($)': t.salePriceUsd,
      'Sell FX Rate': t.saleExchangeRate,
      'Expenses (INR)': t.expensesInr,
      'Sale Value (INR)': r?.sellValueInr || 0,
      'Gain/Loss (INR)': r?.capitalGainInr || 0,
      'Gain Type': r?.gainType || '',
      'Holding Days': r?.holdingDays || 0,
      'Est. Tax (INR)': r?.estimatedTaxInr || 0,
      'Tax Rate': r?.applicableRate || ''
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tax Report");
  XLSX.writeFile(wb, `GlobalEquity_Tax_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToHtml = (transactions: Transaction[], results: TaxResult[], totals: { gain: number, tax: number, saleValue: number, esppAcquisitionCost?: number }) => {
  const date = new Date().toLocaleDateString();
  
  const rows = transactions.map(t => {
    const r = results.find(res => res.transactionId === t.id);
    if (!r) return '';
    const gainClass = r.capitalGainInr >= 0 ? 'positive' : 'negative';
    
    return `
      <tr>
        <td>${t.type}</td>
        <td>${t.symbol}</td>
        <td>${t.quantity}</td>
        <td>${t.acquisitionDate}</td>
        <td>${t.saleDate}</td>
        <td class="text-right">${formatCurrency(r.buyValueInr)}</td>
        <td class="text-right">${formatCurrency(r.sellValueInr)}</td>
        <td class="text-right ${gainClass}"><strong>${formatCurrency(r.capitalGainInr)}</strong></td>
        <td class="text-right">${formatCurrency(r.estimatedTaxInr)} <br><span class="muted">${r.gainType}</span></td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Global Equity Tax Report - ${date}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #333; background: #f9fafb; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        h1 { margin: 0 0 10px 0; color: #111827; }
        p.subtitle { color: #6b7280; margin-bottom: 30px; }
        
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .card { padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; background: #f9fafb; }
        .card h3 { margin: 0 0 5px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .card .value { font-size: 24px; font-weight: 700; color: #111827; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
        th { text-align: left; padding: 12px; background: #f3f4f6; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        
        .text-right { text-align: right; }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        .muted { color: #9ca3af; font-size: 11px; }
        
        @media print {
          body { background: white; padding: 0; }
          .container { box-shadow: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Global Equity Tax Report</h1>
        <!-- <p class="subtitle">Generated on ${date}</p> -->
        
        <div class="summary-grid">
          <div class="card">
            <h3>Total Capital Gains</h3>
            <div class="value ${totals.gain >= 0 ? 'positive' : 'negative'}">${formatCurrency(totals.gain)}</div>
          </div>
          <div class="card">
            <h3>Estimated Tax</h3>
            <div class="value">${formatCurrency(totals.tax)}</div>
          </div>
          <div class="card">
            <h3>Total Sale Value</h3>
            <div class="value">${formatCurrency(totals.saleValue)}</div>
          </div>
          <div class="card">
            <h3>ESPP Acquisition</h3>
            <div class="value">${formatCurrency(totals.esppAcquisitionCost || 0)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Symbol</th>
              <th>Qty</th>
              <th>Buy Date</th>
              <th>Sell Date</th>
              <th class="text-right">Cost Basis</th>
              <th class="text-right">Sale Value</th>
              <th class="text-right">Gain/Loss</th>
              <th class="text-right">Est. Tax</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        
        <!-- <p style="margin-top: 40px; font-size: 12px; color: #9ca3af; text-align: center;">
          This report is generated for informational purposes only. Please consult a tax professional.
        </p> -->
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GlobalEquity_Tax_Report_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
