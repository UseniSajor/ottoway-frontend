import React from 'react';
import './ReviewComponents.css';

interface RatingInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const RatingInput: React.FC<RatingInputProps> = ({ label, value, onChange }) => {
  return (
    <div className="rating-input">
      <label className="rating-input__label">{label}</label>
      <div className="rating-input__stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`rating-input__star ${star <= value ? 'active' : ''}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => {
              // Optional: Add hover effect
            }}
          >
            ★
          </button>
        ))}
        {value > 0 && (
          <span className="rating-input__value">{value} / 5</span>
        )}
      </div>
    </div>
  );
};

export default RatingInput;


