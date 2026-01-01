import React, { useState, useEffect } from 'react';
import { projectsApi } from '../../lib/api';
import './MLPages.css';

interface ProjectEvent {
  id: string;
  projectId: string;
  eventType: string;
  payload: any;
  createdAt: string;
}

const EventMonitorPage: React.FC = () => {
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      if (selectedProject) {
        try {
          const data = await projectsApi.getEvents(selectedProject);
          setEvents(data as ProjectEvent[]);
        } catch (error) {
          console.error('Failed to load events:', error);
        }
      }
      setIsLoading(false);
    };
    loadEvents();
  }, [selectedProject]);

  return (
    <div className="ml-page">
      <div className="ml-page__header">
        <h2>Event Monitor</h2>
      </div>

      <div className="ml-page__card">
        <div className="ml-page__filters">
          <label>Project ID</label>
          <input
            type="text"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            placeholder="Enter project ID..."
          />
        </div>

        {isLoading ? (
          <div className="ml-page__loading">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="ml-page__empty">No events found. Enter a project ID to view events.</div>
        ) : (
          <div className="ml-page__event-log">
            {events.map((event) => (
              <div key={event.id} className="ml-page__event-item">
                <div className="ml-page__event-time">
                  {new Date(event.createdAt).toLocaleString()}
                </div>
                <div><strong>{event.eventType}</strong></div>
                <pre>{JSON.stringify(event.payload, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventMonitorPage;



