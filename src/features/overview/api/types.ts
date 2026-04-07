// ─── Stat Cards ──────────────────────────────────────────────

export interface StudentStatCards {
  activeApplications: number;
  interviews: number;
  accepted: boolean;
  hoursThisWeek: number;
  totalGoals: number;
  completedGoals: number;
  savedPositions: number;
}

// ─── Application Status (Pie) ────────────────────────────────

/** Maps status string → count, e.g. { submitted: 3, interview: 1 } */
export type ApplicationStatusData = Record<string, number>;

// ─── Weekly Hours (Bar) ──────────────────────────────────────

export interface WeeklyHoursEntry {
  week: string;
  development: number;
  meeting: number;
  learning: number;
  other: number;
}

// ─── Goals Progress ──────────────────────────────────────────

export interface GoalsData {
  totalGoals: number;
  completedGoals: number;
}

// ─── Recent Activity ─────────────────────────────────────────

export interface RecentApplication {
  id: string;
  status: string;
  companyName: string;
  internshipTitle: string;
  appliedAt: string;
}

export interface RecentActivityData {
  applications: RecentApplication[];
  journal: {
    weekNumber: number;
    mood: string;
    date: string;
  } | null;
  meeting: {
    summary: string;
    date: string;
  } | null;
  feedback: {
    type: string;
    category: string;
    date: string;
  } | null;
}
