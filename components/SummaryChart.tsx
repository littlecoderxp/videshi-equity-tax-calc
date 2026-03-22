import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TaxResult } from '../types';

interface SummaryChartProps {
  taxResults: TaxResult[];
  totalTax: number;
}

export const SummaryChart: React.FC<SummaryChartProps> = ({ taxResults, totalTax }) => {
  const totalLTCG = taxResults
    .filter(t => t.gainType === 'LTCG')
    .reduce((sum, t) => sum + t.capitalGainInr, 0);

  const totalSTCG = taxResults
    .filter(t => t.gainType === 'STCG')
    .reduce((sum, t) => sum + t.capitalGainInr, 0);

  const data = [
    { name: 'LTCG', value: totalLTCG },
    { name: 'STCG', value: totalSTCG },
  ];

  const taxData = [
    { name: 'Total Gains', amount: totalLTCG + totalSTCG },
    { name: 'Estimated Tax', amount: totalTax }
  ];

  const COLORS = ['#3b82f6', '#f59e0b']; // Blue-500, Amber-500

  if (taxResults.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 bg-white rounded-xl shadow-sm border border-slate-100">
        No data to visualize
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Distribution Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Gains Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tax vs Gains */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Tax Impact</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={taxData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip
                formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};