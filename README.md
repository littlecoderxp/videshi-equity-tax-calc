# Videshi Equity Tax Calc

A comprehensive Capital Gains Tax calculator designed for Indian employees holding foreign equity (ESPP & RSU). This application helps calculate Short Term Capital Gains (STCG) and Long Term Capital Gains (LTCG) based on the latest Indian Income Tax rules (FY 25-26).

---

## ⚠️ Important Limitations and Disclaimer

**This is NOT a Final Income Tax Calculator.**
This tool is meant solely for estimating capital gains and the associated tax liabilities from foreign equity (ESPP/RSU) sales. Please note the following critical limitations before using this data for your actual tax filings:

1. **Single Financial Year Enforcement:** The app strictly enforces that **all shares sold must occur within the same Financial Year** (April 1 to March 31). Once you add your first transaction, the application locks the tax dashboard to that specific Financial Year. You will not be able to add or import sales from a different financial year in the same session, as mixing years makes aggregate loss set-offs and tax totals invalid for filing.
2. **Other Incomes Not Included:** This tool does not calculate taxes on your salary, the perquisite tax you already paid on vesting/purchase, dividend income, or any other sources.
3. **Loss Carry Forwards:** The tool only calculates set-offs for the data provided currently. It does not account for capital losses brought forward from previous years.
4. **Surcharge:** This calculator applies the standard 4% Health and Education Cess but does not automatically calculate or apply **Surcharge** (which applies if your total taxable income > ₹50 Lakhs).
5. **No Professional Advice:** The output is an estimate based on programmed rules. Always consult a Certified Chartered Accountant (CA) for official tax filing and to ensure compliance with the latest regulations.
6. **No Retrospective Calculation Before FY 2024-25:** The calculator's logic is mapped to the revised Indian tax rules implemented after the July 2024 budget (e.g., the flat 12.5% LTCG rate). Therefore, the tool restricts any transaction with a sale date prior to **April 1, 2024**.

---

## 📖 How to Use the Calculator

### For Beginners
If you receive Restricted Stock Units (RSUs) or participate in an Employee Stock Purchase Plan (ESPP) from a foreign parent company, you owe capital gains tax in India when you **sell** those shares. 

1. **Gather your data**: Open your foreign broker statements (like E*TRADE, Charles Schwab, Fidelity, Morgan Stanley).
2. **Set your Slab Rate**: At the top of the app, enter your highest income tax slab rate (e.g., 30%).
3. **Add a Transaction**: Click the **Add Transaction** button.
   - **Type**: Choose RSU or ESPP.
   - **Acquisition Date & FMV**: When did the shares vest/purchase, and what was the Fair Market Value (FMV) in USD on that day?
   - **Sale Date & Price**: When did you sell them, and for how much per share?
   - **Exchange Rates**: India mandates using the SBI TT Buying Rate for the *last day of the month preceding* the transaction.
   - **Expenses**: Any wire transfer fees, foreign brokerage fees, or GST on those fees in INR.
4. **Review your Tax Liability**: The app instantly breaks down your gains into Short-Term or Long-Term, offsets losses, applies your specific tax rates, and tells you the estimated tax you owe.

### For Pros
The calculator strictly follows Indian Income Tax Act guidelines for unlisted foreign equity:
- **Rule 115**: Converts foreign currency to INR using the SBI TT Buying rate of the last day of the preceding month. 
- **LTCG (Section 112)**: Long Term Capital Gains (holding strictly > 24 months for unlisted foreign shares) are taxed at a flat base rate of 12.5%.
- **STCG**: Short Term Capital Gains (holding ≤ 24 months) are taxed at your applicable slab rate (marginal rate).
- **Loss Set-off Rules**: Short-term losses offset both STCG and LTCG. Long-term losses only offset LTCG.
- **Cess**: 4% Health & Education Cess is strictly applied to the *final calculated base tax liability* (not the raw gain).

---

## 💾 Saving, Loading, and Exporting Data

For your privacy, **no data is sent to any server**. Everything runs locally in your browser.
- **Local Storage**: The app saves your data automatically to your local browser storage.
- **Save Data (JSON)**: Export your transactions into a `.json` backup file.
- **Load Data File**: Use a `.json` file (`sample-data.json` is provided) to import transactions back into the app.
- **Export to Excel / HTML**: Generate beautiful, printable summary reports for your CA.
- **Clear All**: Erase everything permanently from the browser before closing a shared computer.

---

## 💻 Tech Stack

- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS
-   **Charts**: Recharts
-   **Icons**: Lucide React
-   **Build Tool**: Vite

---

## 🚀 How to Run Locally (Windows, macOS, Linux)

### 1. Prerequisites
Ensure you have **Node.js** installed.
- Open your terminal (Command Prompt/PowerShell on Windows, Terminal on macOS/Linux) and type `node -v`.
- If it is not installed, download the LTS version from [nodejs.org](https://nodejs.org/).

### 2. Install Dependencies
Open your terminal or Integrated Terminal in VS Code and run:
```bash
npm install
```

### 3. Run the Application
In the same terminal, run:
```bash
npm run dev
```
Open the local server link (e.g. `http://localhost:5173/`) to view the app in your browser.

### 4. Troubleshooting (Windows Only)
- **Script Policy Error**: If PowerShell gives an error about "running scripts is disabled", run this command to temporarily allow scripts:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
  ```
  Then try `npm run dev` again.
