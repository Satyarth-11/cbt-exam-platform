export interface QuestionSession {
  id: string;
  subject: string; // dynamic: PHYSICS, CHEMISTRY, MATHEMATICS, SSC, NEET, BANKING, JEE, UPSC, GATE, etc.
  section: string;
  questionText: string;
  questionType: 'MCQ' | 'NUMERICAL' | 'MULTIPLE_CHOICE';
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  markingPositive: number;
  markingNegative: number;
  sequenceNumber: number;
  parentQuestionId?: string;
  passageText?: string;
}


export interface AnswerSession {
  questionId: string;
  selectedOption: string | null;
  numericalAnswer: number | null;
  status: 'NOT_VISITED' | 'NOT_ANSWERED' | 'ANSWERED' | 'MARKED_FOR_REVIEW' | 'ANSWERED_AND_MARKED_FOR_REVIEW';
}

export interface ExamSession {
  attemptId: string;
  examId: string;
  examTitle: string;
  remainingSeconds: number;
  questions: QuestionSession[];
  answers: AnswerSession[];
}
