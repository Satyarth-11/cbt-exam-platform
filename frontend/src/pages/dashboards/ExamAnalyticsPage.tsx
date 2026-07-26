import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BarChart3, 
  Download, 
  Users, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Search,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

interface CandidateRank {
  rank: number;
  attemptId: string;
  userId: string;
  candidateName: string;
  email: string;
  score: number;
  percentage: number;
  percentile: number;
  status: string;
  violationCount: number;
  submittedAt: string;
}

interface SubjectPerformance {
  subject: string;
  totalQuestions: number;
  marksObtained: number;
  maxMarks: number;
  accuracyPercentage: number;
}

interface ExamAnalyticsData {
  examId: string;
  examTitle: string;
  subject: string;
  totalCandidatesAttempted: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  passPercentage: number;
  scoreDistribution: Record<string, number>;
  subjectAverages: SubjectPerformance[];
  candidateRankings: CandidateRank[];
}

export const ExamAnalyticsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<ExamAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchReport();
  }, [examId]);

  const fetchReport = () => {
    setLoading(true);
    axiosClient.get(`/admin/analytics/exams/${examId}`)
      .then((res: any) => {
        const data = res.data || res;
        setReport(data);
        setError(null);
      })
      .catch((err: any) => {
        console.error('Failed to load exam analytics report:', err);
        setError(err?.message || 'Failed to fetch exam analytics report');
      })
      .finally(() => setLoading(false));
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('access_token');
    window.open(`/api/v1/admin/analytics/exams/${examId}/export?token=${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading exam analytics scoreboard...</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto p-8 my-12 glass-panel rounded-2xl border border-red-500/30 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Analytics Unavailable</h2>
        <p className="text-sm text-slate-400">{error || 'Could not load exam analytics report.'}</p>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Admin Console
        </button>
      </div>
    );
  }

  const filteredCandidates = report.candidateRankings.filter((c) =>
    c.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{report.examTitle}</h1>
            <p className="text-xs text-slate-400">Subject: {report.subject} | Analytics Summary & Rank Scoreboard</p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 inline-flex items-center justify-center gap-2 transition-all"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Attempted */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidates Attempted</span>
            <div className="text-2xl font-black text-white">{report.totalCandidatesAttempted}</div>
          </div>
        </div>

        {/* Card 2: Average Score */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Score</span>
            <div className="text-2xl font-black text-white">{report.averageScore}</div>
          </div>
        </div>

        {/* Card 3: Highest Score */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Highest Score</span>
            <div className="text-2xl font-black text-emerald-400">{report.highestScore}</div>
          </div>
        </div>

        {/* Card 4: Pass Rate */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pass Rate (≥40%)</span>
            <div className="text-2xl font-black text-purple-300">{report.passPercentage}%</div>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Charts / Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Distribution Bars */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 lg:col-span-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Candidate Score Range Distribution
          </h2>

          <div className="space-y-3 pt-2">
            {Object.entries(report.scoreDistribution).map(([range, count]) => {
              const maxCount = Math.max(1, ...Object.values(report.scoreDistribution));
              const pct = (count / maxCount) * 100;

              return (
                <div key={range} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Range: {range}</span>
                    <span className="text-cyan-400">{count} Candidate(s)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subject Averages Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white">Subject-Wise Averages</h2>
          <div className="space-y-3">
            {report.subjectAverages.map((sub) => (
              <div key={sub.subject} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white">{sub.subject}</span>
                  <span className="text-cyan-400">{sub.marksObtained} / {sub.maxMarks}</span>
                </div>
                <div className="text-[10px] text-slate-400">Accuracy: {sub.accuracyPercentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Candidate Rankings Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Candidate Merit Rankings</h2>
            <p className="text-xs text-slate-400">Rankings ordered by total score descending.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search candidate or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Percentage</th>
                <th className="py-3.5 px-4">Percentile</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Violations</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No candidates found.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => (
                  <tr key={c.attemptId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-cyan-400">#{c.rank}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{c.candidateName}</div>
                      <div className="text-[10px] text-slate-400">{c.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{c.score}</td>
                    <td className="py-3.5 px-4 font-medium">{c.percentage}%</td>
                    <td className="py-3.5 px-4 font-medium text-emerald-400">{c.percentile}%ile</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'SUBMITTED' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                      }`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.violationCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-bold">
                          <ShieldAlert className="w-3 h-3" /> {c.violationCount}
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/student/attempts/${c.attemptId}/scorecard`}
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                      >
                        Scorecard <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
