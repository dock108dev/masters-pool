import { Link } from 'react-router-dom';

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
    features: [
      'One pool per club',
      'Unlimited entries',
      'Live leaderboard',
      'Email notifications',
    ],
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
    description: 'Members choose any N golfers from the field. Best scoring picks count toward the total.',
    example: ['Pick 7 golfers', 'Best 5 scores count', 'Lowest aggregate wins'],
  },
  {
    title: 'Bucketed Pick',
    description: 'Members pick one golfer from each tier group, ensuring variety across the field.',
    example: ['1 pick from each tier', 'All picks scored', 'Lowest aggregate wins'],
  },
];

export function MarketingPage() {
  return (
    <div className="marketing-page" data-testid="marketing-page">
      <header className="marketing-header">
        <div className="marketing-logo">Club Golf Tools</div>
        <nav className="marketing-nav">
          <Link to="/sign-up" className="btn btn-primary marketing-cta-nav">
            Start Free
          </Link>
        </nav>
      </header>

      <section className="marketing-hero" data-testid="marketing-hero">
        <h1>Run your club's golf pool — no spreadsheets</h1>
        <p className="marketing-hero-sub">
          Set up a Masters, PGA Championship, or any major pool in minutes.
          Share a link, collect entries, and follow the leaderboard live.
        </p>
        <Link to="/sign-up" className="btn btn-primary marketing-start-free" data-testid="start-free-btn">
          Start Free
        </Link>
      </section>

      <section className="marketing-formats" data-testid="marketing-formats">
        <h2>Formats your club will love</h2>
        <div className="format-demos">
          {FORMAT_DEMOS.map((demo) => (
            <div key={demo.title} className="format-demo-card" data-testid={`format-demo-${demo.title.toLowerCase().replace(' ', '-')}`}>
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

      <footer className="marketing-footer">
        <p>Club Golf Tools &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
