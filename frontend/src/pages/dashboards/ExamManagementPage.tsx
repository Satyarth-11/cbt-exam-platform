import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  HelpCircle, 
  Clock, 
  Calendar, 
  Award, 
  Layers, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle,
  X,
  FileText,
  ShieldAlert
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

interface ExamSummary {
  id: string;
  title: string;
  description: string;
  subject: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: string;
  maxViolations?: number;
}

export const ExamManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [subject, setSubject] = useState<string>('FULL_LENGTH');
  const [totalQuestions, setTotalQuestions] = useState<number>(75);
  const [totalMarks, setTotalMarks] = useState<number>(300);
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [scheduledStartTime, setScheduledStartTime] = useState<string>('');
  const [scheduledEndTime, setScheduledEndTime] = useState<string>('');
  const [status, setStatus] = useState<string>('SCHEDULED');
  const [maxViolations, setMaxViolations] = useState<number>(3);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = () => {
    setLoading(true);
    axiosClient.get('/admin/exams')
      .then((res: any) => {
        const data = res.data || res;
        setExams(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err: any) => {
        console.error('Failed to load exams:', err);
        setError(err?.message || 'Failed to fetch exam records');
      })
      .finally(() => setLoading(false));
  };

  const handleOpenCreate = () => {
    setEditingExamId(null);
    setTitle('');
    setDescription('');
    setSubject('FULL_LENGTH');
    setTotalQuestions(75);
    setTotalMarks(300);
    setDurationMinutes(180);

    const now = new Date();
    const startTimeStr = new Date(now.getTime() + 3600000).toISOString().slice(0, 16);
    const endTimeStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 16);
    setScheduledStartTime(startTimeStr);
    setScheduledEndTime(endTimeStr);

    setStatus('SCHEDULED');
    setMaxViolations(3);
    setShowModal(true);
  };

  const handleOpenEdit = (exam: ExamSummary) => {
    setEditingExamId(exam.id);
    setTitle(exam.title);
    setDescription(exam.description || '');
    setSubject(exam.subject);
    setTotalQuestions(exam.totalQuestions);
    setTotalMarks(exam.totalMarks);
    setDurationMinutes(exam.durationMinutes);
    setScheduledStartTime(exam.scheduledStartTime ? new Date(exam.scheduledStartTime).toISOString().slice(0, 16) : '');
    setScheduledEndTime(exam.scheduledEndTime ? new Date(exam.scheduledEndTime).toISOString().slice(0, 16) : '');
    setStatus(exam.status);
    setMaxViolations(exam.maxViolations || 3);
    setShowModal(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title,
      description,
      subject,
      totalQuestions: Number(totalQuestions),
      totalMarks: Number(totalMarks),
      durationMinutes: Number(durationMinutes),
      scheduledStartTime: new Date(scheduledStartTime).toISOString(),
      scheduledEndTime: new Date(scheduledEndTime).toISOString(),
      status,
      maxViolations: Number(maxViolations),
    };

    const request = editingExamId
      ? axiosClient.put(`/admin/exams/${editingExamId}`, payload)
      : axiosClient.post('/admin/exams', payload);

    request
      .then(() => {
        setShowModal(false);
        fetchExams();
      })
      .catch((err: any) => {
        console.error('Save exam failed:', err);
        alert(err?.message || 'Failed to save exam');
      })
      .finally(() => setSaving(false));
  };

  const handleDeleteExam = (examId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? All associated attempts and results will be permanently removed.`)) {
      return;
    }

    axiosClient.delete(`/admin/exams/${examId}`)
      .then(() => fetchExams())
      .catch((err: any) => {
        console.error('Delete exam failed:', err);
        alert(err?.message || 'Failed to delete exam');
      });
  };

  const filteredExams = exams.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Exam Lifecycle Console</h1>
            <p className="text-xs text-slate-400">Create, schedule, edit parameters, and manage exam status.</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 inline-flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Exam
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search exam title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Exam Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Title / Subject</th>
                <th className="px-6 py-4">Questions / Marks</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Schedule (Start - End)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Max Violations</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading exams...
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No exams found. Click "Create New Exam" to build one.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm">{exam.title}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{exam.subject}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{exam.totalQuestions} Questions</div>
                      <div className="text-[10px] text-emerald-400">{exam.totalMarks} Marks</div>
                    </td>
                    <td className="px-6 py-4 font-mono">{exam.durationMinutes} mins</td>
                    <td className="px-6 py-4 text-[11px] text-slate-400 space-y-0.5">
                      <div>Start: {new Date(exam.scheduledStartTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      <div>End: {new Date(exam.scheduledEndTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        exam.status === 'LIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse'
                          : exam.status === 'SCHEDULED'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-bold">
                        {exam.maxViolations || 3}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/exams/${exam.id}/questions`)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold inline-flex items-center gap-1 transition-all"
                          title="Manage Question Bank"
                        >
                          <FileText className="w-3.5 h-3.5" /> Questions
                        </button>
                        <button
                          onClick={() => handleOpenEdit(exam)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                          title="Edit Exam"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id, exam.title)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-2xl w-full glass-panel bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">
                {editingExamId ? 'Edit Exam Parameters' : 'Create New Exam'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Exam Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JEE Main Mock Test - Series 1"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed instructions for candidates..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Subject Category *</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="FULL_LENGTH">FULL_LENGTH</option>
                    <option value="PHYSICS">PHYSICS</option>
                    <option value="CHEMISTRY">CHEMISTRY</option>
                    <option value="MATHEMATICS">MATHEMATICS</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="LIVE">LIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Total Questions *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Total Marks *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Duration (Mins) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Scheduled Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledStartTime}
                    onChange={(e) => setScheduledStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Scheduled End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledEndTime}
                    onChange={(e) => setScheduledEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="font-bold text-slate-300">Max Proctor Violations Allowed (Threshold) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={10}
                  value={maxViolations}
                  onChange={(e) => setMaxViolations(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-bold focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-400">Candidates reaching this threshold will be auto-submitted.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-lg"
                >
                  {saving ? 'Saving Exam...' : editingExamId ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
