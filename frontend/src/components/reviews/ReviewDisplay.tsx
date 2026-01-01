import React from 'react';
import type { ProjectReview } from '../../types';
import ReviewResponse from './ReviewResponse';
import './ReviewComponents.css';

interface ReviewDisplayProps {
  review: ProjectReview;
}

const ReviewDisplay: React.FC<ReviewDisplayProps> = ({ review }) => {
  const renderStars = (rating: number) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  return (
    <div className="review-display">
      <div className="review-display__header">
        <div className="review-display__reviewer">
          <h4>{review.reviewer?.firstName} {review.reviewer?.lastName}</h4>
          <div className="review-display__date">
            {new Date(review.createdAt).toLocaleDateString()}
          </div>
        </div>
        {review.overallRating && (
          <div className="review-display__overall-rating">
            <div className="review-display__rating-value">
              {review.overallRating.toFixed(1)}
            </div>
            <div className="review-display__rating-stars">
              {renderStars(review.overallRating)}
            </div>
          </div>
        )}
      </div>

      {review.title && (
        <div className="review-display__title">{review.title}</div>
      )}

      {review.reviewText && (
        <div className="review-display__text">{review.reviewText}</div>
      )}

      <div className="review-display__ratings">
        {review.qualityRating && (
          <div className="review-display__rating-item">
            <label>Quality:</label>
            <span>{renderStars(review.qualityRating)}</span>
          </div>
        )}
        {review.timelinessRating && (
          <div className="review-display__rating-item">
            <label>Timeliness:</label>
            <span>{renderStars(review.timelinessRating)}</span>
          </div>
        )}
        {review.communicationRating && (
          <div className="review-display__rating-item">
            <label>Communication:</label>
            <span>{renderStars(review.communicationRating)}</span>
          </div>
        )}
        {review.professionalismRating && (
          <div className="review-display__rating-item">
            <label>Professionalism:</label>
            <span>{renderStars(review.professionalismRating)}</span>
          </div>
        )}
        {review.valueRating && (
          <div className="review-display__rating-item">
            <label>Value:</label>
            <span>{renderStars(review.valueRating)}</span>
          </div>
        )}
      </div>

      {review.pros && (
        <div className="review-display__pros">
          <strong>Pros:</strong> {review.pros}
        </div>
      )}

      {review.cons && (
        <div className="review-display__cons">
          <strong>Cons:</strong> {review.cons}
        </div>
      )}

      <div className="review-display__recommendations">
        {review.wouldRecommend !== null && (
          <div>
            <strong>Would recommend:</strong>{' '}
            {review.wouldRecommend ? 'Yes' : 'No'}
          </div>
        )}
        {review.wouldHireAgain !== null && (
          <div>
            <strong>Would hire again:</strong>{' '}
            {review.wouldHireAgain ? 'Yes' : 'No'}
          </div>
        )}
      </div>

      {review.response && (
        <ReviewResponse response={review.response} />
      )}
    </div>
  );
};

export default ReviewDisplay;

