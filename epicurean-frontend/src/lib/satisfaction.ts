// Satisfaction survey (NPS 0-10) stored client-side, mirroring the mock
// orders/tables persistence. Balcão writes responses; Admin reads detractors.
export interface SurveyResponse {
  id: string;
  score: number; // 0-10
  comment?: string;
  createdAt: string;
}

export type NpsCategory = 'detractor' | 'passive' | 'promoter';

const KEY = 'epicurean_surveys';
export const DETRACTOR_MAX = 6;

export function getSurveys(): SurveyResponse[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SurveyResponse[];
  } catch {
    return [];
  }
}

export function addSurvey(score: number, comment?: string): SurveyResponse {
  const entry: SurveyResponse = {
    id: crypto.randomUUID(),
    score,
    comment: comment?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify([entry, ...getSurveys()]));
  return entry;
}

export function npsCategory(score: number): NpsCategory {
  if (score <= DETRACTOR_MAX) return 'detractor';
  if (score <= 8) return 'passive';
  return 'promoter';
}

// NPS = % promotores − % detratores, em uma escala de −100 a 100.
export function computeNps(list: SurveyResponse[]): number {
  if (list.length === 0) return 0;
  let promoters = 0;
  let detractors = 0;
  for (const r of list) {
    const c = npsCategory(r.score);
    if (c === 'promoter') promoters += 1;
    else if (c === 'detractor') detractors += 1;
  }
  return Math.round(((promoters - detractors) / list.length) * 100);
}
