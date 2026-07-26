import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { Clock, Shield, Monitor, HelpCircle, User, AlertCircle, FileCheck, CheckCircle2, ChevronRight, ChevronLeft, RotateCcw, Lock } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { getWebSocketUrl } from '../../utils/ws';
import { ExamSession, QuestionSession, AnswerSession } from '../../types/exam';

export const ExamPlayerPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Exam Player Navigation States  // Active selected subject tab & Question index
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [numericalValue, setNumericalValue] = useState<string>('');
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(180 * 60);

  // Submit Modal state
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Cache/Reference to avoid stale timer values
  const timerRef = useRef<any>(null);

  // WebRTC & WebSocket Proctoring States & Refs
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pauseReason, setPauseReason] = useState<string>('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // 1. Fetch Session Configuration on Mount
  const fetchSession = () => {
    setLoading(true);
    axiosClient.get(`/student/attempts/${attemptId}/session`)
      .then((res: any) => {
        const sessionData: ExamSession = res.data || res;
        setSession(sessionData);
        setTimeLeft(sessionData.remainingSeconds);
        setError(null);
        
        if (sessionData.questions && sessionData.questions.length > 0) {
          const firstSub = sessionData.questions[0].subject;
          setActiveSubject(firstSub);
          setCurrentQuestionIndex(0);
        }
      })
      .catch((err: any) => {
        console.error('Failed to load exam session:', err);
        setError(err?.message || 'Failed to fetch exam player session');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attemptId]);

  // 2. Countdown Timer Logic
  useEffect(() => {
    if (loading || error || !session) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Trigger Auto-Submit
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, error, session]);

  // 2b. Live Proctoring WebRTC and Signaling Connection
  useEffect(() => {
    if (loading || error || !session) return;

    // Helper for logging violations with auto-submit response handling
    const logViolationWithCheck = (violationType: string, details: string) => {
      axiosClient.post(`/student/attempts/${attemptId}/violations`, {
        violationType,
        details
      }).then((res: any) => {
        const data = res.data || res;
        const currentCount = data?.totalViolations || (violationCount + 1);
        const threshold = data?.threshold || 3;
        setViolationCount(currentCount);

        if (data?.autosubmitted) {
          setActiveWarning(`CRITICAL SECURITY: Maximum violation threshold reached (${currentCount}/${threshold}). Your exam has been automatically submitted.`);
          setTimeout(() => {
            navigate(`/student/attempts/${attemptId}/scorecard`, { replace: true });
          }, 2500);
        } else {
          setActiveWarning(`VIOLATION WARNING (Count: ${currentCount}/${threshold}): ${details}\n\nWARNING: Reaching ${threshold} violations will automatically terminate and submit your exam!`);
        }
      }).catch(e => console.error('Violation logging failed:', e));
    };

    // A. Request/Bind Webcam stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error('Camera access denied or failed:', err);
        logViolationWithCheck('FACE_MISSING', 'Camera feed failed or was denied.');
      });

    // B. WebSocket connection with JWT Query Authentication
    const token = localStorage.getItem('access_token');
    const baseUrl = getWebSocketUrl('/ws/proctor');
    const wsUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token || '')}`;

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('Connected to proctor signaling server');
      socket.send(JSON.stringify({
        type: 'register',
        role: 'candidate',
        attemptId
      }));
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      // Handle Admin/Proctor Live Controls
      if (data.type === 'proctor_control') {
        const cmd = data.command;
        const msg = data.message || '';

        if (cmd === 'EXAM_PAUSED') {
          setIsPaused(true);
          setPauseReason(msg || 'Exam has been paused by the proctor.');
        } else if (cmd === 'EXAM_RESUMED') {
          setIsPaused(false);
          setPauseReason('');
        } else if (cmd === 'FORCE_SUBMITTED') {
          alert(`EXAM FORCE-SUBMITTED BY PROCTOR: ${msg}`);
          handleFinalSubmit();
        } else if (cmd === 'STUDENT_BLOCKED') {
          alert(`ACCOUNT LOCKED & TERMINATED: ${msg}`);
          localStorage.clear();
          navigate('/login');
        } else if (cmd === 'WARNING_MESSAGE') {
          setActiveWarning(`PROCTOR WARNING: ${msg}`);
        }
        return;
      }

      if (data.type === 'offer') {
        console.log('Received WebRTC offer from proctor');
        if (pcRef.current) pcRef.current.close();

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        pcRef.current = pc;

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current!));
        }

        pc.onicecandidate = (e) => {
          if (e.candidate && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'ice-candidate',
              target: 'proctor',
              candidate: e.candidate
            }));
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'answer',
            target: 'proctor',
            sdp: answer
          }));
        }
      } else if (data.type === 'ice-candidate') {
        if (pcRef.current && pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } else if (data.type === 'warning') {
        setActiveWarning(data.message);
      }
    };

    // C. Activity Change & Browser Lockdown Event Handlers
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logViolationWithCheck('TAB_SWITCH', 'Candidate navigated away from the exam tab/minimized window.');
        setActiveWarning('WARNING: You navigated away from the exam tab. This violation has been logged.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logViolationWithCheck('FULLSCREEN_EXIT', 'Candidate exited fullscreen mode.');
        setActiveWarning('WARNING: You exited fullscreen mode. Fullscreen lock is required. Please re-enter fullscreen immediately.');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Prevent Right-Click Context Menu
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    // Prevent Copy / Cut / Paste
    const handleClipboard = (e: ClipboardEvent) => e.preventDefault();
    document.addEventListener('copy', handleClipboard);
    document.addEventListener('cut', handleClipboard);
    document.addEventListener('paste', handleClipboard);

    // Keyboard Shortcuts Interception (DevTools, Print, Copy/Paste)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toUpperCase();

      // F12 or Ctrl+Shift+I (DevTools attempt)
      if (e.key === 'F12' || (isCtrlOrCmd && e.shiftKey && key === 'I')) {
        e.preventDefault();
        e.stopPropagation();
        logViolationWithCheck('DEVTOOLS_OPEN', `Candidate attempted to open DevTools via shortcut (${e.key}).`);
        setActiveWarning('WARNING: Developer tools access is strictly forbidden during active examination.');
        return;
      }

      // Ctrl+P (Print attempt)
      if (isCtrlOrCmd && key === 'P') {
        e.preventDefault();
        e.stopPropagation();
        logViolationWithCheck('PRINT_ATTEMPT', 'Candidate attempted to print or export the exam page (Ctrl+P).');
        setActiveWarning('WARNING: Printing or saving exam content is strictly forbidden.');
        return;
      }

      // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+S
      if (isCtrlOrCmd && ['C', 'V', 'X', 'A', 'S'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // BeforeUnload Refresh/Exit Warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Warning: Refreshing or exiting during an active exam will log a violation.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Back Button History Trap
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);

    // D. Periodic Webcam Snapshot Capture (Every 20 Seconds)
    const snapshotInterval = setInterval(() => {
      if (streamRef.current && videoRef.current && videoRef.current.videoWidth > 0) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 640, 480);
            canvas.toBlob((blob) => {
              if (blob) {
                const formData = new FormData();
                formData.append('image', blob, 'snapshot.jpg');
                axiosClient.post(`/student/attempts/${attemptId}/snapshot`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                }).catch(err => console.error('Snapshot upload failed:', err));
              }
            }, 'image/jpeg', 0.7);
          }
        } catch (err) {
          console.error('Snapshot capture error:', err);
        }
      }
    }, 20000);

    // E. Initial Fullscreen trigger attempt
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fallback to overlay
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleClipboard);
      document.removeEventListener('cut', handleClipboard);
      document.removeEventListener('paste', handleClipboard);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      clearInterval(snapshotInterval);

      if (pcRef.current) pcRef.current.close();
      if (wsRef.current) wsRef.current.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [loading, error, session, attemptId]);

  // Filter questions for the active subject dynamically
  const availableSubjects = Array.from(
    new Set(session?.questions.map(q => q.subject) || [])
  );
  const subjectQuestions = session?.questions.filter(q => q.subject === activeSubject) || [];
  const displayQuestions = subjectQuestions.length > 0 ? subjectQuestions : (session?.questions || []);
  const currentQuestion: QuestionSession | undefined = displayQuestions[currentQuestionIndex] || session?.questions[currentQuestionIndex];
  const currentAnswer: AnswerSession | undefined = session?.answers.find(a => a.questionId === currentQuestion?.id);

  // Inputs ref for the 5s periodic interval
  const inputsRef = useRef({ selectedOption, numericalValue, currentQuestion, session });
  useEffect(() => {
    inputsRef.current = { selectedOption, numericalValue, currentQuestion, session };
  }, [selectedOption, numericalValue, currentQuestion, session]);

  // Update input states when changing question
  useEffect(() => {
    if (currentAnswer) {
      setSelectedOption(currentAnswer.selectedOption);
      setNumericalValue(currentAnswer.numericalAnswer != null ? String(currentAnswer.numericalAnswer) : '');

      // Auto-mark as NOT_ANSWERED if it was NOT_VISITED when viewing it
      if (currentAnswer.status === 'NOT_VISITED') {
        saveAnswerState(currentQuestion!.id, null, null, 'NOT_ANSWERED');
      }
    }
  }, [currentQuestionIndex, session]);

  // 3. Save Question Response Incrementally
  const saveAnswerState = (
    questionId: string,
    option: string | null,
    numVal: number | null,
    status: 'NOT_VISITED' | 'NOT_ANSWERED' | 'ANSWERED' | 'MARKED_FOR_REVIEW' | 'ANSWERED_AND_MARKED_FOR_REVIEW'
  ) => {
    if (!session) return;

    // Instantly update local react state for responsive palette changes
    const updatedAnswers = session.answers.map(ans => {
      if (ans.questionId === questionId) {
        return { ...ans, selectedOption: option, numericalAnswer: numVal, status };
      }
      return ans;
    });
    setSession({ ...session, answers: updatedAnswers });

    // Send payload to backend asynchronously (autosave)
    axiosClient.post(`/student/attempts/${attemptId}/save`, {
      questionId,
      selectedOption: option,
      numericalAnswer: numVal,
      status
    }).then((res: any) => {
      const data = res.data || res;
      if (data?.autosubmitted) {
        navigate('/student/dashboard?reason=expired');
      }
    }).catch(err => console.error('Autosave sync failed:', err));
  };

  const saveCurrentQuestionState = () => {
    const { selectedOption: sel, numericalValue: num, currentQuestion: curQ, session: sess } = inputsRef.current;
    if (!curQ || !sess) return;
    const currentAns = sess.answers.find(a => a.questionId === curQ.id);
    if (!currentAns) return;

    let numericAnswerParsed: number | null = null;
    if (curQ.questionType === 'NUMERICAL') {
      if (num.trim() !== '') {
        const val = parseFloat(num);
        if (!isNaN(val)) {
          numericAnswerParsed = val;
        }
      }
    }

    const hasOptionChanged = (curQ.questionType === 'MCQ' || curQ.questionType === 'MULTIPLE_CHOICE') && sel !== currentAns.selectedOption;
    const hasNumericalChanged = curQ.questionType === 'NUMERICAL' && (numericAnswerParsed !== currentAns.numericalAnswer || (num === '' && currentAns.numericalAnswer !== null));

    if (hasOptionChanged || hasNumericalChanged) {
      let status = currentAns.status;
      const hasInput = (curQ.questionType === 'MCQ' || curQ.questionType === 'MULTIPLE_CHOICE') ? !!sel : num.trim() !== '';
      if (hasInput && (status === 'NOT_VISITED' || status === 'NOT_ANSWERED')) {
        status = 'ANSWERED';
      } else if (!hasInput && (status === 'ANSWERED' || status === 'ANSWERED_AND_MARKED_FOR_REVIEW')) {
        status = 'NOT_ANSWERED';
      }
      saveAnswerState(curQ.id, sel, numericAnswerParsed, status);
    }
  };

  // Periodic Autosave Interval (every 5 seconds)
  useEffect(() => {
    if (loading || error || !session) return;

    const interval = setInterval(() => {
      saveCurrentQuestionState();
    }, 5000);

    return () => clearInterval(interval);
  }, [loading, error, session]);

  // Action Buttons
  const handleSaveAndNext = () => {
    if (!currentQuestion) return;

    let status: 'ANSWERED' | 'NOT_ANSWERED' = 'NOT_ANSWERED';
    let numericAnswerParsed: number | null = null;

    if (currentQuestion.questionType === 'MCQ' || currentQuestion.questionType === 'MULTIPLE_CHOICE') {
      if (selectedOption) {
        status = 'ANSWERED';
      }
    } else {
      if (numericalValue.trim() !== '') {
        const val = parseFloat(numericalValue);
        if (!isNaN(val)) {
          numericAnswerParsed = val;
          status = 'ANSWERED';
        }
      }
    }

    saveAnswerState(currentQuestion.id, selectedOption, numericAnswerParsed, status);
    advanceToNextQuestion();
  };

  const handleMarkForReviewAndNext = () => {
    if (!currentQuestion) return;

    let status: 'MARKED_FOR_REVIEW' | 'ANSWERED_AND_MARKED_FOR_REVIEW' = 'MARKED_FOR_REVIEW';
    let numericAnswerParsed: number | null = null;

    if (currentQuestion.questionType === 'MCQ' || currentQuestion.questionType === 'MULTIPLE_CHOICE') {
      if (selectedOption) {
        status = 'ANSWERED_AND_MARKED_FOR_REVIEW';
      }
    } else {
      if (numericalValue.trim() !== '') {
        const val = parseFloat(numericalValue);
        if (!isNaN(val)) {
          numericAnswerParsed = val;
          status = 'ANSWERED_AND_MARKED_FOR_REVIEW';
        }
      }
    }

    saveAnswerState(currentQuestion.id, selectedOption, numericAnswerParsed, status);
    advanceToNextQuestion();
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    setSelectedOption(null);
    setNumericalValue('');
    saveAnswerState(currentQuestion.id, null, null, 'NOT_ANSWERED');
  };

  const advanceToNextQuestion = () => {
    if (!session) return;
    
    // Find next index for active subject
    const currentSubjectIndex = subjectQuestions.findIndex(q => q.id === currentQuestion?.id);
    if (currentSubjectIndex < subjectQuestions.length - 1) {
      const nextQuestion = subjectQuestions[currentSubjectIndex + 1];
      const overallIndex = session.questions.findIndex(q => q.id === nextQuestion.id);
      setCurrentQuestionIndex(overallIndex);
    }
  };

  const navigateToQuestion = (questionId: string) => {
    if (!session) return;
    saveCurrentQuestionState();
    const overallIndex = session.questions.findIndex(q => q.id === questionId);
    if (overallIndex !== -1) {
      setCurrentQuestionIndex(overallIndex);
    }
  };

  const handleSubjectChange = (subject: 'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS') => {
    if (!session) return;
    saveCurrentQuestionState();
    setActiveSubject(subject);
    const firstIndex = session.questions.findIndex(q => q.subject === subject);
    if (firstIndex !== -1) {
      setCurrentQuestionIndex(firstIndex);
    }
  };

  // 4. Submit Operations
  const handleAutoSubmit = () => {
    setSubmitting(true);
    axiosClient.post(`/student/attempts/${attemptId}/submit`)
      .then(() => {
        navigate('/student/dashboard?submit=success');
      })
      .catch((err) => {
        console.error('Auto-submit failed:', err);
        navigate('/student/dashboard');
      });
  };

  const handleFinalSubmit = () => {
    setSubmitting(true);
    axiosClient.post(`/student/attempts/${attemptId}/submit`)
      .then(() => {
        navigate('/student/dashboard');
      })
      .catch((err) => {
        console.error('Submission failed:', err);
        setError(err?.message || 'Failed to submit test');
        setShowSubmitModal(false);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  // Helper counters for legend stats
  const getSubjectStats = (subject: 'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS') => {
    const qIds = session?.questions.filter(q => q.subject === subject).map(q => q.id) || [];
    const answers = session?.answers.filter(ans => qIds.includes(ans.questionId)) || [];
    
    return {
      answered: answers.filter(a => a.status === 'ANSWERED').length,
      notAnswered: answers.filter(a => a.status === 'NOT_ANSWERED').length,
      marked: answers.filter(a => a.status === 'MARKED_FOR_REVIEW').length,
      markedAnswered: answers.filter(a => a.status === 'ANSWERED_AND_MARKED_FOR_REVIEW').length,
      notVisited: answers.filter(a => a.status === 'NOT_VISITED').length,
    };
  };

  const totalStats = {
    answered: session?.answers.filter(a => a.status === 'ANSWERED').length || 0,
    notAnswered: session?.answers.filter(a => a.status === 'NOT_ANSWERED').length || 0,
    marked: session?.answers.filter(a => a.status === 'MARKED_FOR_REVIEW').length || 0,
    markedAnswered: session?.answers.filter(a => a.status === 'ANSWERED_AND_MARKED_FOR_REVIEW').length || 0,
    notVisited: session?.answers.filter(a => a.status === 'NOT_VISITED').length || 0,
  };

  const getQuestionPaletteStyle = (status: string) => {
    switch (status) {
      case 'ANSWERED':
        return 'bg-emerald-500 text-white rounded-br-2xl'; // Green answered
      case 'NOT_ANSWERED':
        return 'bg-red-500 text-white rounded-t-2xl'; // Red not answered
      case 'MARKED_FOR_REVIEW':
        return 'bg-purple-600 text-white rounded-full'; // Purple marked
      case 'ANSWERED_AND_MARKED_FOR_REVIEW':
        return 'bg-purple-600 text-white rounded-full relative after:content-[\'\'] after:absolute after:bottom-0.5 after:right-0.5 after:w-2 after:h-2 after:bg-emerald-400 after:rounded-full'; // Purple + green dot
      case 'NOT_VISITED':
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700'; // Gray
    }
  };

  // Formatter for timer duration
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-slate-950">
        <RotateCcw className="w-12 h-12 text-cyan-400 animate-spin" />
        <h2 className="text-xl font-bold text-white">Loading NTA Computer-Based Test Engine...</h2>
        <p className="text-xs text-slate-400">Syncing questions & pre-loading increment autosave configurations</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-slate-950 px-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-white">Initialization Failure</h2>
        <p className="text-sm text-slate-400 max-w-md">{error || 'Session parameters could not be loaded.'}</p>
        <button onClick={() => navigate('/student/dashboard')} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-semibold border border-slate-700">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleCheckboxChange = (opt: 'A' | 'B' | 'C' | 'D', checked: boolean) => {
    let currentList = selectedOption ? selectedOption.split(',').map(s => s.trim()) : [];
    if (checked) {
      if (!currentList.includes(opt)) {
        currentList.push(opt);
      }
    } else {
      currentList = currentList.filter(o => o !== opt);
    }
    currentList.sort();
    setSelectedOption(currentList.length > 0 ? currentList.join(',') : null);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 select-none overflow-hidden h-screen text-slate-100">
      
      {activeWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
          <div className="max-w-md w-full bg-slate-900 border border-red-500 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-wider">Security Violation Flagged</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">{activeWarning}</p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  setActiveWarning(null);
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  }
                }}
                className="w-full px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Acknowledge & Re-enter Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 1. Fullscreen NTA Player Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center font-black text-white text-xs">
            NTA
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white uppercase tracking-wider">{session.examTitle}</h1>
            <p className="text-[10px] text-slate-400">JEE Computer-Based Test Mode (Simulation)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 font-mono">
            <Shield className={`w-4 h-4 ${violationCount >= 2 ? 'text-red-400' : violationCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span className="text-xs font-semibold text-slate-300">Violations:</span>
            <span className={`text-sm font-black ${violationCount >= 2 ? 'text-red-400' : violationCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {violationCount} / 3
            </span>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 font-mono">
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">Time Left:</span>
            <span className={`text-sm font-black ${timeLeft < 300 ? 'text-red-500' : 'text-cyan-400'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      {/* Subject Navigation Tabs Row */}
      <nav className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2 flex items-center gap-2 shrink-0">
        {(availableSubjects.length > 0 ? availableSubjects : ['GENERAL']).map((sub) => (
          <button
            key={sub}
            onClick={() => {
              setActiveSubject(sub);
              const firstIndex = session?.questions.findIndex(q => q.subject === sub) ?? 0;
              setCurrentQuestionIndex(firstIndex !== -1 ? firstIndex : 0);
            }}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeSubject === sub
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {sub}
          </button>
        ))}
      </nav>

      {/* Main Workspace: Left Question Box, Right Palette Panel */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Question Display */}
        <div className="flex-1 flex flex-col overflow-y-auto border-r border-slate-800/60 p-6 space-y-6">
          {currentQuestion ? (
            <>
              {/* Question Meta Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <div className="space-y-1">
                  <span className="text-sm font-bold text-white">
                    Question No. {subjectQuestions.findIndex(q => q.id === currentQuestion.id) + 1}
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ID: {currentQuestion.id} | Section: {currentQuestion.section.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-semibold">
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Correct: +{currentQuestion.markingPositive}
                  </span>
                  <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    Incorrect: -{currentQuestion.markingNegative}
                  </span>
                </div>
              </div>

              {/* Main content layout (split if passageText is present) */}
              <div className={`flex-1 flex ${currentQuestion.passageText ? 'flex-col md:flex-row gap-6' : 'flex-col'} overflow-hidden min-h-0`}>
                
                {/* Passage Box (Left Column if present) */}
                {currentQuestion.passageText && (
                  <div className="flex-1 md:w-1/2 overflow-y-auto p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3 shadow-inner">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-cyan-400" />
                      Comprehension Passage Instructions
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-line text-slate-300 font-mono p-1">
                      {currentQuestion.passageText}
                    </div>
                  </div>
                )}

                {/* Question & Options Area (Right Column or full width) */}
                <div className={`flex-1 ${currentQuestion.passageText ? 'md:w-1/2 overflow-y-auto' : ''} space-y-5`}>
                  <div>
                    <div className="font-semibold text-white text-base">Question Text:</div>
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 whitespace-pre-line text-sm mt-2">
                      {currentQuestion.questionText}
                    </div>
                  </div>

                  {/* Options & Input Fields */}
                  <div className="pt-2">
                    {currentQuestion.questionType === 'MCQ' ? (
                      <div className="space-y-3">
                        {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                          const optText = opt === 'A' ? currentQuestion.optionA :
                                          opt === 'B' ? currentQuestion.optionB :
                                          opt === 'C' ? currentQuestion.optionC : currentQuestion.optionD;
                          return (
                            <label
                              key={opt}
                              className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                                selectedOption === opt
                                  ? 'bg-blue-600/10 border-blue-500 text-white'
                                  : 'bg-slate-900/20 border-slate-800 hover:border-slate-700 text-slate-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="mcq-option"
                                checked={selectedOption === opt}
                                onChange={() => setSelectedOption(opt)}
                                className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
                              />
                              <span className="font-bold text-xs">{opt}.</span>
                              <span>{optText}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : currentQuestion.questionType === 'MULTIPLE_CHOICE' ? (
                      <div className="space-y-3">
                        <div className="text-xs text-amber-400 font-semibold mb-2 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Multi-Select Question: Select one or more correct options.
                        </div>
                        {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                          const optText = opt === 'A' ? currentQuestion.optionA :
                                          opt === 'B' ? currentQuestion.optionB :
                                          opt === 'C' ? currentQuestion.optionC : currentQuestion.optionD;
                          const isChecked = selectedOption ? selectedOption.split(',').includes(opt) : false;
                          return (
                            <label
                              key={opt}
                              className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-cyan-500/10 border-cyan-500 text-white'
                                  : 'bg-slate-900/20 border-slate-800 hover:border-slate-700 text-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleCheckboxChange(opt, e.target.checked)}
                                className="w-4 h-4 text-cyan-500 bg-slate-900 border-slate-700 rounded focus:ring-cyan-500"
                              />
                              <span className="font-bold text-xs">{opt}.</span>
                              <span>{optText}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Enter Numerical Answer Value:
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={numericalValue}
                          onChange={(e) => setNumericalValue(e.target.value)}
                          placeholder="e.g. 25.0"
                          className="max-w-xs w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              No questions found for this subject.
            </div>
          )}
        </div>

        {/* Right Side: Candidate Card, Question Palette */}
        <aside className="w-80 bg-slate-900/40 border-l border-slate-800/80 p-6 flex flex-col space-y-6 shrink-0 overflow-y-auto">
          {/* Candidate Bio Panel */}
          <div className="flex flex-col bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Candidate</div>
                <div className="text-sm font-bold text-white">{user?.firstName} {user?.lastName}</div>
              </div>
            </div>

            {/* Local Webcam Streaming Preview */}
            <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center text-slate-500">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              {!localStream && (
                <div className="flex flex-col items-center gap-1.5 text-center p-2">
                  <Shield className="w-5 h-5 text-red-500 animate-pulse" />
                  <span className="text-[9px] uppercase font-black tracking-wider text-red-500">Camera Offline</span>
                </div>
              )}
              {localStream && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500/80 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white tracking-widest shadow animate-pulse">
                  <span className="w-1 h-1 rounded-full bg-white"></span>
                  Live Proctored
                </div>
              )}
            </div>
          </div>

          {/* Question Palette Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question Palette</h4>
            <div className="grid grid-cols-4 gap-3">
              {displayQuestions.map((q, idx) => {
                const ans = session.answers.find(a => a.questionId === q.id);
                const overallIdx = session.questions.findIndex(allQ => allQ.id === q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => navigateToQuestion(q.id)}
                    className={`h-11 flex items-center justify-center font-bold text-sm transition-all ${getQuestionPaletteStyle(
                      ans?.status || 'NOT_VISITED'
                    )} ${currentQuestionIndex === overallIdx ? 'ring-2 ring-cyan-400 scale-105' : ''}`}
                  >
                    {(idx + 1).toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend Panel */}
          <div className="space-y-3 pt-6 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legend Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-400 font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-800 border border-slate-700 flex items-center justify-center text-white text-[9px] font-bold">0</span>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-red-500 rounded-t-2xl flex items-center justify-center text-white text-[9px] font-bold">0</span>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-emerald-500 rounded-br-2xl flex items-center justify-center text-white text-[9px] font-bold">0</span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold">0</span>
                <span>Marked</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <span className="w-5 h-5 bg-purple-600 rounded-full relative after:content-[''] after:absolute after:bottom-0.5 after:right-0.5 after:w-1.5 after:h-1.5 after:bg-emerald-400 after:rounded-full flex items-center justify-center text-white text-[8px] font-bold">0</span>
                <span>Answered & Marked</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Action Footer Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClearResponse}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all"
          >
            Clear Response
          </button>
          <button
            onClick={handleMarkForReviewAndNext}
            className="px-5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold border border-purple-500/30 transition-all"
          >
            Mark for Review & Next
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAndNext}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all"
          >
            Save & Next
          </button>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/25 transition-all"
          >
            Submit
          </button>
        </div>
      </footer>

      {/* EXAM PAUSED OVERLAY MODAL */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-amber-500/40 text-center space-y-4 shadow-2xl animate-pulse">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">EXAM PAUSED BY PROCTOR</h3>
            <p className="text-xs text-amber-300 leading-relaxed font-semibold">
              {pauseReason || 'Your active examination session has been temporarily paused by the proctoring team.'}
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              Please remain seated in front of your camera. Your exam timer will unfreeze as soon as the proctor resumes your session.
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="max-w-2xl w-full glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <FileCheck className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-2xl font-extrabold text-white">Final Exam Submission Summary</h3>
              <p className="text-xs text-slate-400">Review your responses per subject before final scoring</p>
            </div>

            {/* Breakdown Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Subject</th>
                    <th className="p-3 text-center">Answered</th>
                    <th className="p-3 text-center">Not Answered</th>
                    <th className="p-3 text-center">Marked</th>
                    <th className="p-3 text-center">Ans & Marked</th>
                    <th className="p-3 text-center">Not Visited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(['PHYSICS', 'CHEMISTRY', 'MATHEMATICS'] as const).map(sub => {
                    const stats = getSubjectStats(sub);
                    return (
                      <tr key={sub} className="hover:bg-slate-900/30">
                        <td className="p-3 font-bold text-white">{sub}</td>
                        <td className="p-3 text-center text-emerald-400">{stats.answered}</td>
                        <td className="p-3 text-center text-red-400">{stats.notAnswered}</td>
                        <td className="p-3 text-center text-purple-400">{stats.marked}</td>
                        <td className="p-3 text-center text-purple-300">{stats.markedAnswered}</td>
                        <td className="p-3 text-center text-slate-500">{stats.notVisited}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-900 font-bold text-white">
                    <td className="p-3">Total</td>
                    <td className="p-3 text-center text-emerald-400">{totalStats.answered}</td>
                    <td className="p-3 text-center text-red-400">{totalStats.notAnswered}</td>
                    <td className="p-3 text-center text-purple-400">{totalStats.marked}</td>
                    <td className="p-3 text-center text-purple-300">{totalStats.markedAnswered}</td>
                    <td className="p-3 text-center text-slate-500">{totalStats.notVisited}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Warning:</strong> You will not be able to change your responses or resume the exam session once submitted. Final score and feedback will be generated immediately.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all"
              >
                Go Back to Exam
              </button>
              <button
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/25 transition-all flex items-center gap-1.5"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
