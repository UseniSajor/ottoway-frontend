import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../../lib/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    pendingApprovals: 0,
    platformRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const projects = await projectsApi.list();
      setStats({
        totalUsers: 0,
        totalProjects: projects.length,
        pendingApprovals: 0,
        platformRevenue: 0,
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div 
            onClick={() => navigate('/admin/users')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
          >
            <h3 className="text-white text-sm font-medium opacity-90 mb-2">Total Users</h3>
            <p className="text-4xl font-bold text-white">{stats.totalUsers}</p>
          </div>

          <div 
            onClick={() => navigate('/admin/projects')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
          >
            <h3 className="text-white text-sm font-medium opacity-90 mb-2">Total Projects</h3>
            <p className="text-4xl font-bold text-white">{stats.totalProjects}</p>
          </div>

          <div 
            onClick={() => navigate('/admin/approvals')}
            className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
          >
            <h3 className="text-white text-sm font-medium opacity-90 mb-2">Pending Approvals</h3>
            <p className="text-4xl font-bold text-white">{stats.pendingApprovals}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg">
            <h3 className="text-white text-sm font-medium opacity-90 mb-2">Platform Revenue</h3>
            <p className="text-4xl font-bold text-white">${stats.platformRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <svg className="w-12 h-12 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="font-medium text-gray-700">User Management</span>
            </button>

            <button
              onClick={() => navigate('/admin/approvals')}
              className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition"
            >
              <svg className="w-12 h-12 text-green-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-gray-700">Approvals</span>
            </button>

            <button
              onClick={() => navigate('/admin/escrow')}
              className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
            >
              <svg className="w-12 h-12 text-purple-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-gray-700">Escrow Monitor</span>
            </button>

            <button
              onClick={() => navigate('/admin/disputes')}
              className="flex flex-col items-center justify-center p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
            >
              <svg className="w-12 h-12 text-orange-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium text-gray-700">Disputes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
