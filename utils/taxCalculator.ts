import { Transaction, TaxResult, AggregateTaxCalculation } from '../types';

// Constants for Tax Rules
const LTCG_HOLDING_PERIOD_DAYS = 730; // 24 Months for Unlisted/Foreign shares

export const calculateTax = (transaction: Transaction, userSlabRate: number): TaxResult => {
  const acqDate = new Date(transaction.acquisitionDate);
  const saleDate = new Date(transaction.saleDate);

  // Time Difference
  const diffTime = Math.abs(saleDate.getTime() - acqDate.getTime());
  const holdingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine Gain Type
  const gainType = holdingDays > LTCG_HOLDING_PERIOD_DAYS ? 'LTCG' : 'STCG';

  // Cost of Acquisition in INR
  // For RSU: FMV at Vesting * FX Rate
  // For ESPP: FMV at Purchase * FX Rate (Since discount is perquisite, FMV is base)
  const costOfAcquisitionInr = transaction.quantity * transaction.acquisitionFmvUsd * transaction.acquisitionExchangeRate;

  // Sale Value in INR
  const saleValueInr = transaction.quantity * transaction.salePriceUsd * transaction.saleExchangeRate;

  // Net Sale Consideration
  const netSaleConsideration = saleValueInr - transaction.expensesInr;

  // Capital Gain
  const capitalGainInr = netSaleConsideration - costOfAcquisitionInr;

  let estimatedTaxInr = 0;
  let applicableRate = '';

  if (capitalGainInr > 0) {
    if (gainType === 'STCG') {
      const baseTax = capitalGainInr * (userSlabRate / 100);
      estimatedTaxInr = baseTax * 1.04;
      applicableRate = `Slab (${userSlabRate}%) + 4% Cess`;
    } else {
      const baseTax = capitalGainInr * 0.125;
      estimatedTaxInr = baseTax * 1.04;
      applicableRate = '12.5% + 4% Cess';
    }
  } else {
    applicableRate = 'N/A (Loss)';
  }

  return {
    transactionId: transaction.id,
    capitalGainInr,
    gainType,
    holdingDays,
    estimatedTaxInr: Math.max(0, estimatedTaxInr),
    buyValueInr: costOfAcquisitionInr,
    sellValueInr: saleValueInr,
    applicableRate
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatUSD = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const calculateAggregateTaxes = (results: TaxResult[], userSlabRate: number): AggregateTaxCalculation => {
  let stcgGross = 0;
  let stclGross = 0;
  let ltcgGross = 0;
  let ltclGross = 0;

  results.forEach(r => {
    const gain = Number(r.capitalGainInr) || 0;
    if (r.gainType === 'STCG') {
      if (gain >= 0) stcgGross += gain;
      else stclGross += Math.abs(gain);
    } else {
      if (gain >= 0) ltcgGross += gain;
      else ltclGross += Math.abs(gain);
    }
  });

  const stcgEffective = stcgGross - stclGross;
  const remainingStcl = stcgEffective < 0 ? Math.abs(stcgEffective) : 0;
  
  const ltcgEffective = (ltcgGross - ltclGross) - remainingStcl;
  
  const validSlabRate = Number(userSlabRate) || 0;
  const stcgBaseTax = (stcgEffective > 0 && !isNaN(stcgEffective)) ? stcgEffective * (validSlabRate / 100) : 0;
  const ltcgBaseTax = (ltcgEffective > 0 && !isNaN(ltcgEffective)) ? ltcgEffective * 0.125 : 0;

  const totalBaseTax = (stcgBaseTax || 0) + (ltcgBaseTax || 0);
  const cessAmount = totalBaseTax * 0.04;

  return {
    stcgGross: stcgGross || 0,
    stclGross: stclGross || 0,
    stcgEffective: stcgEffective || 0,
    stcgBaseTax: stcgBaseTax || 0,
    ltcgGross: ltcgGross || 0,
    ltclGross: ltclGross || 0,
    ltcgEffective: ltcgEffective || 0,
    ltcgBaseTax: ltcgBaseTax || 0,
    totalBaseTax: totalBaseTax || 0,
    cessAmount: cessAmount || 0,
    totalTax: (totalBaseTax + cessAmount) || 0
  };
};
