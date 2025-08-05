'use client';

import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

const HeuristicDashboard = () => {
  // Data for the radar chart based on Jakob Nielsen's 10 Usability Heuristics
  const heuristicData = [
    { heuristic: '01', name: 'Visibility of System Status', value: 20, fullName: 'Visibility of System Status' },
    { heuristic: '02', name: 'Match Between System and Real World', value: 10, fullName: 'Match Between System and the Real World' },
    { heuristic: '03', name: 'User Control and Freedom', value: 50, fullName: 'User Control and Freedom' },
    { heuristic: '04', name: 'Consistency and Standards', value: 80, fullName: 'Consistency and Standards' },
    { heuristic: '05', name: 'Error Prevention', value: 5, fullName: 'Error Prevention' },
    { heuristic: '06', name: 'Recognition Rather than Recall', value: 10, fullName: 'Recognition Rather than Recall' },
    { heuristic: '07', name: 'Flexibility and Efficiency of Use', value: 25, fullName: 'Flexibility and Efficiency of Use' },
    { heuristic: '08', name: 'Aesthetic and Minimalist Design', value: 15, fullName: 'Aesthetic and Minimalist Design' },
    { heuristic: '09', name: 'Help Users Recognize, Diagnose, and Recover from Errors', value: 50, fullName: 'Help Users Recognize, Diagnose, and Recover from Errors' },
    { heuristic: '10', name: 'Help and Documentation', value: 35, fullName: 'Help and Documentation' }
  ];

  const getSeverityColor = (value: number) => {
    if (value <= 20) return 'text-green-600 dark:text-green-400';
    if (value <= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSeverityBg = (value: number) => {
    if (value <= 20) return 'bg-green-100 dark:bg-green-900/30';
    if (value <= 40) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="space-y-5">
      <div className="border-b-2 p-2">
        <h1 className="text-3xl font-bold text-black dark:text-white font-['Poppins']">
          Heuristic Violation Frequency
        </h1>
      </div>
      <div className="p-2 m-5 flex items-center justify-between">
        <p className="text-gray-600 dark:text-gray-300 mt-1 max-w-3xl font-['Poppins']">
          This section shows which usability heuristics you're violating most often. The radar chart breaks down how frequently these issues occur in 
          your projects, with color-coded severity levels (minor vs. major). It helps you spot patterns, understand recurring design challenges, 
          and improve your designs more effectively.
        </p>
        <button className="bg-[#ED5E20] hover:bg-[#d44e0f] text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors font-['Poppins'] font-medium ml-6">
          <span>📊</span>
          <span>Export Report</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#19181D] rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Radar Chart */}
          <div className="flex flex-col items-center">
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={heuristicData}>
                  <PolarGrid stroke="#9ca3af" />
                  <PolarAngleAxis 
                    dataKey="heuristic" 
                    tick={{ fontSize: 13, fill: '#ED5E20' }}
                  />
                  <PolarRadiusAxis 
                    angle={0} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickCount={6}
                  />
                  <Radar
                    name="Violation Frequency"
                    dataKey="value"
                    stroke="#ED5E20"
                    fill="#ED5E20"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heuristics List */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-black dark:text-white font-['Poppins']">
              Jakob Nielsen's 10 Usability Heuristics<br />
              <span className="text-lg font-medium text-gray-600 dark:text-gray-300">for User Interface Design</span>
            </h3>
            <div className="space-y-4">
              {heuristicData.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-[#ED5E20] font-bold text-sm min-w-[24px]">{item.heuristic}.</span>
                    <span className="text-gray-800 dark:text-gray-200 text-sm font-['Poppins']">{item.fullName}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`font-bold text-sm ${getSeverityColor(item.value)}`}>
                      {item.value}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${getSeverityBg(item.value)}`}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 font-['Poppins']">Legend:</div>
              <div className="flex justify-between text-xs font-['Poppins'] mb-2">
                <span className="text-green-600 dark:text-green-400 font-medium">Minor Severity</span>
                <span className="text-red-600 dark:text-red-400 font-medium">Major Severity</span>
              </div>
              <div className="w-full bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 dark:from-green-600 dark:via-yellow-600 dark:to-red-600 h-2 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeuristicDashboard;