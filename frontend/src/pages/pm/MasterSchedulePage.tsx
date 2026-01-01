import React, { useState, useEffect } from 'react';
import { pmApi } from '../../lib/api';
import './PMPages.css';

interface ScheduleItem {
  id: string;
  projectId: string;
  projectName: string;
  type: string;
  title: string;
  description?: string;
  scheduledDate: string | null;
  status: string;
}

const MasterSchedulePage: React.FC = () => {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setIsLoading(true);
      const response = await pmApi.getSchedule();
      const data = (response as any)?.data || response;
      setScheduleItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pm-schedule-page">
        <div className="pm-schedule-page__loading">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="pm-schedule-page">
      <div className="pm-schedule-page__header">
        <h2>Master Schedule</h2>
        <div>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 16px',
              marginRight: '8px',
              background: viewMode === 'list' ? '#0066cc' : '#f5f5f5',
              color: viewMode === 'list' ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            style={{
              padding: '8px 16px',
              background: viewMode === 'calendar' ? '#0066cc' : '#f5f5f5',
              color: viewMode === 'calendar' ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Calendar View
          </button>
        </div>
      </div>

      <div className="pm-schedule-page__content">
        {scheduleItems.length === 0 ? (
          <div className="pm-schedule-page__empty">
            <p>No schedule items found.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Project</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {scheduleItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>
                      {item.scheduledDate
                        ? new Date(item.scheduledDate).toLocaleDateString()
                        : 'TBD'}
                    </td>
                    <td style={{ padding: '12px' }}>{item.projectName}</td>
                    <td style={{ padding: '12px' }}>{item.type}</td>
                    <td style={{ padding: '12px' }}>{item.title}</td>
                    <td style={{ padding: '12px' }}>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pm-schedule-page__empty">
            <p>Calendar view coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterSchedulePage;

