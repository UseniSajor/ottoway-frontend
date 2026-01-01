import React from 'react';
import './ReviewComponents.css';

interface TeamMemberReviewCardProps {
  member: {
    id: string;
    name: string;
    role: string;
  };
  hasReview: boolean;
  onStartReview: () => void;
}

const TeamMemberReviewCard: React.FC<TeamMemberReviewCardProps> = ({
  member,
  hasReview,
  onStartReview,
}) => {
  return (
    <div className="team-member-review-card">
      <div className="team-member-review-card__info">
        <h4>{member.name}</h4>
        <div className="team-member-review-card__role">
          {member.role.replace(/_/g, ' ')}
        </div>
      </div>
      <div className="team-member-review-card__actions">
        {hasReview ? (
          <div className="team-member-review-card__status">
            ✓ Review Submitted
          </div>
        ) : (
          <button
            className="team-member-review-card__button"
            onClick={onStartReview}
          >
            Write Review
          </button>
        )}
      </div>
    </div>
  );
};

export default TeamMemberReviewCard;

