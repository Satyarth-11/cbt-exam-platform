import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Download, 
  Play, 
  Search, 
  Filter, 
  Award, 
  Clock, 
  CheckCircle2, 
  ArrowLeft,
  FileText,
  Sparkles
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

interface PypPaper {
  id: string;
  examType: string;
  title: string;
  year: number;
  shift: number;
  subject: string;
  totalQuestions: number;
  durationMinutes: number;
  difficulty: string;
  freeTrial?: boolean;
  createdAt: string;
}

export const PreviousYearPapersPage: React.FC = () => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<PypPaper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedExamType, setSelectedExamType] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startingAttemptId, setStartingAttemptId] = useState<string | null>(null);

  const examTypes = ['ALL', 'JEE_MAIN', 'JEE_ADVANCED', 'NEET', 'BITSAT', 'VITEEE', 'WBJEE', 'COMEDK', 'CUET'];

  const fetchCatalog = () => {
    setLoading(true);
    let url = '/student/pyp/papers';
    const params: string[] = [];
    if (selectedExamType !== 'ALL') params.push(`examType=${selectedExamType}`);
    if (selectedYear !== 'ALL') params.push(`year=${selectedYear}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    axiosClient.get(url)
      .then((res: any) => {
        const data = res.data || res;
        setPapers(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Failed to load PYP catalog:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedExamType, selectedYear]);

  const handleAttemptMock = (paperId: string) => {
    setStartingAttemptId(paperId);
    axiosClient.post(`/student/pyp/papers/${paperId}/attempt`)
      .then((res: any) => {
        const data = res.data || res;
        const attemptId = data?.attemptId;
        if (attemptId) {
          navigate(`/exam/take/${attemptId}`);
        } else {
          alert('Failed to initialize PYP exam session.');
        }
      })
      .catch((err: any) => {
        console.error('Failed to start PYP mock test:', err);
        const errMsg = typeof err === 'string' ? err : err?.message || err?.details?.[0] || err?.data?.message || '';
        if (errMsg.includes('INSUFFICIENT_CREDITS') || errMsg.includes('Credit')) {
          if (confirm('You require 1 Paper Credit or Unlimited VIP Access to attempt this paper. Would you like to view Paper Credit Bundles now?')) {
            navigate('/student/purchase-credits');
          }
        } else {
          alert(errMsg || 'Failed to start PYP test attempt.');
        }
      })
      .finally(() => setStartingAttemptId(null));
  };

  const handleDownloadPdf = (paperId: string, title: string) => {
    axiosClient.get(`/student/pyp/papers/${paperId}/pdf`, { responseType: 'blob' })
      .then((res: any) => {
        const url = window.URL.createObjectURL(new Blob([res]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${title.replace(/\s+/g, '_')}_Question_Paper.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => {
        console.error('Failed to download PDF:', err);
        alert('Failed to download PDF question paper.');
      });
  };

  const filteredPapers = papers.filter((p) => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.examType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 flex-1">
      {/* Header Banner */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            Previous Year Question Papers Catalog
            <span className="px-3 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold">
              Official NTA & Board Archive
            </span>
          </h1>
          <p className="text-xs text-slate-400">Practice authentic previous year question papers for JEE, NEET, BITSAT, WBJEE & CUET with step-by-step solutions or offline PDF downloads.</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-bold text-slate-400 mr-2 shrink-0">Exam:</span>
          {examTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedExamType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedExamType === type
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search papers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading Previous Year Papers Catalog...</div>
      ) : filteredPapers.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Previous Year Papers Found</h3>
          <p className="text-xs text-slate-400">Try adjusting your exam filter or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-6 shadow-xl relative group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider">
                      {paper.examType.replace('_', ' ')} • {paper.year}
                    </span>
                    {paper.freeTrial ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                        ⭐ Free Trial
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-extrabold uppercase">
                        🪙 1 Credit
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    paper.difficulty === 'HARD'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {paper.difficulty}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white group-hover:text-cyan-400 transition-colors leading-snug">
                  {paper.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" /> {paper.totalQuestions} Questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" /> {paper.durationMinutes} Mins
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center gap-3">
                <button
                  onClick={() => handleAttemptMock(paper.id)}
                  disabled={startingAttemptId === paper.id}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {startingAttemptId === paper.id ? 'Starting...' : 'Attempt as Mock Test'}
                </button>

                <button
                  onClick={() => handleDownloadPdf(paper.id, paper.title)}
                  title="Download Question Paper PDF"
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
