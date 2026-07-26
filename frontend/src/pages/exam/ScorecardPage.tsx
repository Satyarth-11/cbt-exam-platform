import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  BarChart3, 
  ArrowLeft, 
  AlertCircle, 
  BookOpen, 
  Target, 
  TrendingUp, 
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

interface SubjectPerformance {
  subject: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  marksObtained: number;
  maxMarks: number;
  accuracyPercentage: number;
}

interface QuestionReview {
  questionId: string;
  sequenceNumber: number;
  subject: string;
  section: string;
  questionType: string;
  questionText: string;
  passageText?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  selectedOption?: string;
  correctOption?: string;
  selectedNumericalValue?: number;
  correctNumericalValue?: number;
  status: 'CORRECT' | 'INCORRECT' | 'UNATTEMPTED';
  marksAwarded: number;
  explanation: string;
}

interface ScorecardData {
  attemptId: string;
  examId: string;
  examTitle: string;
  candidateName: string;
  candidateEmail: string;
  score: number;
  totalMarks: number;
  percentage: number;
  percentile: number;
  rankPosition: number;
  totalCandidates: number;
  status: string;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  feedbackSummary: string;
  subjectBreakdown: SubjectPerformance[];
  questionReviews: QuestionReview[];
}

export const ScorecardPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for question reviews
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [expandedExplanationId, setExpandedExplanationId] = useState<string | null>(null);

  useEffect(() => {
    fetchScorecard();
  }, [attemptId]);

  const fetchScorecard = () => {
    setLoading(true);
    axiosClient.get(`/student/attempts/${attemptId}/scorecard`)
      .then((res: any) => {
        const data = res.data || res;
        setScorecard(data);
        setError(null);
      })
      .catch((err: any) => {
        console.error('Failed to load scorecard:', err);
        setError(err?.message || 'Failed to fetch candidate scorecard');
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading performance scorecard...</span>
        </div>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="max-w-4xl mx-auto p-8 my-12 glass-panel rounded-2xl border border-red-500/30 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Scorecard Unavailable</h2>
        <p className="text-sm text-slate-400">{error || 'Could not load attempt metrics.'}</p>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>
      </div>
    );
  }

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  // Question filter logic
  const filteredQuestions = scorecard.questionReviews.filter((q) => {
    const matchSubject = selectedSubject === 'ALL' || q.subject.toUpperCase() === selectedSubject.toUpperCase();
    const matchStatus = selectedStatusFilter === 'ALL' || q.status === selectedStatusFilter;
    return matchSubject && matchStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-semibold inline-flex items-center gap-2 border border-slate-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="text-right">
          <h1 className="text-xl font-bold text-white">{scorecard.examTitle}</h1>
          <p className="text-xs text-slate-400">Candidate: {scorecard.candidateName} ({scorecard.candidateEmail})</p>
        </div>
      </div>

      {/* Main Performance Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/40 to-cyan-950/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* Column 1: Overall Score */}
          <div className="space-y-2 text-center md:text-left border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Score</span>
            <div className="text-4xl font-extrabold text-white flex items-baseline gap-1">
              <span className="text-cyan-400">{scorecard.score}</span>
              <span className="text-sm font-semibold text-slate-400">/ {scorecard.totalMarks}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
              <Target className="w-3.5 h-3.5" /> Percentage: {scorecard.percentage}%
            </div>
          </div>

          {/* Column 2: Percentile Rank */}
          <div className="space-y-2 text-center md:text-left border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Percentile Rank</span>
            <div className="text-4xl font-extrabold text-emerald-400">
              {scorecard.percentile}<span className="text-lg">%ile</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Rank #{scorecard.rankPosition} of {scorecard.totalCandidates}
            </div>
          </div>

          {/* Column 3: Time Spent & Status */}
          <div className="space-y-2 text-center md:text-left border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attempt Status</span>
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                scorecard.status === 'SUBMITTED' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              }`}>
                {scorecard.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400">Duration: {formatDuration(scorecard.durationSeconds)}</p>
          </div>

          {/* Column 4: Feedback Summary */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" /> Performance Analysis
            </span>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {scorecard.feedbackSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Subject Performance Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          Subject-Wise Performance Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scorecard.subjectBreakdown.map((sub) => (
            <div key={sub.subject} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white uppercase tracking-wider">{sub.subject}</span>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                  {sub.accuracyPercentage}% Accuracy
                </span>
              </div>

              <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs text-slate-400">Score Obtained</span>
                <span className="text-lg font-bold text-white">{sub.marksObtained} / {sub.maxMarks}</span>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="font-bold text-emerald-400">{sub.correctCount}</div>
                  <div className="text-[10px] text-slate-400">Correct</div>
                </div>
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="font-bold text-red-400">{sub.incorrectCount}</div>
                  <div className="text-[10px] text-slate-400">Incorrect</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="font-bold text-slate-300">{sub.unattemptedCount}</div>
                  <div className="text-[10px] text-slate-400">Skipped</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 h-full" 
                    style={{ width: `${(sub.correctCount / sub.totalQuestions) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-red-500 h-full" 
                    style={{ width: `${(sub.incorrectCount / sub.totalQuestions) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-slate-700 h-full" 
                    style={{ width: `${(sub.unattemptedCount / sub.totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Question-by-Question Detailed Review */}
      <div className="space-y-6 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Question-by-Question Response Review
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review your responses against official correct options and solution explanations.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Subject Filter */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold text-slate-400">
              {['ALL', 'PHYSICS', 'CHEMISTRY', 'MATHEMATICS'].map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedSubject === subj ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'hover:text-white'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold text-slate-400">
              {[
                { label: 'All', key: 'ALL' },
                { label: 'Correct', key: 'CORRECT' },
                { label: 'Incorrect', key: 'INCORRECT' },
                { label: 'Skipped', key: 'UNATTEMPTED' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedStatusFilter(filter.key)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedStatusFilter === filter.key ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Questions Review Grid */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-sm">
              No questions found matching selected filter criteria.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isExpanded = expandedExplanationId === q.questionId;
              const isCorrect = q.status === 'CORRECT';
              const isIncorrect = q.status === 'INCORRECT';

              return (
                <div 
                  key={q.questionId}
                  className={`glass-panel p-6 rounded-2xl border transition-all space-y-4 ${
                    isCorrect 
                      ? 'border-emerald-500/30 bg-emerald-950/10' 
                      : isIncorrect 
                      ? 'border-red-500/30 bg-red-950/10' 
                      : 'border-slate-800 bg-slate-900/40'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-cyan-400 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                        Q{q.sequenceNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 uppercase">{q.subject} ({q.section.replace(/_/g, ' ')})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        isCorrect 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                          : isIncorrect 
                          ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {q.status} ({q.marksAwarded > 0 ? `+${q.marksAwarded}` : q.marksAwarded})
                      </span>
                    </div>
                  </div>

                  {/* Passage display if available */}
                  {q.passageText && (
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <span className="font-bold text-cyan-400 uppercase tracking-wider block">Passage Reference</span>
                      <p className="leading-relaxed">{q.passageText}</p>
                    </div>
                  )}

                  {/* Question Text */}
                  <div className="text-sm text-white font-medium leading-relaxed">
                    {q.questionText}
                  </div>

                  {/* MCQ Options Display */}
                  {q.questionType !== 'NUMERICAL' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {[
                        { key: 'A', text: q.optionA },
                        { key: 'B', text: q.optionB },
                        { key: 'C', text: q.optionC },
                        { key: 'D', text: q.optionD },
                      ].map((opt) => {
                        if (!opt.text) return null;
                        const isSelected = q.selectedOption?.split(',').includes(opt.key);
                        const isRightOpt = q.correctOption?.split(',').includes(opt.key);

                        let optionStyle = 'bg-slate-950 border-slate-800 text-slate-300';
                        if (isRightOpt) {
                          optionStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-bold';
                        } else if (isSelected && !isRightOpt) {
                          optionStyle = 'bg-red-500/20 border-red-500/60 text-red-200 font-bold';
                        }

                        return (
                          <div 
                            key={opt.key}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${optionStyle}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
                                {opt.key}
                              </span>
                              <span>{opt.text}</span>
                            </div>
                            {isRightOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            {isSelected && !isRightOpt && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Numerical Value Display
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Your Answer: <strong className="text-white">{q.selectedNumericalValue != null ? q.selectedNumericalValue : 'Skipped'}</strong></span>
                        <span className="text-emerald-400">Correct Value: <strong>{q.correctNumericalValue}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Solution Explanation Accordion */}
                  <div className="pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => setExpandedExplanationId(isExpanded ? null : q.questionId)}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isExpanded ? 'Hide Solution Explanation' : 'View Official Solution & Step-by-Step Explanation'}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                        <div className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> Official Solution & Key:
                        </div>
                        <p className="leading-relaxed text-slate-300">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
