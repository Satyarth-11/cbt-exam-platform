import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAppSelector } from '../store/hooks';
import { Activity, Database, Lock, Terminal, CheckCircle2, Layers, Shield, ArrowRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.roles?.includes('ROLE_ADMIN') || user.roles?.includes('ROLE_EXAMINER')) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await axiosClient.get('/health');
      setHealthData(response.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            Universal Competitive & Govt Exam CBT Platform
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            OmniTest Engine <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
              JEE • SSC • NEET • Banking • UPSC
            </span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed">
            Engineered for bulletproof reliability, ultra-low latency CBT test delivery, custom PDF/DOCX paper document parsing, instant AI mock test generation with solution explanations, live WebRTC proctoring, and session telemetry.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={checkHealth}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Re-verify System Telemetry
            </button>
          </div>
        </div>
      </section>

      {/* Backend Diagnostics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: API Status */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">REST API Endpoint</span>
            <Terminal className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">/api/v1/health</h3>
            <p className="text-xs text-slate-400 mt-1">Direct Spring Boot Controller</p>
          </div>
          <div className="pt-2 border-t border-slate-800">
            {loading ? (
              <span className="text-sm text-amber-400 animate-pulse">Ping in progress...</span>
            ) : error ? (
              <span className="text-sm text-red-400 font-medium">Error: {error}</span>
            ) : (
              <div className="space-y-1 text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                <div><span className="text-cyan-400">status:</span> {healthData?.status}</div>
                <div><span className="text-cyan-400">service:</span> {healthData?.service}</div>
                <div><span className="text-cyan-400">version:</span> {healthData?.version}</div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Flyway Migrations */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Database Schema</span>
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Flyway V1 Schema</h3>
            <p className="text-xs text-slate-400 mt-1">PostgreSQL 16 Engine</p>
          </div>
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>users, roles, permissions tables</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ROLE_STUDENT, ROLE_EXAMINER, ROLE_ADMIN</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Junction tables & Foreign Keys created</span>
            </div>
          </div>
        </div>

        {/* Card 3: Modular Phases Roadmap */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Build Roadmap</span>
            <Layers className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Phase 0 Complete</h3>
            <p className="text-xs text-slate-400 mt-1">Monorepo Skeleton Active</p>
          </div>
          <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
            <div className="text-emerald-400 font-semibold">✓ Phase 0: Foundations & Repo Skeleton</div>
            <div>• Phase 1: Authentication & Single-Active Session</div>
            <div>• Phase 2: Candidate & Admin Dashboards</div>
            <div>• Phase 3: JEE Main Exam Engine</div>
          </div>
        </div>
      </section>
    </div>
  );
};
