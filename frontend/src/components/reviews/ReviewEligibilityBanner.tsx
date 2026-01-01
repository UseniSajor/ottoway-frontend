import React from 'react';
import './ReviewComponents.css';

interface ReviewEligibilityBannerProps {
  eligibility: {
    allowed: boolean;
    reasons: string[];
  };
}

const ReviewEligibilityBanner: React.FC<ReviewEligibilityBannerProps> = ({ eligibility }) => {
  if (eligibility.allowed) {
    return (
      <div className="review-eligibility-banner review-eligibility-banner--allowed">
        <div className="review-eligibility-banner__icon">✓</div>
        <div className="review-eligibility-banner__content">
          <h3>Ready to Submit Reviews</h3>
          <p>All requirements have been met. You can now submit reviews for team members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-eligibility-banner review-eligibility-banner--locked">
      <div className="review-eligibility-banner__icon">🔒</div>
      <div className="review-eligibility-banner__content">
        <h3>Reviews Locked</h3>
        <p>Reviews are locked until the following requirements are met:</p>
        <ul className="review-eligibility-banner__reasons">
          {eligibility.reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReviewEligibilityBanner;

