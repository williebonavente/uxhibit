'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function UsabilityScoreTrendPage() {
  // Sample data for the usability score trend
  const trendData = [
    { version: 'Q1', score: 1.2, label: '01' },
    { version: 'Q2', score: 7.8, label: '02' },
    { version: 'Q3', score: 6.1, label: '03' },
    { version: 'Q4', score: 8.7, label: '04' },
    { version: 'Q5', score: 9.4, label: '05' },
  ];

  return (
    <div className="space-y-5">
      <div className="border-b-2 p-2">
        <h1 className="text-3xl font-bold text-black dark:text-white font-['Poppins']">
          Usability Score Trend
        </h1>
      </div>
      <div className="p-2 m-5 flex items-center justify-between">
        <p className="text-gray-600 dark:text-gray-300 mt-1 max-w-3xl font-['Poppins']">
          Track how your design improves over time. Each submission is evaluated using Jakob Nielsen's 10 heuristics, and your score is plotted here.
          The line graph helps you see whether revisions are making your UI more usable before it's added to your portfolio.
        </p>
        <button className="bg-[#ED5E20] hover:bg-[#d44e0f] text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors font-['Poppins'] font-medium ml-6">
          <span>📊</span>
          <span>Export Report</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#19181D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header with Improvements label */}
        <div className="bg-[#ED5E20] text-white px-6 py-4">
          <h3 className="text-lg font-bold font-['Poppins']">Improvements</h3>
        </div>
        
        {/* Chart Container */}
        <div className="p-8">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ED5E20" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ED5E20" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#6b7280" />
                <XAxis 
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 14, fill: '#6b7280', fontFamily: 'Poppins' }}
                  dy={10}
                />
                <YAxis 
                  domain={[0, 10]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#ED5E20', fontFamily: 'Poppins', fontWeight: 'bold' }}
                  dx={-10}
                  label={{ 
                    value: 'Usability Score', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#ED5E20', fontFamily: 'Poppins', fontWeight: 'bold' }
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#ED5E20"
                  strokeWidth={3}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Version labels */}
          <div className="flex justify-center mt-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 font-['Poppins'] font-medium">
                Version
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}