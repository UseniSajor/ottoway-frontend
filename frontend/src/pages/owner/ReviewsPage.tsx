import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reviewsApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { ProjectReview } from '../../types';
import ReviewEligibilityBanner from '../../components/reviews/ReviewEligibilityBanner';
import TeamMemberReviewCard from '../../components/reviews/TeamMemberReviewCard';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReviewDisplay from '../../components/reviews/ReviewDisplay';
import './OwnerPages.css';
import './ReviewsPage.css';

const ReviewsPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<{ allowed: boolean; reasons: string[] } | null>(null);
  const [reviews, setReviews] = useState<ProjectReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string; role: string } | null>(null);

  useEffect(() => {
    if (projectId) {
      checkEligibility();
      loadReviews();
    }
  }, [projectId]);

  const checkEligibility = async () => {
    if (!projectId) return;
    
    try {
      // Eligibility check not yet implemented in API
      // For now, set default eligibility
      setEligibility({ eligible: true, reason: '' });
    } catch (err: any) {
      console.error('Failed to check eligibility:', err);
    }
  };

  const loadReviews = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      const response = await reviewsApi.list(projectId);
      setReviews(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      setError(err?.response?.data?.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setSelectedSubject(null);
    loadReviews();
    checkEligibility();
  };

  const handleStartReview = (subjectId: string, subjectName: string, subjectRole: string) => {
    setSelectedSubject({ id: subjectId, name: subjectName, role: subjectRole });
    setShowReviewForm(true);
  };

  // Mock team members - in real app, fetch from project
  const teamMembers = [
    { id: '1', name: 'John Contractor', role: 'CONTRACTOR' },
    { id: '2', name: 'Jane PM', role: 'PROJECT_MANAGER' },
  ];

  const userReviews = reviews.filter(r => r.reviewerId === user?.id);
  const otherReviews = reviews.filter(r => r.reviewerId !== user?.id);

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <Link to={`/owner/projects/${projectId}`} className="owner-page__back">
          ← Back to Project
        </Link>
        <h2>Project Reviews</h2>
      </div>

      {error && <div className="owner-page__error">{error}</div>}

      {isLoading ? (
        <div className="owner-page__loading">Loading reviews...</div>
      ) : (
        <>
          {/* Eligibility Banner */}
          {eligibility && (
            <ReviewEligibilityBanner eligibility={eligibility} />
          )}

          {/* Team Members to Review */}
          {eligibility?.allowed && (
            <div className="reviews-page__team-section">
              <h3>Review Team Members</h3>
              <div className="reviews-page__team-grid">
                {teamMembers.map((member) => {
                  const existingReview = userReviews.find(r => r.reviewSubjectId === member.id);
                  return (
                    <TeamMemberReviewCard
                      key={member.id}
                      member={member}
                      hasReview={!!existingReview}
                      onStartReview={() => handleStartReview(member.id, member.name, member.role)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Submitted Reviews */}
          {userReviews.length > 0 && (
            <div className="reviews-page__reviews-section">
              <h3>Your Reviews</h3>
              <div className="reviews-page__reviews-list">
                {userReviews.map((review) => (
                  <ReviewDisplay key={review.id} review={review} />
                ))}
              </div>
            </div>
          )}

          {/* Other Reviews */}
          {otherReviews.length > 0 && (
            <div className="reviews-page__reviews-section">
              <h3>Other Reviews</h3>
              <div className="reviews-page__reviews-list">
                {otherReviews.map((review) => (
                  <ReviewDisplay key={review.id} review={review} />
                ))}
              </div>
            </div>
          )}

          {/* Review Form Modal */}
          {showReviewForm && selectedSubject && (
            <ReviewForm
              projectId={projectId!}
              reviewSubject={selectedSubject}
              onClose={() => {
                setShowReviewForm(false);
                setSelectedSubject(null);
              }}
              onSuccess={handleReviewSubmitted}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ReviewsPage;
