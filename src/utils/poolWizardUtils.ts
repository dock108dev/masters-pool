import type { CreatePoolRequest } from '../types/domain';
import type { WizardFormState } from '../engines/wizardEngines';

export interface WizardState extends WizardFormState {
  tournament_id: number | null;
  pool_name: string;
  entry_deadline: string;
  max_entries_per_email: number;
}

export const ONBOARDING_WIZARD_KEY = 'onboarding-wizard-v1';

export interface OnboardingWizardState extends WizardState {
  step: number;
  club_name: string;
  club_slug: string;
  time_zone: string;
  lock_timing_source: 'auto' | 'manual';
  entry_fee_enabled: boolean;
  entry_fee_amount: number;
  entry_fee_currency: string;
}

function defaultWizardTimeZone(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return typeof tz === 'string' && tz.length > 0 ? tz : 'UTC';
}

export const DEFAULT_ONBOARDING_WIZARD_STATE: OnboardingWizardState = {
  step: 0,
  club_name: '',
  club_slug: '',
  time_zone: defaultWizardTimeZone(),
  tournament_id: null,
  pool_name: '',
  entry_deadline: '',
  max_entries_per_email: 1,
  engine_type: 'golf',
  format: null,
  buckets: [],
  pick_count: 7,
  count_best: 5,
  min_cuts_to_qualify: 5,
  bracket_rounds: 4,
  bracket_points_per_round: [1, 2, 4, 8],
  lock_timing_source: 'auto',
  entry_fee_enabled: false,
  entry_fee_amount: 0,
  entry_fee_currency: 'USD',
};

export function buildCreatePoolRequest(s: WizardState, clubCode: string): CreatePoolRequest {
  if (s.engine_type === 'bracket') {
    return {
      club_code: clubCode as CreatePoolRequest['club_code'],
      name: s.pool_name,
      tournament_id: s.tournament_id!,
      entry_deadline: s.entry_deadline,
      max_entries_per_email: s.max_entries_per_email,
      rules_json: {
        engine_type: 'bracket',
        variant: 'bracket',
        pick_count: 0,
        count_best: 0,
        min_cuts_to_qualify: 0,
        uses_buckets: false,
        bracket_rounds: s.bracket_rounds,
        bracket_points_per_round: s.bracket_points_per_round,
      },
    };
  }

  const isBucketed = s.format === 'bucketed';
  return {
    club_code: clubCode as CreatePoolRequest['club_code'],
    name: s.pool_name,
    tournament_id: s.tournament_id!,
    entry_deadline: s.entry_deadline,
    max_entries_per_email: s.max_entries_per_email,
    rules_json: {
      engine_type: 'golf',
      variant: isBucketed ? 'bucketed' : 'flat',
      pick_count: s.pick_count,
      count_best: s.count_best,
      min_cuts_to_qualify: s.min_cuts_to_qualify,
      uses_buckets: isBucketed,
      ...(isBucketed && s.buckets.length > 0 ? { buckets: s.buckets } : {}),
    },
  };
}
