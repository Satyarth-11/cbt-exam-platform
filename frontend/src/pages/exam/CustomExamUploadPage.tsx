import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  ArrowLeft, 
  Clock, 
  Award,
  Layers,
  Zap,
  ChevronRight
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export const CustomExamUploadPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'AI_GEN'>('UPLOAD');
  
  // Tab 1: Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>('SSC CGL');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [uploadDuration, setUploadDuration] = useState<number>(60);
  const [uploading, setUploading] = useState<boolean>(false);

  // Tab 2: AI Mock Test States
  const [aiCategory, setAiCategory] = useState<string>('SSC');
  const [aiSubject, setAiSubject] = useState<string>('Quantitative Aptitude');
  const [aiDifficulty, setAiDifficulty] = useState<string>('MEDIUM');
  const [aiCount, setAiCount] = useState<number>(15);
  const [aiDuration, setAiDuration] = useState<number>(45);
  const [generating, setGenerating] = useState<boolean>(false);

  const categories = [
    { key: 'JEE', label: 'JEE Main & Advanced', desc: 'Physics, Chemistry, Mathematics' },
    { key: 'SSC', label: 'SSC CGL / CHSL', desc: 'Quantitative, Reasoning, English, GA' },
    { key: 'NEET', label: 'NEET UG Medical', desc: 'Biology, Physics, Chemistry' },
    { key: 'BANKING', label: 'Banking / IBPS PO', desc: 'Data Interpretation, Reasoning' },
    { key: 'GATE', label: 'GATE Engineering', desc: 'Computer Science, Electrical, Mech' },
    { key: 'UPSC', label: 'UPSC CSE Prelims', desc: 'General Studies, CSAT' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
        setSelectedFile(file);
      } else {
        alert('Please select a valid PDF (.pdf) or Word document (.docx).');
      }
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a PDF or DOCX file to parse.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', uploadCategory);
    formData.append('title', customTitle.trim() ? customTitle : `Custom ${uploadCategory} Paper`);
    formData.append('durationMinutes', String(uploadDuration));

    axiosClient.post('/student/custom-exams/upload-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then((res: any) => {
        const data = res.data || res;
        const attemptId = data?.attemptId;
        if (attemptId) {
          navigate(`/exam/take/${attemptId}`);
        } else {
          navigate('/student/dashboard');
        }
      })
      .catch((err: any) => {
        console.error('Upload failed:', err);
        alert(err?.message || 'Failed to parse document. Please check file format.');
      })
      .finally(() => setUploading(false));
  };

  const handleAiGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    const payload = {
      category: aiCategory,
      subject: aiSubject,
      difficulty: aiDifficulty,
      questionCount: Number(aiCount),
      durationMinutes: Number(aiDuration),
    };

    axiosClient.post('/student/custom-exams/generate-mock', payload)
      .then((res: any) => {
        const data = res.data || res;
        const attemptId = data?.attemptId;
        if (attemptId) {
          navigate(`/exam/take/${attemptId}`);
        } else {
          navigate('/student/dashboard');
        }
      })
      .catch((err: any) => {
        console.error('Generation failed:', err);
        alert(err?.message || 'Failed to generate mock test.');
      })
      .finally(() => setGenerating(false));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Custom Test Generator & Document Parser
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold">
              OmniTest Engine
            </span>
          </h1>
          <p className="text-xs text-slate-400">Upload your PDF/DOCX question paper or generate an instant AI mock test for any government/competitive exam.</p>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('UPLOAD')}
          className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'UPLOAD'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UploadCloud className="w-4 h-4" /> Upload PDF / DOCX Paper
        </button>
        <button
          onClick={() => setActiveTab('AI_GEN')}
          className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'AI_GEN'
              ? 'border-purple-500 text-purple-400 bg-purple-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Instant Exam Paper Generator
        </button>
      </div>

      {/* Tab 1: Upload Document */}
      {activeTab === 'UPLOAD' && (
        <form onSubmit={handleUploadSubmit} className="glass-panel rounded-3xl p-8 border border-slate-800 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" /> Upload Question Paper File
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload any previous year question paper, practice test, or study guide in <strong>PDF (.pdf)</strong> or <strong>Word (.docx)</strong> format. Our parser extracts questions, options, and solution explanations to launch an interactive CBT test!
            </p>
          </div>

          {/* File Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-8 text-center bg-slate-950/60 transition-all relative">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <UploadCloud className="w-12 h-12 text-cyan-400 mx-auto mb-3 animate-bounce" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                {selectedFile ? selectedFile.name : 'Click or Drag & Drop your PDF or DOCX file here'}
              </p>
              <p className="text-[11px] text-slate-400">Supported formats: .pdf, .docx (Max file size: 15MB)</p>
            </div>
            {selectedFile && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> File Selected: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Target Exam Category *</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-semibold"
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.label}>{c.label}</option>
                ))}
                <option value="GENERAL">General / Other Govt Exam</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Custom Test Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. My SSC CGL Practice Set 1"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Test Duration (Minutes) *</label>
              <input
                type="number"
                required
                min={10}
                max={300}
                value={uploadDuration}
                onChange={(e) => setUploadDuration(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>Parsing Document & Generating Test...</>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Parse Document & Launch CBT Exam Player
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: AI Exam Paper Generator */}
      {activeTab === 'AI_GEN' && (
        <form onSubmit={handleAiGenerateSubmit} className="glass-panel rounded-3xl p-8 border border-slate-800 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Instant Exam Paper Generator
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Don't have a document file? Select any competitive exam category below to instantly generate a custom CBT mock paper complete with step-by-step solution explanations!
            </p>
          </div>

          {/* Exam Category Grid Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div
                key={c.key}
                onClick={() => setAiCategory(c.key)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  aiCategory === c.key
                    ? 'bg-purple-500/20 border-purple-500 text-white font-bold shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="text-sm font-extrabold text-white flex items-center justify-between">
                  {c.label}
                  {aiCategory === c.key && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{c.desc}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Subject / Module</label>
              <input
                type="text"
                value={aiSubject}
                onChange={(e) => setAiSubject(e.target.value)}
                placeholder="e.g. Quantitative / Reasoning"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Difficulty Level</label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD (Exam Level)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Question Count</label>
              <select
                value={aiCount}
                onChange={(e) => setAiCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
              >
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={25}>25 Questions</option>
                <option value={30}>30 Questions</option>
                <option value={50}>50 Questions</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Duration (Mins)</label>
              <input
                type="number"
                required
                min={10}
                value={aiDuration}
                onChange={(e) => setAiDuration(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-purple-400 font-bold focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={generating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>Generating Exam Paper...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate {aiCategory} Mock Test & Launch Player
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
