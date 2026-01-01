import React from 'react';
import type { DesignStatus } from '../../types';
import './DesignComponents.css';

interface DesignWorkflowStepperProps {
  currentStatus: DesignStatus;
}

const DesignWorkflowStepper: React.FC<DesignWorkflowStepperProps> = ({ currentStatus }) => {
  const steps = [
    { status: 'DRAFT', label: 'Draft', number: 1 },
    { status: 'IN_PROGRESS', label: 'In Progress', number: 2 },
    { status: 'REVIEW_REQUIRED', label: 'Review Required', number: 3 },
    { status: 'APPROVED_FOR_PERMIT', label: 'Approved for Permit', number: 4 },
  ];

  const getStepStatus = (stepStatus: string) => {
    const statusOrder: Record<DesignStatus, number> = {
      DRAFT: 1,
      IN_PROGRESS: 2,
      REVIEW_REQUIRED: 3,
      REVISIONS_REQUESTED: 2,
      APPROVED_FOR_PERMIT: 4,
      SUPERSEDED: 0,
    };

    const currentOrder = statusOrder[currentStatus] || 0;
    const stepOrder = statusOrder[stepStatus as DesignStatus] || 0;

    if (stepOrder <= currentOrder && currentStatus !== 'REVISIONS_REQUESTED' && currentStatus !== 'SUPERSEDED') {
      return 'completed';
    }
    if (stepOrder === currentOrder) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <div className="design-workflow-stepper">
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step.status);
        return (
          <React.Fragment key={step.status}>
            <div className={`design-workflow-stepper__step design-workflow-stepper__step--${stepStatus}`}>
              <div className="design-workflow-stepper__step-number">{step.number}</div>
              <div className="design-workflow-stepper__step-label">{step.label}</div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`design-workflow-stepper__connector ${
                  stepStatus === 'completed' ? 'completed' : ''
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default DesignWorkflowStepper;

