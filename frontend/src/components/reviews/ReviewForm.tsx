import React, { useState } from 'react';
import { reviewsApi } from '../../lib/api';
import RatingInput from './RatingInput';
import './ReviewComponents.css';

interface ReviewFormProps {
  projectId: string;
  reviewSubject: {
    id: string;
    name: string;
    role: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ projectId, reviewSubject, onClose, onSuccess }) => {
  const [qualityRating, setQualityRating] = useState<number>(0);
  const [timelinessRating, setTimelinessRating] = useState<number>(0);
  const [communicationRating, setCommunicationRating] = useState<number>(0);
  const [professionalismRating, setProfessionalismRating] = useState<number>(0);
  const [valueRating, setValueRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [wouldHireAgain, setWouldHireAgain] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const calculateOverall = () => {
    const ratings = [
      qualityRating,
      timelinessRating,
      communicationRating,
      professionalismRating,
      valueRating,
    ].filter((r) => r > 0);
    
    return ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;
  };

  const overallRating = calculateOverall();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (overallRating === 0) {
      setError('Please provide at least one rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await reviewsApi.submitReview(projectId, {
        reviewSubjectId: reviewSubject.id,
        subjectRole: reviewSubject.role,
        qualityRating: qualityRating || undefined,
        timelinessRating: timelinessRating || undefined,
        communicationRating: communicationRating || undefined,
        professionalismRating: professionalismRating || undefined,
        valueRating: valueRating || undefined,
        title: title.trim() || undefined,
        reviewText: reviewText.trim() || undefined,
        pros: pros.trim() || undefined,
        cons: cons.trim() || undefined,
        wouldRecommend: wouldRecommend !== null ? wouldRecommend : undefined,
        wouldHireAgain: wouldHireAgain !== null ? wouldHireAgain : undefined,
      } as any);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-content review-modal-content--large" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <div>
            <h3>Write Review</h3>
            <div className="review-modal-subtitle">
              Review for {reviewSubject.name} ({reviewSubject.role.replace(/_/g, ' ')})
            </div>
          </div>
          <button className="review-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="review-modal-form">
          {error && <div className="review-modal-error">{error}</div>}

          <div className="review-form__ratings">
            <h4>Ratings (1-5 stars)</h4>
            <div className="review-form__rating-group">
              <RatingInput
                label="Quality of Work"
                value={qualityRating}
                onChange={setQualityRating}
              />
              <RatingInput
                label="Timeliness"
                value={timelinessRating}
                onChange={setTimelinessRating}
              />
              <RatingInput
                label="Communication"
                value={communicationRating}
                onChange={setCommunicationRating}
              />
              <RatingInput
                label="Professionalism"
                value={professionalismRating}
                onChange={setProfessionalismRating}
              />
              <RatingInput
                label="Value for Money"
                value={valueRating}
                onChange={setValueRating}
              />
            </div>
            {overallRating > 0 && (
              <div className="review-form__overall">
                <label>Overall Rating:</label>
                <div className="review-form__overall-value">
                  {overallRating.toFixed(1)} / 5.0
                </div>
              </div>
            )}
          </div>

          <div className="review-form__field">
            <label htmlFor="title">Review Title (Optional)</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Excellent contractor, highly recommended"
            />
          </div>

          <div className="review-form__field">
            <label htmlFor="reviewText">Review Text (Optional)</label>
            <textarea
              id="reviewText"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={5}
              placeholder="Share your experience working with this team member..."
            />
          </div>

          <div className="review-form__field-row">
            <div className="review-form__field">
              <label htmlFor="pros">Pros (Optional)</label>
              <textarea
                id="pros"
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                rows={3}
                placeholder="What did you like?"
              />
            </div>

            <div className="review-form__field">
              <label htmlFor="cons">Cons (Optional)</label>
              <textarea
                id="cons"
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                rows={3}
                placeholder="What could be improved?"
              />
            </div>
          </div>

          <div className="review-form__recommendations">
            <div className="review-form__field">
              <label>Would you recommend this person?</label>
              <div className="review-form__yes-no">
                <button
                  type="button"
                  className={`review-form__yes-no-button ${wouldRecommend === true ? 'active' : ''}`}
                  onClick={() => setWouldRecommend(true)}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`review-form__yes-no-button ${wouldRecommend === false ? 'active' : ''}`}
                  onClick={() => setWouldRecommend(false)}
                >
                  No
                </button>
              </div>
            </div>

            <div className="review-form__field">
              <label>Would you hire again?</label>
              <div className="review-form__yes-no">
                <button
                  type="button"
                  className={`review-form__yes-no-button ${wouldHireAgain === true ? 'active' : ''}`}
                  onClick={() => setWouldHireAgain(true)}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`review-form__yes-no-button ${wouldHireAgain === false ? 'active' : ''}`}
                  onClick={() => setWouldHireAgain(false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <div className="review-modal-actions">
            <button
              type="button"
              className="review-modal-button review-modal-button--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="review-modal-button"
              disabled={isSubmitting || overallRating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;

