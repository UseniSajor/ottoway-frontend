import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EscrowListPage() {
  const navigate = useNavigate();
  const [escrows, setEscrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEscrows();
  }, []);

  const loadEscrows = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiBaseUrl}/escrow`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEscrows(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (error) {
      console.error('Failed to load escrow agreements:', error);
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

  if (escrows.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Escrow Agreements</h1>
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Escrow Agreements Yet</h2>
          <p className="text-gray-600 mb-6">Escrow agreements secure payments and protect all parties in the project</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Escrow Agreements</h1>

        <div className="space-y-4">
          {escrows.map((escrow) => (
            <div
              key={escrow.id}
              onClick={() => navigate(`/owner/escrow/${escrow.id}`)}
              className="bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Escrow Agreement</h3>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total Amount:</span>
                      <p className="font-bold text-lg text-gray-900">${escrow.totalAmount?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Released:</span>
                      <p className="font-medium text-green-600">${escrow.releasedAmount?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Held:</span>
                      <p className="font-medium text-blue-600">${escrow.heldAmount?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <p className="font-medium">{new Date(escrow.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  escrow.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  escrow.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {escrow.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
