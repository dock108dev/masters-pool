import { Link } from 'react-router-dom';

export function OnboardWelcomePage() {
  return (
    <div className="main-content onboard-welcome" data-testid="onboard-welcome">
      <h1>You're all set up.</h1>
      <p>
        Thanks for creating an account. A coordinator will reach out to connect you to your club —
        or if you already have a club invite, click the link in your email to activate it.
      </p>
      <p>
        Want to see what your members will see?{' '}
        <a href="https://rvcc.dock108.dev">Take the RVCC demo tour</a>.
      </p>
      <Link to="/" className="btn btn-secondary">Back to home</Link>
    </div>
  );
}
