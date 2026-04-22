import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { ClubClaim } from '../../types/domain';

interface Feature {
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    title: 'Live Scoring',
    description:
      'Leaderboard updates in real-time as tournament rounds progress — ' +
      'no manual refresh required.',
  },
  {
    title: 'Self-Serve Setup',
    description:
      'Configure your pool and share an entry link in under ten minutes, ' +
      'no spreadsheets.',
  },
  {
    title: 'Custom Branding',
    description:
      "Your club's name and colors on every page your members see.",
  },
];

const PLAN = {
  name: 'Club Annual',
  price: '$299 / year',
  description:
    'Unlimited pools for your club all year — every major, every week.',
  features: [
    'Unlimited pools for 12 months',
    'Live leaderboard',
    'Flat pick and bucketed pick formats',
    'Custom branding',
    'CSV export',
    'Priority support',
  ],
};

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
      setError(
        err instanceof Error ? err.message : 'Failed to submit. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="marketing-page" data-testid="onboard-home-page">
      <header className="marketing-header">
        <div className="marketing-logo">Country Club Picks</div>
        <nav className="marketing-nav">
          <Link to="/checkout" className="btn btn-primary marketing-cta-nav">
            Get Started
          </Link>
        </nav>
      </header>

      <section className="marketing-hero" data-testid="marketing-hero">
        <h1>Run your club's golf pool — no spreadsheets</h1>
        <p className="marketing-hero-sub">
          Set up a Masters, PGA Championship, or any major pool in minutes.
          Share a link, collect entries, and follow the leaderboard live.
        </p>
        <Link
          to="/checkout"
          className="btn btn-primary marketing-start-free"
          data-testid="get-started-btn"
        >
          Get Started
        </Link>
      </section>

      <section className="marketing-features" data-testid="marketing-features">
        <h2>Everything your coordinator needs</h2>
        <div className="format-demos">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="format-demo-card"
              data-testid={`feature-${feature.title.toLowerCase().replace(' ', '-')}`}
            >
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="marketing-pricing" data-testid="marketing-pricing">
        <h2>Simple, transparent pricing</h2>
        <div className="pricing-tiers">
          <div
            className="pricing-card pricing-card--highlight"
            data-testid="pricing-tier"
          >
            <h3>{PLAN.name}</h3>
            <div className="pricing-price" data-testid="pricing-price">
              {PLAN.price}
            </div>
            <p>{PLAN.description}</p>
            <ul className="pricing-features">
              {PLAN.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Link
              to="/checkout"
              className="btn btn-primary pricing-cta"
              data-testid="pricing-cta"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="marketing-claim" id="claim" data-testid="claim-section">
        <h2>Talk to us first</h2>
        <p className="claim-intro">
          Tell us about your club. We'll get you set up with a dedicated
          subdomain and coordinator account.
        </p>

        {submitted ? (
          <div className="claim-success" role="status" data-testid="claim-success">
            <h3>Thanks — we got it.</h3>
            <p>
              We'll reach out within a business day. In the meantime, take a
              tour of a live demo:{' '}
              <a href="https://rvcc.countryclubpicks.com">
                rvcc.countryclubpicks.com
              </a>.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleClaimSubmit}
            className="claim-form"
            data-testid="claim-form"
          >
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
              <label htmlFor="claim-expected-entries">
                Expected number of entries
              </label>
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
              <p
                className="validation-error"
                role="alert"
                data-testid="claim-error"
              >
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
        <p>Country Club Picks &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
