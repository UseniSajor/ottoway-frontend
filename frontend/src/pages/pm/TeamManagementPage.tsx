import React, { useState, useEffect } from 'react';
import { pmApi } from '../../lib/api';
import './PMPages.css';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  projects: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  workload: number;
}

const TeamManagementPage: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      setIsLoading(true);
      const response = await pmApi.getTeam();
      const data = (response as any)?.data || response;
      setTeamMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load team:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pm-team-page">
        <div className="pm-team-page__loading">Loading team...</div>
      </div>
    );
  }

  return (
    <div className="pm-team-page">
      <div className="pm-team-page__header">
        <h2>Team Management</h2>
      </div>

      {teamMembers.length === 0 ? (
        <div className="pm-team-page__empty">
          <p>No team members found.</p>
        </div>
      ) : (
        <div className="pm-team-page__team-list">
          {teamMembers.map((member) => (
            <div key={member.id} className="pm-team-page__team-card">
              <h3>{member.firstName} {member.lastName}</h3>
              <div className="pm-team-page__team-meta">
                <div>Email: {member.email}</div>
                <div>Role: {member.role}</div>
                <div>Workload: {member.workload} project(s)</div>
              </div>
              <div className="pm-team-page__team-projects">
                <strong>Projects:</strong>
                {member.projects.length === 0 ? (
                  <div>No projects assigned</div>
                ) : (
                  <ul>
                    {member.projects.map((project) => (
                      <li key={project.id}>
                        {project.name} ({project.role})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamManagementPage;

