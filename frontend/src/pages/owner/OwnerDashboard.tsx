import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../../lib/api';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingActions: 0,
    upcomingMilestones: 0,
    totalInvestment: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const projects = await projectsApi.list();
      setStats({
        activeProjects: projects.filter((p: any) => 
          ['DESIGN', 'CONSTRUCTION', 'READINESS'].includes(p.status)
        ).length,
        pendingActions: 0,
        upcomingMilestones: 0,
        totalInvestment: 0,
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Owner Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div 
            onClick={() => navigate('/owner/projects')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white text-sm font-medium opacity-90">Active Projects</h3>
              <svg className="w-8 h-8 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-white">{stats.activeProjects}</p>
          </div>

          <div 
            onClick={() => navigate('/owner/contracts')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white text-sm font-medium opacity-90">Pending Actions</h3>
              <svg className="w-8 h-8 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-white">{stats.pendingActions}</p>
          </div>

          <div 
            onClick={() => navigate('/owner/milestones')}
            className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white text-sm font-medium opacity-90">Milestones</h3>
              <svg className="w-8 h-8 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-white">{stats.upcomingMilestones}</p>
          </div>

          <div 
            onClick={() => navigate('/owner/escrow')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white text-sm font-medium opacity-90">Total Investment</h3>
              <svg className="w-8 h-8 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-white">${stats.totalInvestment.toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/owner/projects/new')}
              className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition group"
            >
              <svg className="w-12 h-12 text-blue-600 mb-3 group-hover:scale-110 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium text-gray-700">New Project</span>
            </button>

            <button
              onClick={() => navigate('/owner/contracts')}
              className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition group"
            >
              <svg className="w-12 h-12 text-green-600 mb-3 group-hover:scale-110 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium text-gray-700">Review Contracts</span>
            </button>

            <button
              onClick={() => navigate('/owner/escrow')}
              className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition group"
            >
              <svg className="w-12 h-12 text-purple-600 mb-3 group-hover:scale-110 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="font-medium text-gray-700">Manage Escrow</span>
            </button>

            <button
              onClick={() => navigate('/owner/permits')}
              className="flex flex-col items-center justify-center p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition group"
            >
              <svg className="w-12 h-12 text-orange-600 mb-3 group-hover:scale-110 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-medium text-gray-700">Track Permits</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400 mt-2">Activity will appear here as you use the platform</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                  </div>
                  <span className="text-sm text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

