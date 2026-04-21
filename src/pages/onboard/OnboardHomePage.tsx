import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { ClubClaim } from '../../types/domain';

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  ctaPath: string;
  highlight: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Trial',
    price: 'Free',
    description: 'One pool, no credit card required.',
    features: ['One pool per club', 'Unlimited entries', 'Live leaderboard', 'Email notifications'],
    cta: 'Start Free',
    ctaPath: '/sign-up',
    highlight: false,
  },
  {
    name: 'Season',
    price: '$49 / pool',
    description: 'Run as many pools as your club needs.',
    features: [
      'Unlimited pools',
      'All formats supported',
      'Custom branding',
      'CSV export',
      'Priority support',
    ],
    cta: 'Get Started',
    ctaPath: '/sign-up',
    highlight: true,
  },
];

interface FormatDemo {
  title: string;
  description: string;
  example: string[];
}

const FORMAT_DEMOS: FormatDemo[] = [
  {
    title: 'Flat Pick',
    description:
      'Members choose any N golfers from the field. Best scoring picks count toward the total.',
    example: ['Pick 7 golfers', 'Best 5 scores count', 'Lowest aggregate wins'],
  },
  {
    title: 'Bucketed Pick',
    description:
      'Members pick one golfer from each tier group, ensuring variety across the field.',
    example: ['1 pick from each tier', 'All picks scored', 'Lowest aggregate wins'],
  },
];

export function OnboardHomePage() {
  const [clubName, setClubName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [expectedEntries, setExpectedEntries] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClaimSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const claim: ClubClaim = {
        club_name: clubName.trim(),
        contact_email: contactEmail.trim(),
        expected_entries: expectedEntries ? Number(expectedEntries) : null,
        notes: notes.trim(),
      };
      await apiClient.submitClubClaim(claim);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="marketing-page" data-testid="onboard-home-page">
      <header className="marketing-header">
        <div className="marketing-logo">Club Golf Tools</div>
        <nav className="marketing-nav">
          <a href="#claim" className="btn btn-secondary">Claim Your Club</a>
          <Link to="/sign-up" className="btn btn-primary marketing-cta-nav">Start Free</Link>
        </nav>
      </header>

      <section className="marketing-hero" data-testid="marketing-hero">
        <h1>Run your club's golf pool — no spreadsheets</h1>
        <p className="marketing-hero-sub">
          Set up a Masters, PGA Championship, or any major pool in minutes. Share a link, collect
          entries, and follow the leaderboard live.
        </p>
        <Link to="/sign-up" className="btn btn-primary marketing-start-free" data-testid="start-free-btn">
          Start Free
        </Link>
      </section>

      <section className="marketing-formats" data-testid="marketing-formats">
        <h2>Formats your club will love</h2>
        <div className="format-demos">
          {FORMAT_DEMOS.map((demo) => (
            <div
              key={demo.title}
              className="format-demo-card"
              data-testid={`format-demo-${demo.title.toLowerCase().replace(' ', '-')}`}
            >
              <h3>{demo.title}</h3>
              <p>{demo.description}</p>
              <ul>
                {demo.example.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="marketing-pricing" data-testid="marketing-pricing">
        <h2>Simple, transparent pricing</h2>
        <div className="pricing-tiers">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`pricing-card ${tier.highlight ? 'pricing-card--highlight' : ''}`}
              data-testid={`pricing-tier-${tier.name.toLowerCase()}`}
            >
              <h3>{tier.name}</h3>
              <div className="pricing-price">{tier.price}</div>
              <p>{tier.description}</p>
              <ul className="pricing-features">
                {tier.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link to={tier.ctaPath} className="btn btn-primary pricing-cta">
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="marketing-claim" id="claim" data-testid="claim-section">
        <h2>Claim your club</h2>
        <p className="claim-intro">
          Tell us about your club. We'll get you set up with a dedicated subdomain and coordinator
          account.
        </p>

        {submitted ? (
          <div className="claim-success" role="status" data-testid="claim-success">
            <h3>Thanks — we got it.</h3>
            <p>
              We'll reach out within a business day. In the meantime, take a tour of a live demo:{' '}
              <a href="https://rvcc.dock108.dev">rvcc.dock108.dev</a>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleClaimSubmit} className="claim-form" data-testid="claim-form">
            <div className="form-group">
              <label htmlFor="claim-club-name">Club name</label>
              <input
                id="claim-club-name"
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                required
                data-testid="claim-club-name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="claim-contact-email">Contact email</label>
              <input
                id="claim-contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                data-testid="claim-contact-email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="claim-expected-entries">Expected number of entries</label>
              <input
                id="claim-expected-entries"
                type="number"
                min={1}
                value={expectedEntries}
                onChange={(e) => setExpectedEntries(e.target.value)}
                data-testid="claim-expected-entries"
              />
            </div>
            <div className="form-group">
              <label htmlFor="claim-notes">Notes</label>
              <textarea
                id="claim-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                data-testid="claim-notes"
              />
            </div>
            {error && (
              <p className="validation-error" role="alert" data-testid="claim-error">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              data-testid="claim-submit"
            >
              {submitting ? 'Submitting…' : 'Request access'}
            </button>
          </form>
        )}
      </section>

      <footer className="marketing-footer">
        <p>Club Golf Tools &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
