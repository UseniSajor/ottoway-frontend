import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function ContractorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeJobs: 0,
    pendingBids: 0,
    upcomingPayments: 0,
    teamMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const projects = await api.projects.list();
      setStats({
        activeJobs: projects.length,
        pendingBids: 0,
        upcomingPayments: 0,
        teamMembers: 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Contractor Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div 
            onClick={() => navigate('/contractor/projects')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
          >
            <h3 className="text-white text-sm font-medium opacity-90 mb-2">Active Jobs</h3>
            <p className="text-4xl font-bold text-white">{stats.activeJobs}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg">
            <h3 className="text-white text-sm font-medium opacity-90 mb-2">Pending Bids</h3>
            <p className="text-4xl font-bold text-white">{stats.pendingBids}</p>
          </div>

          <div 
            onClick={() => navigate('/contractor/invoices')}
            className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
          >
            <h3 className="text-white text-sm font-medium opacity-90 mb-2">Payments Due</h3>
            <p className="text-4xl font-bold text-white">${stats.upcomingPayments.toLocaleString()}</p>
          </div>

          <div 
            onClick={() => navigate('/contractor/subcontractors')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
          >
            <h3 className="text-white text-sm font-medium opacity-90 mb-2">Team Members</h3>
            <p className="text-4xl font-bold text-white">{stats.teamMembers}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/contractor/projects')}
              className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <svg className="w-12 h-12 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium text-gray-700">View Projects</span>
            </button>

            <button
              onClick={() => navigate('/contractor/schedule')}
              className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition"
            >
              <svg className="w-12 h-12 text-green-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-gray-700">Schedule</span>
            </button>

            <button
              onClick={() => navigate('/contractor/invoices')}
              className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
            >
              <svg className="w-12 h-12 text-purple-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
              </svg>
              <span className="font-medium text-gray-700">Invoices</span>
            </button>

            <button
              onClick={() => navigate('/contractor/subcontractors')}
              className="flex flex-col items-center justify-center p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
            >
              <svg className="w-12 h-12 text-orange-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium text-gray-700">Subcontractors</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
