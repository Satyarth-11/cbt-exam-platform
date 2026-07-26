import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ArrowLeft, 
  FileText, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  HelpCircle, 
  X, 
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

interface QuestionItem {
  id: string;
  subject: string;
  section: string;
  questionText: string;
  questionType: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
  correctNumericalValue?: number;
  markingPositive: number;
  markingNegative: number;
  sequenceNumber: number;
  parentQuestionId?: string;
  passageText?: string;
  explanation?: string;
}

export const QuestionBankPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form Fields
  const [subject, setSubject] = useState<string>('PHYSICS');
  const [section, setSection] = useState<string>('SECTION_A');
  const [questionType, setQuestionType] = useState<string>('MCQ');
  const [sequenceNumber, setSequenceNumber] = useState<number>(1);
  const [questionText, setQuestionText] = useState<string>('');
  const [optionA, setOptionA] = useState<string>('');
  const [optionB, setOptionB] = useState<string>('');
  const [optionC, setOptionC] = useState<string>('');
  const [optionD, setOptionD] = useState<string>('');
  const [correctOption, setCorrectOption] = useState<string>('A');
  const [correctNumericalValue, setCorrectNumericalValue] = useState<string>('');
  const [markingPositive, setMarkingPositive] = useState<number>(4);
  const [markingNegative, setMarkingNegative] = useState<number>(1);
  const [passageText, setPassageText] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');

  useEffect(() => {
    fetchQuestions();
  }, [examId]);

  const fetchQuestions = () => {
    setLoading(true);
    axiosClient.get(`/admin/exams/${examId}/questions`)
      .then((res: any) => {
        const data = res.data || res;
        setQuestions(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err: any) => {
        console.error('Failed to load questions:', err);
        setError(err?.message || 'Failed to fetch question bank');
      })
      .finally(() => setLoading(false));
  };

  const handleOpenCreate = () => {
    setEditingQuestionId(null);
    setSubject('PHYSICS');
    setSection('SECTION_A');
    setQuestionType('MCQ');
    setSequenceNumber(questions.length + 1);
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectOption('A');
    setCorrectNumericalValue('');
    setMarkingPositive(4);
    setMarkingNegative(1);
    setPassageText('');
    setExplanation('');
    setShowModal(true);
  };

  const handleOpenEdit = (q: QuestionItem) => {
    setEditingQuestionId(q.id);
    setSubject(q.subject);
    setSection(q.section);
    setQuestionType(q.questionType);
    setSequenceNumber(q.sequenceNumber);
    setQuestionText(q.questionText);
    setOptionA(q.optionA || '');
    setOptionB(q.optionB || '');
    setOptionC(q.optionC || '');
    setOptionD(q.optionD || '');
    setCorrectOption(q.correctOption || 'A');
    setCorrectNumericalValue(q.correctNumericalValue != null ? String(q.correctNumericalValue) : '');
    setMarkingPositive(q.markingPositive);
    setMarkingNegative(q.markingNegative);
    setPassageText(q.passageText || '');
    setExplanation(q.explanation || '');
    setShowModal(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      subject,
      section,
      questionText,
      questionType,
      optionA: questionType === 'MCQ' ? optionA : null,
      optionB: questionType === 'MCQ' ? optionB : null,
      optionC: questionType === 'MCQ' ? optionC : null,
      optionD: questionType === 'MCQ' ? optionD : null,
      correctOption: questionType === 'MCQ' ? correctOption : null,
      correctNumericalValue: questionType === 'NUMERICAL' ? Number(correctNumericalValue) : null,
      markingPositive: Number(markingPositive),
      markingNegative: Number(markingNegative),
      sequenceNumber: Number(sequenceNumber),
      passageText: passageText.trim() ? passageText : null,
      explanation: explanation.trim() ? explanation : null,
    };

    const request = editingQuestionId
      ? axiosClient.put(`/admin/questions/${editingQuestionId}`, payload)
      : axiosClient.post(`/admin/exams/${examId}/questions`, payload);

    request
      .then(() => {
        setShowModal(false);
        fetchQuestions();
      })
      .catch((err: any) => {
        console.error('Save question failed:', err);
        alert(err?.message || 'Failed to save question');
      })
      .finally(() => setSaving(false));
  };

  const handleDeleteQuestion = (qId: string, seqNum: number) => {
    if (!window.confirm(`Are you sure you want to delete Question #${seqNum}?`)) return;

    axiosClient.delete(`/admin/questions/${qId}`)
      .then(() => fetchQuestions())
      .catch((err: any) => {
        console.error('Delete question failed:', err);
        alert(err?.message || 'Failed to delete question');
      });
  };

  const filteredQuestions = questions.filter((q) =>
    selectedSubject === 'ALL' || q.subject.toUpperCase() === selectedSubject.toUpperCase()
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/exams')}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Question Bank Builder</h1>
            <p className="text-xs text-slate-400">Total Questions Configured: {questions.length}</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 inline-flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Question
        </button>
      </div>

      {/* Subject Filter Tabs */}
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold text-slate-400">
          {['ALL', 'PHYSICS', 'CHEMISTRY', 'MATHEMATICS'].map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedSubject === subj ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'hover:text-white'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="glass-panel p-8 text-center text-slate-400 text-sm">Loading question bank...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400 text-sm">
            No questions found. Click "Add New Question" to create items.
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div key={q.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-cyan-400 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                    Q#{q.sequenceNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-300 uppercase">{q.subject} ({q.section})</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                    {q.questionType}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    +{q.markingPositive} / -{q.markingNegative} pts
                  </span>
                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id, q.sequenceNumber)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {q.passageText && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-cyan-400 uppercase tracking-wider block">Passage Reference</span>
                  <p className="leading-relaxed">{q.passageText}</p>
                </div>
              )}

              <div className="text-sm font-medium text-white leading-relaxed">
                {q.questionText}
              </div>

              {q.questionType !== 'NUMERICAL' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'A', text: q.optionA },
                    { key: 'B', text: q.optionB },
                    { key: 'C', text: q.optionC },
                    { key: 'D', text: q.optionD },
                  ].map((opt) => (
                    opt.text ? (
                      <div 
                        key={opt.key}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          q.correctOption === opt.key 
                            ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span><strong className="mr-1">{opt.key}.</strong> {opt.text}</span>
                        {q.correctOption === opt.key && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                    ) : null
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-400">Correct Numerical Value:</span>
                  <span className="text-emerald-400 font-bold text-sm">{q.correctNumericalValue}</span>
                </div>
              )}

              {q.explanation && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-cyan-400 block">Solution Explanation</span>
                  <p className="leading-relaxed text-slate-400">{q.explanation}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-3xl w-full glass-panel bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">
                {editingQuestionId ? 'Edit Question Item' : 'Add New Question'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Subject *</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="PHYSICS">PHYSICS</option>
                    <option value="CHEMISTRY">CHEMISTRY</option>
                    <option value="MATHEMATICS">MATHEMATICS</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Section *</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SECTION_A">SECTION_A (MCQ)</option>
                    <option value="SECTION_B">SECTION_B (Numerical)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Question Type *</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="NUMERICAL">NUMERICAL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Sequence # *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={sequenceNumber}
                    onChange={(e) => setSequenceNumber(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Passage Input */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Passage Reference Text (Optional)</label>
                <textarea
                  rows={2}
                  value={passageText}
                  onChange={(e) => setPassageText(e.target.value)}
                  placeholder="Enter reading comprehension or problem description passage if applicable..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Question Text */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Question Problem Statement *</label>
                <textarea
                  rows={3}
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the question problem statement..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* MCQ Options Inputs */}
              {questionType === 'MCQ' ? (
                <div className="space-y-3 pt-2">
                  <label className="font-bold text-cyan-400 block">MCQ Options & Correct Choice *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'A', val: optionA, setVal: setOptionA },
                      { key: 'B', val: optionB, setVal: setOptionB },
                      { key: 'C', val: optionC, setVal: setOptionC },
                      { key: 'D', val: optionD, setVal: setOptionD },
                    ].map((opt) => (
                      <div key={opt.key} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <input
                          type="radio"
                          name="correctOptionRadio"
                          checked={correctOption === opt.key}
                          onChange={() => setCorrectOption(opt.key)}
                          className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                        />
                        <span className="font-bold text-slate-300">{opt.key}.</span>
                        <input
                          type="text"
                          required
                          value={opt.val}
                          onChange={(e) => opt.setVal(e.target.value)}
                          placeholder={`Option ${opt.key} text`}
                          className="flex-1 bg-transparent border-none text-white focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Numerical Input */
                <div className="space-y-1 pt-2">
                  <label className="font-bold text-cyan-400">Correct Numerical Value *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={correctNumericalValue}
                    onChange={(e) => setCorrectNumericalValue(e.target.value)}
                    placeholder="e.g. 25.5"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-bold"
                  />
                </div>
              )}

              {/* Marking Scheme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Positive Marks (+)</label>
                  <input
                    type="number"
                    required
                    value={markingPositive}
                    onChange={(e) => setMarkingPositive(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Negative Marks (-)</label>
                  <input
                    type="number"
                    required
                    value={markingNegative}
                    onChange={(e) => setMarkingNegative(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-red-400 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Solution Explanation */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Official Solution & Step-by-Step Explanation</label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Enter detailed solution text for candidate scorecards..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
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
                  {saving ? 'Saving...' : editingQuestionId ? 'Update Question' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
