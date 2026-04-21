import type { CreatePoolRequest } from '../types/domain';
import type { WizardFormState } from '../engines/wizardEngines';

export interface WizardState extends WizardFormState {
  tournament_id: number | null;
  pool_name: string;
  entry_deadline: string;
  max_entries_per_email: number;
}

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
