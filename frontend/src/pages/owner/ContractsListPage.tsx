import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ContractsListPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.DEV 
        ? (import.meta.env.VITE_API_URL || 'http://localhost:5001/api')
        : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api');
      const response = await fetch(`${apiBaseUrl}/contracts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setContracts(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (error) {
      console.error('Failed to load contracts:', error);
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

  if (contracts.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Contracts</h1>
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Contracts Yet</h2>
          <p className="text-gray-600 mb-6">Contracts will appear here once projects are created and contractors are assigned</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Contracts</h1>

        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              onClick={() => navigate(`/owner/contracts/${contract.id}`)}
              className="bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{contract.contractName}</h3>
                  <p className="text-gray-600 mb-4">{contract.contractType}</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total Value:</span>
                      <p className="font-medium">${contract.totalValue?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <p className="font-medium">{new Date(contract.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">End Date:</span>
                      <p className="font-medium">{new Date(contract.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  contract.status === 'FULLY_SIGNED' ? 'bg-green-100 text-green-800' :
                  contract.status === 'PARTIALLY_SIGNED' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {contract.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
