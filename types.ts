export type AssetType = 'RSU' | 'ESPP';

export interface Transaction {
  id: string;
  type: AssetType;
  symbol: string; // e.g., GOOGL, MSFT
  quantity: number;
  
  // Acquisition (Buy/Vest)
  acquisitionDate: string; // YYYY-MM-DD
  acquisitionFmvUsd: number; // FMV per share at vesting/purchase
  acquisitionExchangeRate: number; // INR per USD
  
  // Sale
  saleDate: string; // YYYY-MM-DD
  salePriceUsd: number; // Price per share
  saleExchangeRate: number; // INR per USD
  expensesInr: number; // Brokerage, fees in INR
}

export interface TaxResult {
  transactionId: string;
  capitalGainInr: number;
  gainType: 'LTCG' | 'STCG';
  holdingDays: number;
  estimatedTaxInr: number;
  buyValueInr: number;
  sellValueInr: number;
  applicableRate: string;
}

export interface AppState {
  transactions: Transaction[];
  userSlabRate: number; // Percentage, e.g., 30
}

export interface AggregateTaxCalculation {
  stcgGross: number;
  stclGross: number;
  stcgEffective: number;
  stcgBaseTax: number;
  ltcgGross: number;
  ltclGross: number;
  ltcgEffective: number;
  ltcgBaseTax: number;
  totalBaseTax: number;
  cessAmount: number;
  totalTax: number;
}