import React, { useEffect, useState, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import { getWebSocketUrl } from '../../utils/ws';
import { Shield, AlertTriangle, MessageSquare, ListFilter, Video, Clock, User, X, RefreshCw } from 'lucide-react';

interface ViolationDetail {
  id: string;
  violationType: string;
  details: string;
  createdAt: string;
}

interface ActiveSession {
  attemptId: string;
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  examTitle: string;
  startedAt: string;
  status: string;
  remainingSeconds: number;
  totalViolationsCount: number;
  violations: ViolationDetail[];
}

export const ProctorPanelPage: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Selected Candidate states
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [warningText, setWarningText] = useState<string>('');
  const [sendingWarning, setSendingWarning] = useState<boolean>(false);

  // WebSocket signaling socket ref
  const wsRef = useRef<WebSocket | null>(null);

  // Map of active peer connections keyed by attemptId
  const pcsRef = useRef<{ [attemptId: string]: RTCPeerConnection }>({});
  const videoRefs = useRef<{ [attemptId: string]: HTMLVideoElement | null }>({});

  const fetchActiveSessions = () => {
    setLoading(true);
    axiosClient.get('/admin/proctor/sessions')
      .then((res: any) => {
        const data = res.data || res;
        setSessions(data);
        setError(null);
      })
      .catch((err: any) => {
        console.error('Failed to fetch active sessions:', err);
        setError('Failed to fetch live proctor sessions');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Initialize signaling websocket
  useEffect(() => {
    fetchActiveSessions();

    const baseUrl = getWebSocketUrl('/ws/proctor');
    const token = localStorage.getItem('access_token');
    const wsUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token || '')}`;

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('Proctor signaling WebSocket connected');
      socket.send(JSON.stringify({
        type: 'register',
        role: 'proctor'
      }));

      // Initiate WebRTC connection for all active sessions loaded initially
      sessions.forEach(sess => {
        initiatePeerConnection(sess.attemptId);
      });
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'candidate_connected') {
        console.log('Candidate connected:', data.attemptId);
        // Refresh list to show candidate
        fetchActiveSessions();
        setTimeout(() => {
          initiatePeerConnection(data.attemptId);
        }, 1000);
      } else if (data.type === 'candidate_disconnected') {
        console.log('Candidate disconnected:', data.attemptId);
        // Close peer connection
        if (pcsRef.current[data.attemptId]) {
          pcsRef.current[data.attemptId].close();
          delete pcsRef.current[data.attemptId];
        }
        fetchActiveSessions();
      } else if (data.type === 'answer') {
        console.log('Received WebRTC answer from:', data.sender);
        const pc = pcsRef.current[data.sender];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
      } else if (data.type === 'ice-candidate') {
        const pc = pcsRef.current[data.sender];
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }
    };

    return () => {
      socket.close();
      // Close all peer connections
      Object.values(pcsRef.current).forEach(pc => pc.close());
    };
  }, []);

  // Set up RTCPeerConnection for a candidate
  const initiatePeerConnection = async (attemptId: string) => {
    if (pcsRef.current[attemptId]) {
      pcsRef.current[attemptId].close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pcsRef.current[attemptId] = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          target: attemptId,
          candidate: e.candidate
        }));
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote media track for attempt:', attemptId);
      const videoEl = videoRefs.current[attemptId];
      if (videoEl) {
        videoEl.srcObject = event.streams[0];
      }
    };

    // We only need to receive audio/video tracks
    pc.addTransceiver('video', { direction: 'recvonly' });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'offer',
        target: attemptId,
        sdp: offer
      }));
    }
  };

  const handleSendWarning = () => {
    if (!selectedSession || !warningText.trim()) return;
    setSendingWarning(true);

    axiosClient.post(`/admin/proctor/attempts/${selectedSession.attemptId}/warning?message=${encodeURIComponent(warningText.trim())}`)
      .then(() => {
        alert(`Warning sent to ${selectedSession.firstName}!`);
        setWarningText('');
      })
      .catch((err: any) => alert(err?.message || 'Failed to send warning.'))
      .finally(() => setSendingWarning(false));
  };

  const handlePauseAttempt = (attemptId: string) => {
    if (!confirm('Are you sure you want to PAUSE this candidate\'s exam?')) return;
    axiosClient.post(`/admin/proctor/attempts/${attemptId}/pause`)
      .then(() => {
        alert('Exam attempt paused.');
        fetchActiveSessions();
      })
      .catch((err: any) => alert(err?.message || 'Failed to pause exam.'));
  };

  const handleResumeAttempt = (attemptId: string) => {
    axiosClient.post(`/admin/proctor/attempts/${attemptId}/resume`)
      .then(() => {
        alert('Exam attempt resumed.');
        fetchActiveSessions();
      })
      .catch((err: any) => alert(err?.message || 'Failed to resume exam.'));
  };

  const handleForceSubmit = (attemptId: string) => {
    if (!confirm('Are you sure you want to FORCE-SUBMIT this attempt?')) return;
    axiosClient.post(`/admin/proctor/attempts/${attemptId}/force-submit`)
      .then(() => {
        alert('Exam attempt force-submitted.');
        fetchActiveSessions();
      })
      .catch((err: any) => alert(err?.message || 'Failed to force-submit exam.'));
  };

  const handleBlockStudent = (attemptId: string) => {
    if (!confirm('CRITICAL ACTION: Are you sure you want to BLOCK this candidate? This will lock their account and terminate their attempt immediately.')) return;
    axiosClient.post(`/admin/proctor/attempts/${attemptId}/block`)
      .then(() => {
        alert('Student blocked and session terminated.');
        fetchActiveSessions();
      })
      .catch((err: any) => alert(err?.message || 'Failed to block student.'));
  };

  const formatRemainingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">Live Proctoring Dashboard</h1>
          </div>
          <p className="text-xs text-slate-400 font-medium">Real-time candidate monitoring, active WebRTC camera streams, and cheat logs.</p>
        </div>

        <button
          onClick={fetchActiveSessions}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white transition-all text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Status
        </button>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400 font-medium text-sm">
          Loading live proctored sessions...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-red-400 font-semibold text-sm">
          {error}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 rounded-3xl bg-slate-900/30 border border-dashed border-slate-800 p-8 space-y-4">
          <Video className="w-12 h-12 text-slate-600" />
          <div className="text-center">
            <h3 className="font-extrabold text-white text-base">No Active Exams</h3>
            <p className="text-xs text-slate-400 mt-1">There are no candidates currently taking mock exams in progress.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div key={session.attemptId} className="flex flex-col rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              {/* Card Header: Candidate Info */}
              <div className="p-4 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white">{session.firstName} {session.lastName}</h3>
                  <div className="text-[10px] text-slate-500 font-mono">Attempt ID: {session.attemptId}</div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {formatRemainingTime(session.remainingSeconds)}
                </div>
              </div>

              {/* Video Stream Preview */}
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center text-slate-600">
                <video
                  ref={(el) => {
                    videoRefs.current[session.attemptId] = el;
                  }}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Overlay Indicators */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] uppercase font-black tracking-widest text-emerald-400 drop-shadow">Stream Live</span>
                </div>

                {session.totalViolationsCount > 0 && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-600/90 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-md shadow-md animate-bounce">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {session.totalViolationsCount} Violations
                  </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 text-[10px] text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800/40 text-center font-semibold truncate">
                  Exam: {session.examTitle}
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="p-4 bg-slate-900/60 border-t border-slate-800/50 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedSession(session);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all text-xs shadow-md"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Warn Candidate
                  </button>

                  {session.status === 'PAUSED' ? (
                    <button
                      onClick={() => handleResumeAttempt(session.attemptId)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-xs"
                    >
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePauseAttempt(session.attemptId)}
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all text-xs"
                    >
                      Pause
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleForceSubmit(session.attemptId)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold transition-all text-[11px] border border-slate-700/60"
                  >
                    Force Submit
                  </button>
                  <button
                    onClick={() => handleBlockStudent(session.attemptId)}
                    className="flex-1 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 font-bold transition-all text-[11px] border border-red-800/40"
                  >
                    Block Student
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Warning / Log Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-6">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl relative">
            
            <button
              onClick={() => {
                setSelectedSession(null);
                setWarningText('');
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                Candidate Control: {selectedSession.firstName} {selectedSession.lastName}
              </h2>
              <p className="text-xs text-slate-400">Email: {selectedSession.email} | ID: {selectedSession.attemptId}</p>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Warnings Chat Box */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  Direct Warning Message
                </h3>

                <textarea
                  value={warningText}
                  onChange={(e) => setWarningText(e.target.value)}
                  placeholder="Type real-time warning alert to send to candidate's screen..."
                  rows={4}
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-sans text-xs resize-none"
                />

                <button
                  onClick={handleSendWarning}
                  disabled={sendingWarning || !warningText.trim()}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all text-xs disabled:opacity-50"
                >
                  Send Urgent Warning
                </button>
              </div>

              {/* Violations History list */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-red-400" />
                  Activity Cheat Log
                </h3>

                <div className="h-48 overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
                  {selectedSession.violations.length === 0 ? (
                    <div className="text-center text-xs text-slate-500 pt-16 font-medium">
                      No violations logged for this candidate.
                    </div>
                  ) : (
                    selectedSession.violations.map((v) => (
                      <div key={v.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800/40 space-y-1">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase text-red-500 tracking-wider">
                          <span>{v.violationType}</span>
                          <span className="text-slate-500 font-mono">{new Date(v.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-relaxed font-mono">{v.details}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
