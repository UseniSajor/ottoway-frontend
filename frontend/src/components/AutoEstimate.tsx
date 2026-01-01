import { useState } from 'react';
import { api } from '../lib/api';

interface AutoEstimateProps {
  projectId: string;
  onEstimateGenerated?: (estimate: any) => void;
}

export default function AutoEstimate({ projectId, onEstimateGenerated }: AutoEstimateProps) {
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const generateEstimate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/estimates/projects/${projectId}/generate-estimate`);
      const data = (response as any)?.data || response;
      setEstimate(data.estimateData);
      onEstimateGenerated?.(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to generate estimate. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg font-medium">Generating AI-powered estimate...</p>
        <p className="text-gray-600 mt-2">This may take 10-15 seconds</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800 font-medium">{error}</p>
        </div>
        <button
          onClick={generateEstimate}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!estimate) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 border border-blue-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">AI-Powered Cost Estimate</h3>
          <p className="text-gray-700 mb-6">
            Get an instant, data-driven estimate for your project using advanced AI
          </p>
          <button
            onClick={generateEstimate}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Generate Estimate
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Total Estimate */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h3 className="text-xl font-bold mb-4">Estimated Project Cost</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Low</p>
            <p className="text-2xl font-bold text-green-700">
              ${estimate.totalEstimate?.low?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Most Likely</p>
            <p className="text-3xl font-bold text-green-800">
              ${estimate.totalEstimate?.mid?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">High</p>
            <p className="text-2xl font-bold text-green-700">
              ${estimate.totalEstimate?.high?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Cost Breakdown */}
      {estimate.breakdown && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Cost Breakdown</h3>
          <div className="space-y-3">
            {estimate.breakdown.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="font-medium">{item.category}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${item.percentage || 0}%` }}
                    />
                  </div>
                </div>
                <div className="text-right ml-6">
                  <p className="font-bold text-lg">
                    ${item.mid?.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.percentage || 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Timeline */}
      {estimate.timeline && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold">Estimated Timeline</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600 mb-4">
            {estimate.timeline.estimatedDuration || 'N/A'}
          </p>
          {estimate.timeline.phases && (
            <div className="space-y-2">
              {estimate.timeline.phases.map((phase: any, index: number) => (
                <div key={index} className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">{phase.name}</span>
                  <span className="text-gray-600">{phase.duration}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Assumptions & Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="font-bold mb-2">Assumptions</h4>
        {estimate.assumptions && (
          <ul className="list-disc list-inside space-y-1 text-sm mb-4">
            {estimate.assumptions.map((assumption: string, index: number) => (
              <li key={index} className="text-gray-700">{assumption}</li>
            ))}
          </ul>
        )}
        {estimate.disclaimer && (
          <p className="text-sm text-gray-700 italic border-t border-yellow-300 pt-3">
            {estimate.disclaimer}
          </p>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={generateEstimate}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
        >
          Regenerate
        </button>
        <button 
          onClick={async () => {
            try {
              // Get the estimate ID from the generated estimate
              const estimates = await api.get(`/estimates/projects/${projectId}/estimates`);
              const latest = (estimates as any)?.data?.[0];
              if (latest) {
                await api.post(`/estimates/estimates/${latest.id}/approve`);
                alert('Estimate approved!');
              }
            } catch (err) {
              console.error('Error approving estimate:', err);
            }
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Approve Estimate
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          Share with Contractor
        </button>
      </div>
    </div>
  );
}

