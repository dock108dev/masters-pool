import { useState } from 'react';

export interface ReferralWidgetProps {
  referralUrl: string;
  creditBalance: number;
  referredClubsCount: number;
}

export function ReferralWidget({ referralUrl, creditBalance, referredClubsCount }: ReferralWidgetProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // clipboard access may be blocked in some environments
    });
  }

  return (
    <div className="referral-widget" data-testid="referral-widget">
      <h3>Refer a Club</h3>
      <p className="referral-description">
        Share your referral link. When a referred club completes their first pool,
        you receive one free pool credit.
      </p>

      <div className="referral-url-row">
        <input
          className="referral-url-input"
          data-testid="referral-url-input"
          type="text"
          value={referralUrl}
          readOnly
          aria-label="Your referral link"
        />
        <button
          className="btn btn-secondary referral-copy-btn"
          data-testid="referral-copy-btn"
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="referral-stats">
        <span data-testid="referral-clubs-count">
          Referred clubs: <strong>{referredClubsCount}</strong>
        </span>
        <span data-testid="referral-credit-balance">
          Free pool credits: <strong>{creditBalance}</strong>
        </span>
      </div>
    </div>
  );
}
