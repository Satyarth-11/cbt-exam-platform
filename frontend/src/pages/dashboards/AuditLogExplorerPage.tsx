import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  ArrowLeft, 
  Clock, 
  Globe, 
  User, 
  ShieldAlert, 
  Activity, 
  X,
  RefreshCw
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

interface AuditLogRecord {
  id: number;
  userId?: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export const AuditLogExplorerPage: React.FC = () => {
  const navigate = useNavigate();

  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  useEffect(() => {
    fetchActions();
    fetchLogs();
  }, []);

  const fetchActions = () => {
    axiosClient.get('/admin/audit-logs/actions')
      .then((res: any) => {
        const data = res.data || res;
        setActionTypes(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Failed to load action types:', err));
  };

  const fetchLogs = (action = selectedAction, query = searchQuery) => {
    setLoading(true);
    let url = '/admin/audit-logs?';
    if (action) url += `action=${encodeURIComponent(action)}&`;
    if (query) url += `query=${encodeURIComponent(query)}`;

    axiosClient.get(url)
      .then((res: any) => {
        const data = res.data || res;
        setLogs(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => {
        console.error('Failed to load audit logs:', err);
      })
      .finally(() => setLoading(false));
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedAction(val);
    fetchLogs(val, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(selectedAction, searchQuery);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('PROCTOR') || action.includes('VIOLATION')) {
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    }
    if (action.includes('CREATED') || action.includes('SUCCESS')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (action.includes('AUTO') || action.includes('EXPIRED')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
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
            <h1 className="text-2xl font-extrabold text-white">System Audit Log Explorer</h1>
            <p className="text-xs text-slate-400">Security event logging, system telemetry, and administrative trail.</p>
          </div>
        </div>

        <button
          onClick={() => fetchLogs()}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 inline-flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Trail
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search details, IP address, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAction}
            onChange={handleActionChange}
            className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Security Action Types</option>
            {actionTypes.map((act) => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Records Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action Event</th>
                <th className="px-6 py-4">User ID / Principal</th>
                <th className="px-6 py-4">Audit Details</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-sans">
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((logItem) => (
                  <tr key={logItem.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-400 text-[11px]">
                      {new Date(logItem.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getActionBadgeColor(logItem.action)}`}>
                        {logItem.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-purple-300 text-[11px]">
                      {logItem.userId ? `${logItem.userId.slice(0, 8)}...` : 'SYSTEM'}
                    </td>
                    <td className="px-6 py-4 text-slate-200 font-sans text-xs max-w-xs truncate">
                      {logItem.details}
                    </td>
                    <td className="px-6 py-4 text-cyan-400 text-[11px]">
                      {logItem.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-4 text-right font-sans">
                      <button
                        onClick={() => setSelectedLog(logItem)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-xl w-full glass-panel bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" /> Audit Log Event Detail #{selectedLog.id}
              </h2>
              <button onClick={() => setSelectedLog(null)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Action Type</span>
                  <span className="text-cyan-400 font-bold">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Timestamp</span>
                  <span className="text-white">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase">User ID</span>
                <span className="text-purple-300">{selectedLog.userId || 'SYSTEM / ANONYMOUS'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Event Details</span>
                <p className="text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">{selectedLog.details}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">IP Address</span>
                  <span className="text-emerald-400">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">User Agent</span>
                  <span className="text-slate-300 truncate block">{selectedLog.userAgent || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
