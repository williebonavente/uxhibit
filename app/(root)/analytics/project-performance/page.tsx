'use client';

import React, { useState, useMemo } from 'react';
import { IconChevronUp, IconChevronDown, IconFilter } from '@tabler/icons-react';

export default function ProjectPerformanceComparisonPage() {
  // Sample data for the project performance table
  const projectData = [
    {
      title: 'Project 07',
      score: 95,
      submissionDate: 'June 10, 2025',
      feedbackItems: 12,
      severity: 'Minor',
      dateSort: new Date('2025-06-10')
    },
    {
      title: 'Project 06',
      score: 70,
      submissionDate: 'June 01, 2025',
      feedbackItems: 13,
      severity: 'Minor',
      dateSort: new Date('2025-06-01')
    },
    {
      title: 'Project 05',
      score: 65,
      submissionDate: 'May 25, 2025',
      feedbackItems: 14,
      severity: 'Minor',
      dateSort: new Date('2025-05-25')
    },
    {
      title: 'Project 04',
      score: 50,
      submissionDate: 'May 12, 2025',
      feedbackItems: 15,
      severity: 'Major',
      dateSort: new Date('2025-05-12')
    },
    {
      title: 'Project 03',
      score: 40,
      submissionDate: 'April 10, 2025',
      feedbackItems: 16,
      severity: 'Major',
      dateSort: new Date('2025-04-10')
    },
    {
      title: 'Project 02',
      score: 20,
      submissionDate: 'March 18, 2025',
      feedbackItems: 17,
      severity: 'Major',
      dateSort: new Date('2025-03-18')
    },
    {
      title: 'Project 01',
      score: 25,
      submissionDate: 'March 20, 2025',
      feedbackItems: 18,
      severity: 'Major',
      dateSort: new Date('2025-03-20')
    }
  ];

  // State for sorting and filtering
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>({ key: 'dateSort', direction: 'desc' });
  
  const [severityFilter, setSeverityFilter] = useState<'all' | 'Minor' | 'Major'>('all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...projectData];

    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(project => project.severity === severityFilter);
    }

    // Apply score filter
    if (scoreFilter !== 'all') {
      filtered = filtered.filter(project => {
        if (scoreFilter === 'high') return project.score >= 80;
        if (scoreFilter === 'medium') return project.score >= 50 && project.score < 80;
        if (scoreFilter === 'low') return project.score < 50;
        return true;
      });
    }

    // Apply sorting
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [projectData, sortConfig, severityFilter, scoreFilter]);

  const getSeverityColor = (severity: string) => {
    return severity === 'Minor' 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400 font-bold';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400 font-bold';
    return 'text-red-600 dark:text-red-400 font-bold';
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <IconFilter size={14} className="opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <IconChevronUp size={14} /> 
      : <IconChevronDown size={14} />;
  };

  return (
    <div className="space-y-5">
      <div className="border-b-2 p-2">
        <h1 className="text-3xl font-bold text-black dark:text-white font-['Poppins']">
          Project Performance Comparison
        </h1>
      </div>
      <div className="p-2 m-5 flex items-center justify-between">
        <p className="text-gray-600 dark:text-gray-300 mt-1 max-w-3xl font-['Poppins']">
          Compare all your submitted projects at a glance. This section displays each design's usability score, submission date, number of feedback 
          items, and the average severity of the issues. Use this to track your progress and identify which projects need more work—or show off your 
          best ones.
        </p>
        <button className="bg-[#ED5E20] hover:bg-[#d44e0f] text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors font-['Poppins'] font-medium ml-6">
          <span>📊</span>
          <span>Export Report</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <IconFilter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Poppins']">Filters:</span>
        </div>
        
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as 'all' | 'Minor' | 'Major')}
          className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-['Poppins'] text-gray-700 dark:text-gray-300"
        >
          <option value="all">All Severities</option>
          <option value="Minor">Minor Issues</option>
          <option value="Major">Major Issues</option>
        </select>

        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
          className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-['Poppins'] text-gray-700 dark:text-gray-300"
        >
          <option value="all">All Scores</option>
          <option value="high">High Score (80+)</option>
          <option value="medium">Medium Score (50-79)</option>
          <option value="low">Low Score (&lt;50)</option>
        </select>

        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Poppins']">
          Showing {filteredAndSortedData.length} of {projectData.length} projects
        </div>
      </div>

      <div className="bg-white dark:bg-[#19181D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header */}
        <div className="bg-[#ED5E20] text-white">
          <div className="grid grid-cols-5 gap-6 px-6 py-4">
            <button
              onClick={() => handleSort('title')}
              className="font-bold font-['Poppins'] text-left flex items-center space-x-1 hover:bg-[#d44e0f] px-2 py-1 rounded transition-colors"
            >
              <span>Project Title</span>
              {getSortIcon('title')}
            </button>
            <button
              onClick={() => handleSort('score')}
              className="font-bold font-['Poppins'] text-center flex items-center justify-center space-x-1 hover:bg-[#d44e0f] px-2 py-1 rounded transition-colors"
            >
              <span>Score</span>
              {getSortIcon('score')}
            </button>
            <button
              onClick={() => handleSort('dateSort')}
              className="font-bold font-['Poppins'] text-center flex items-center justify-center space-x-1 hover:bg-[#d44e0f] px-2 py-1 rounded transition-colors"
            >
              <span>Submission Date</span>
              {getSortIcon('dateSort')}
            </button>
            <button
              onClick={() => handleSort('feedbackItems')}
              className="font-bold font-['Poppins'] text-center flex items-center justify-center space-x-1 hover:bg-[#d44e0f] px-2 py-1 rounded transition-colors"
            >
              <span># of Feedback Items</span>
              {getSortIcon('feedbackItems')}
            </button>
            <button
              onClick={() => handleSort('severity')}
              className="font-bold font-['Poppins'] text-center flex items-center justify-center space-x-1 hover:bg-[#d44e0f] px-2 py-1 rounded transition-colors"
            >
              <span>Severity</span>
              {getSortIcon('severity')}
            </button>
          </div>
        </div>
        
        {/* Table Body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredAndSortedData.map((project, index) => (
            <div 
              key={project.title} 
              className="grid grid-cols-5 gap-6 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {/* Project Title */}
              <div className="flex items-center">
                <span className="text-gray-800 dark:text-gray-200 font-medium font-['Poppins']">
                  {project.title}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-center justify-center">
                <span className={`font-bold text-lg ${getScoreColor(project.score)}`}>
                  {project.score}
                </span>
              </div>

              {/* Submission Date */}
              <div className="flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm font-['Poppins']">
                  {project.submissionDate}
                </span>
              </div>

              {/* Feedback Items */}
              <div className="flex items-center justify-center">
                <span className="text-gray-800 dark:text-gray-200 font-medium">
                  {project.feedbackItems}
                </span>
              </div>

              {/* Severity */}
              <div className="flex items-center justify-center">
                <span className={`font-medium ${getSeverityColor(project.severity)}`}>
                  {project.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#19181D] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-[#ED5E20] mb-2">{filteredAndSortedData.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-['Poppins']">
            {severityFilter === 'all' && scoreFilter === 'all' ? 'Total Projects' : 'Filtered Projects'}
          </div>
        </div>
        <div className="bg-white dark:bg-[#19181D] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
            {filteredAndSortedData.length > 0 
              ? Math.round(filteredAndSortedData.reduce((sum, p) => sum + p.score, 0) / filteredAndSortedData.length)
              : 0
            }
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-['Poppins']">Average Score</div>
        </div>
        <div className="bg-white dark:bg-[#19181D] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
            {filteredAndSortedData.length > 0 
              ? Math.round(filteredAndSortedData.reduce((sum, p) => sum + p.feedbackItems, 0) / filteredAndSortedData.length)
              : 0
            }
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-['Poppins']">Avg Feedback Items</div>
        </div>
        <div className="bg-white dark:bg-[#19181D] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            {filteredAndSortedData.length > 0 
              ? Math.round((filteredAndSortedData.filter(p => p.severity === 'Major').length / filteredAndSortedData.length) * 100)
              : 0
            }%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-['Poppins']">Major Issues</div>
        </div>
      </div>
    </div>
  );
}