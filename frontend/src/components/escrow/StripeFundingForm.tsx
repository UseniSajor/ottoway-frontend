import React, { useState } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { escrowApi } from '../../lib/api';
import type { EscrowAgreement } from '../../types';
import './EscrowComponents.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface StripeFundingFormProps {
  escrow: EscrowAgreement;
  onSuccess: () => void;
}

const FundingFormContent: React.FC<StripeFundingFormProps> = ({ escrow, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [_paymentMethod, setPaymentMethod] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error: pmError, paymentMethod: pm } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        throw pmError;
      }

      if (!pm) {
        throw new Error('Failed to create payment method');
      }

      setPaymentMethod(pm);

      // Fund escrow
      await escrowApi.fundEscrow(escrow.id, pm.id);
      onSuccess();
    } catch (err: any) {
      console.error('Funding error:', err);
      setError(err?.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-funding-form">
      {error && <div className="stripe-funding-form__error">{error}</div>}

      <div className="stripe-funding-form__amount">
        <div className="stripe-funding-form__amount-label">Amount to Fund</div>
        <div className="stripe-funding-form__amount-value">
          ${Number(escrow.totalAmount).toLocaleString()} {escrow.currency}
        </div>
      </div>

      <div className="stripe-funding-form__card-section">
        <label>Card Details</label>
        <div className="stripe-funding-form__card-element">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        className="stripe-funding-form__submit"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing...' : `Fund Escrow - $${Number(escrow.totalAmount).toLocaleString()}`}
      </button>

      <div className="stripe-funding-form__security">
        <span>🔒</span> Secure payment powered by Stripe
      </div>
    </form>
  );
};

const StripeFundingForm: React.FC<StripeFundingFormProps> = ({ escrow, onSuccess }) => {
  const options: StripeElementsOptions = {
    mode: 'payment',
    amount: Math.round(Number(escrow.totalAmount) * 100),
    currency: escrow.currency.toLowerCase(),
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <FundingFormContent escrow={escrow} onSuccess={onSuccess} />
    </Elements>
  );
};

export default StripeFundingForm;

