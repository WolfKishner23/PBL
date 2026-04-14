import React from 'react';

const steps = [
  { id: 1, label: 'Seller uploaded invoice', statuses: ['submitted', 'review', 'confirmed', 'approved', 'funded', 'paid', 'closed'] },
  { id: 2, label: 'Buyer confirmed debt', statuses: ['confirmed', 'approved', 'funded', 'paid', 'closed'] },
  { id: 3, label: 'Finance Partner reviewed risk', statuses: ['approved', 'funded', 'paid', 'closed'] },
  { id: 4, label: 'Early payment sent', statuses: ['funded', 'paid', 'closed'] },
  { id: 5, label: 'Buyer paid normally', statuses: ['paid', 'closed'] },
  { id: 6, label: 'Invoice closed', statuses: ['closed'] },
];

export default function Timeline({ status }) {
  return (
    <div className="invoice-timeline">
      {steps.map((step, index) => {
        const isCompleted = step.statuses.includes(status);
        const isNext = !isCompleted && (index === 0 || steps[index - 1].statuses.includes(status));
        
        return (
          <div key={step.id} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isNext ? 'active' : ''}`}>
            <div className="step-marker">
              {isCompleted ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="step-num">{step.id}</span>
              )}
            </div>
            <div className="step-content">
              <span className="step-label">{step.label}</span>
              {isCompleted && <span className="step-check">✅</span>}
            </div>
            {index < steps.length - 1 && <div className="step-connector"></div>}
          </div>
        );
      })}

      <style jsx>{`
        .invoice-timeline {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin: 24px 0;
          padding: 0 10px;
          gap: 8px;
        }
        .timeline-step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          text-align: center;
        }
        .step-marker {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1.5px solid var(--border-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          transition: all 0.3s ease;
          z-index: 2;
          color: var(--gray-400);
        }
        .step-num {
          font-size: 10px;
          font-weight: 700;
          font-family: var(--font-mono);
        }
        .timeline-step.completed .step-marker {
          background: var(--blue);
          border-color: var(--blue);
          color: white;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
        }
        .timeline-step.active .step-marker {
          border-color: var(--blue);
          color: var(--blue);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .step-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .step-label {
          font-size: 10px;
          font-weight: 500;
          color: var(--gray-400);
          line-height: 1.2;
          max-width: 80px;
        }
        .timeline-step.completed .step-label {
          color: var(--gray-200);
        }
        .step-check {
          font-size: 8px;
        }
        .step-connector {
          position: absolute;
          top: 12px;
          left: calc(50% + 12px);
          width: calc(100% - 24px);
          height: 1.5px;
          background: var(--border-dim);
          z-index: 1;
        }
        .timeline-step.completed .step-connector {
          background: var(--blue);
        }
      `}</style>
    </div>
  );
}
