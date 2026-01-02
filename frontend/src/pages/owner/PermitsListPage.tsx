import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PermitsListPage() {
  const navigate = useNavigate();
  const [permits, setPermits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermits();
  }, []);

  const loadPermits = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.DEV 
        ? (import.meta.env.VITE_API_URL || 'http://localhost:5001/api')
        : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api');
      const response = await fetch(`${apiBaseUrl}/permits`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPermits(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (error) {
      console.error('Failed to load permits:', error);
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

  if (permits.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Permits</h1>
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Permits Yet</h2>
          <p className="text-gray-600 mb-6">Permits will appear here as they are submitted and approved</p>
          <button
            onClick={() => navigate('/owner/projects')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Permits</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {permits.map((permit) => (
            <div
              key={permit.id}
              onClick={() => navigate(`/owner/permits/${permit.id}`)}
              className="bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{permit.permitSetName}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  permit.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  permit.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                  permit.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {permit.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Jurisdiction:</span>
                  <span className="font-medium">{permit.jurisdiction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Authority:</span>
                  <span className="font-medium">{permit.permitAuthority}</span>
                </div>
                {permit.submittedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submitted:</span>
                    <span className="font-medium">{new Date(permit.submittedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
