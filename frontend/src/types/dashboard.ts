export interface ExamSummary {
  id: string;
  title: string;
  description: string;
  subject: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'DRAFT';
}

export interface AttemptHistory {
  attemptId: string;
  examId: string;
  examTitle: string;
  subject: string;
  status: string;
  startedAt: string;
  submittedAt: string;
  score: number;
  percentage: number;
  rankPosition: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnattempted: number;
  physicsScore: number;
  chemistryScore: number;
  mathsScore: number;
  percentile: number;
  feedbackSummary: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface StudentDashboardSummary {
  totalAttempts: number;
  averageScore: number;
  highestPercentile: number;
  unreadNotificationsCount: number;
  upcomingExams: ExamSummary[];
  recentAttempts: AttemptHistory[];
  notifications: NotificationItem[];
}

export interface MonthlyAttemptChart {
  month: string;
  attempts: number;
  avgPercentile: number;
}

export interface SubjectScoreChart {
  subject: string;
  avgAccuracy: number;
  totalExams: number;
}

export interface AdminDashboardSummary {
  totalActiveStudents: number;
  totalExams: number;
  liveExamsCount: number;
  totalCompletedAttempts: number;
  violationCountPlaceholder: number;
  recentExams: ExamSummary[];
  monthlyAttemptTrends: MonthlyAttemptChart[];
  subjectScoreSpread: SubjectScoreChart[];
}
