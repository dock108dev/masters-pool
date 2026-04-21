import { SignUp } from '@clerk/clerk-react';

export function CoordinatorSignUpPage() {
  return (
    <div className="main-content coordinator-sign-up" data-testid="coordinator-sign-up">
      <h1>Create Your Free Account</h1>
      <p className="sign-up-subtext">
        No credit card required. Your first pool is on us.
      </p>
      <SignUp afterSignUpUrl="/rvcc/admin" redirectUrl="/rvcc/admin" />
    </div>
  );
}
