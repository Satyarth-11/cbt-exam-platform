import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Database, 
  Cpu, 
  Radio, 
  Clock, 
  Server, 
  ArrowLeft, 
  RefreshCw,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

interface SystemTelemetry {
  dbPoolActive: number;
  dbPoolIdle: number;
  dbPoolTotal: number;
  dbPoolMax: number;
  heapMemoryUsedMb: number;
  heapMemoryMaxMb: number;
  nonHeapMemoryUsedMb: number;
  uptimeSeconds: number;
  activeCandidateWebSockets: number;
  activeProctorWebSockets: number;
  schedulerStatus: string;
}

export const SystemHealthPage: React.FC = () => {
  const navigate = useNavigate();

  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000); // 5s auto refresh
    return () => clearInterval(interval);
  }, []);

  const fetchTelemetry = () => {
    axiosClient.get('/admin/system-health')
      .then((res: any) => {
        const data = res.data || res;
        setTelemetry(data);
        setError(null);
      })
      .catch((err: any) => {
        console.error('Failed to load system telemetry:', err);
        setError(err?.message || 'Failed to fetch telemetry metrics');
      })
      .finally(() => setLoading(false));
  };

  const formatUptime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hours}h ${mins}m ${s}s`;
  };

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
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              System Health & Telemetry Dashboard
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            </h1>
            <p className="text-xs text-slate-400">Live HikariCP connection pool, JVM heap memory, and WebRTC session telemetry.</p>
          </div>
        </div>

        <button
          onClick={fetchTelemetry}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 inline-flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Live Polling (5s)
        </button>
      </div>

      {loading && !telemetry ? (
        <div className="glass-panel p-8 text-center text-slate-400 text-sm">Loading telemetry metrics...</div>
      ) : telemetry ? (
        <div className="space-y-8">
          {/* Main Gauges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Database Pool Health */}
            <div className="glass-panel rounded-2xl p-6 space-y-4 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database Connection Pool</span>
                <Database className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-extrabold text-white font-mono">
                  {telemetry.dbPoolActive} <span className="text-sm font-normal text-slate-400">/ {telemetry.dbPoolMax} Active</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-cyan-500 h-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (telemetry.dbPoolActive / telemetry.dbPoolMax) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-2 border-t border-slate-800/60">
                <span>Idle: {telemetry.dbPoolIdle}</span>
                <span>Total: {telemetry.dbPoolTotal}</span>
              </div>
            </div>

            {/* Card 2: JVM Memory Heap */}
            <div className="glass-panel rounded-2xl p-6 space-y-4 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">JVM Heap Memory</span>
                <Cpu className="w-5 h-5 text-purple-400" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-extrabold text-white font-mono">
                  {telemetry.heapMemoryUsedMb} <span className="text-sm font-normal text-slate-400">MB Used</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-purple-500 h-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (telemetry.heapMemoryUsedMb / (telemetry.heapMemoryMaxMb || 1024)) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-2 border-t border-slate-800/60">
                <span>Max Limit: {telemetry.heapMemoryMaxMb} MB</span>
                <span>Non-Heap: {telemetry.nonHeapMemoryUsedMb} MB</span>
              </div>
            </div>

            {/* Card 3: Active WebRTC Connections */}
            <div className="glass-panel rounded-2xl p-6 space-y-4 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">WebRTC Active Sessions</span>
                <Radio className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-extrabold text-white font-mono">
                  {telemetry.activeCandidateWebSockets + telemetry.activeProctorWebSockets} <span className="text-sm font-normal text-slate-400">Sockets</span>
                </div>
                <p className="text-[11px] text-emerald-400 font-semibold">Live Proctoring Channel Operational</p>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-2 border-t border-slate-800/60">
                <span>Candidates: {telemetry.activeCandidateWebSockets}</span>
                <span>Proctors: {telemetry.activeProctorWebSockets}</span>
              </div>
            </div>

            {/* Card 4: Background Scheduler & Uptime */}
            <div className="glass-panel rounded-2xl p-6 space-y-4 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Uptime</span>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-white font-mono">
                  {formatUptime(telemetry.uptimeSeconds)}
                </div>
                <p className="text-[11px] text-slate-400">Continuous operation</p>
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center justify-between font-mono pt-2 border-t border-slate-800/60 font-bold">
                <span>Scheduler:</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {telemetry.schedulerStatus}
                </span>
              </div>
            </div>

          </div>

          {/* Detailed System Architecture Banner */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Resiliency Infrastructure Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-cyan-400 block">HikariCP Connection Pool</span>
                <p className="text-slate-400 leading-relaxed">Configured with auto-reconnect, 30s leak detection, and 10 max active connections to prevent DB exhaustion.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-purple-400 block">Spring @Scheduled Heartbeats</span>
                <p className="text-slate-400 leading-relaxed">Every 30s exam transition engine and 60s stale candidate attempt auto-submission cleanup active.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 block">WebRTC Signaling Pipeline</span>
                <p className="text-slate-400 leading-relaxed">JWT query authenticated WebSocket upgrade pipeline with zero unauthenticated handshake exposure.</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
