import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function MLDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeRecommendations: 0,
    automationActions: 0,
    modelAccuracy: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // ML dashboard stats would come from ML API endpoints
      setStats({
        totalEvents: 0,
        activeRecommendations: 0,
        automationActions: 0,
        modelAccuracy: 0,
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">ML Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div 
            onClick={() => navigate('/ml/events')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
          >
            <h3 className="text-white text-sm font-medium opacity-90 mb-2">Total Events</h3>
            <p className="text-4xl font-bold text-white">{stats.totalEvents}</p>
          </div>

          <div 
            onClick={() => navigate('/ml/recommendations')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
          >
            <h3 className="text-white text-sm font-medium opacity-90 mb-2">Recommendations</h3>
            <p className="text-4xl font-bold text-white">{stats.activeRecommendations}</p>
          </div>

          <div 
            onClick={() => navigate('/ml/automation')}
            className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition transform hover:scale-105"
          >
            <h3 className="text-white text-sm font-medium opacity-90 mb-2">Automation Actions</h3>
            <p className="text-4xl font-bold text-white">{stats.automationActions}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg">
            <h3 className="text-white text-sm font-medium opacity-90 mb-2">Model Accuracy</h3>
            <p className="text-4xl font-bold text-white">{stats.modelAccuracy}%</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/ml/events')}
              className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <svg className="w-12 h-12 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <span className="font-medium text-gray-700">Event Monitor</span>
            </button>

            <button
              onClick={() => navigate('/ml/recommendations')}
              className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition"
            >
              <svg className="w-12 h-12 text-green-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="font-medium text-gray-700">Recommendations</span>
            </button>

            <button
              onClick={() => navigate('/ml/scores')}
              className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
            >
              <svg className="w-12 h-12 text-purple-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium text-gray-700">Model Scores</span>
            </button>

            <button
              onClick={() => navigate('/ml/automation')}
              className="flex flex-col items-center justify-center p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
            >
              <svg className="w-12 h-12 text-orange-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-medium text-gray-700">Automation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
