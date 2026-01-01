import React from 'react';
import type { ReviewResponse as ReviewResponseType } from '../../types';
import './ReviewComponents.css';

interface ReviewResponseProps {
  response: ReviewResponseType;
}

const ReviewResponse: React.FC<ReviewResponseProps> = ({ response }) => {
  return (
    <div className="review-response">
      <div className="review-response__header">
        <div className="review-response__author">
          Response from {response.respondedBy?.firstName} {response.respondedBy?.lastName}
        </div>
        <div className="review-response__date">
          {new Date(response.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div className="review-response__text">{response.responseText}</div>
    </div>
  );
};

export default ReviewResponse;

