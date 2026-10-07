import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Search,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Copy,
  Check,
  Building,
  User,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  FileText,
  HelpCircle,
  X,
  Sparkles,
  Users,
  Image as ImageIcon,
  Wrench,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Hourglass
} from 'lucide-react';

export default function AdminPortal() {
  const navigate = useNavigate();

  // Auth State
  const [token, setToken] = useState(() => localStorage.getItem('promptify_admin_token') || null);
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Navigation Tab ('participants' vs 'submissions')
  const [activeTab, setActiveTab] = useState('participants');

  // Data Collections
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');

  // FULL-SCREEN IMAGE VIEWER LIGHTBOX STATE
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Delete Confirmation State
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteType, setDeleteType] = useState('submission');
  const [isDeleting, setIsDeleting] = useState(false);

  // ESC Key Listener for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeFullscreenViewer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const closeFullscreenViewer = () => {
    setFullscreenImage(null);
    setZoomScale(1);
  };

  // Fetch Participant Details Collection
  const fetchParticipants = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedDept !== 'ALL') params.append('department', selectedDept);
      if (selectedYear !== 'ALL') params.append('year', selectedYear);

      const res = await fetch(`/api/admin/participants?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setParticipants(data.participants || []);
      }
    } catch (err) {
      setError('Failed to fetch participant details.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Image Submissions Collection
  const fetchSubmissions = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`/api/admin/submissions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      setError('Failed to fetch image submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'participants') {
        fetchParticipants();
      } else {
        fetchSubmissions();
      }
    }
  }, [token, activeTab, selectedDept, selectedYear]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'participants') fetchParticipants();
    else fetchSubmissions();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('promptify_admin_token', data.token);
      } else {
        setLoginError(data.error || 'Invalid passcode');
      }
    } catch (err) {
      setLoginError('Failed to connect to backend server');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('promptify_admin_token');
  };

  const handleExportCSV = (type) => {
    if (!token) return;
    window.open(`/api/admin/export-csv?token=${token}&type=${type}`, '_blank');
  };

  const handleDeleteItem = async () => {
    if (!deleteTargetId || !token) return;
    setIsDeleting(true);

    try {
      const endpoint = deleteType === 'participant'
        ? `/api/admin/participants/${deleteTargetId}`
        : `/api/admin/submissions/${deleteTargetId}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        if (deleteType === 'participant') {
          setParticipants((prev) => prev.filter((p) => p.participant_id !== deleteTargetId));
        } else {
          setSubmissions((prev) => prev.filter((s) => s.submission_id !== deleteTargetId));
        }
        setDeleteTargetId(null);
      } else {
        alert('Failed to delete item.');
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyPrompt = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Timer & Duration Helpers
  const getParticipantTimerStatus = (p) => {
    if (p.uploaded_at) {
      const elapsedSeconds = Math.max(0, Math.floor((p.uploaded_at - p.start_time) / 1000));
      const mins = Math.floor(elapsedSeconds / 60);
      const secs = elapsedSeconds % 60;
      return {
        label: `Completed in ${mins}m ${secs}s`,
        badgeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    }

    const elapsedNow = Math.floor((Date.now() - p.start_time) / 1000);
    const remaining = Math.max(0, 1800 - elapsedNow);

    if (remaining <= 0) {
      return {
        label: "Expired (30m Time's Up)",
        badgeClass: 'bg-red-950/80 text-red-400 border-red-500/40',
        icon: <ShieldAlert className="w-3.5 h-3.5" />,
      };
    }

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return {
      label: `Active (${mins}m ${secs}s left)`,
      badgeClass: 'bg-amber-950/80 text-amber-400 border-amber-500/40 animate-pulse',
      icon: <Hourglass className="w-3.5 h-3.5" />,
    };
  };

  const getSubmissionDuration = (sub) => {
    if (!sub.participant_start_time || !sub.uploaded_at) return null;
    const elapsedSeconds = Math.max(0, Math.floor((sub.uploaded_at - sub.participant_start_time) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins}m ${secs}s / 30m`;
  };

  // Zoom Helpers
  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.5, 0.5));
  const handleResetZoom = () => setZoomScale(1);

  // LOGIN SCREEN
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#080c14] relative overflow-hidden">
        <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">PROMPTIFY ADMIN</h1>
            <p className="text-xs text-slate-400 mt-1">Event Administration & Evaluation Dashboard</p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Admin Passcode</span>
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin passcode (Default: admin123)"
                className="w-full px-4 py-3 rounded-xl glass-input text-sm tracking-wider"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-bold text-black text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition-all"
            >
              {isLoggingIn ? 'Authenticating...' : 'Access Admin Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-between">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black tracking-tight text-white">PROMPTIFY ADMIN</h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                  30-Min Event Timer Mode
                </span>
              </div>
              <p className="text-xs text-slate-400">Manage Participant Details and Image Submissions Independently</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExportCSV(activeTab)}
              className="px-4 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center space-x-2 shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export {activeTab === 'participants' ? 'Participants CSV' : 'Submissions CSV'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* DUAL NAVIGATION TABS */}
        <div className="flex border-b border-slate-800 space-x-4">
          <button
            onClick={() => setActiveTab('participants')}
            className={`flex items-center space-x-2 pb-4 px-2 text-sm font-extrabold transition-all border-b-2 ${
              activeTab === 'participants'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Section 1 — Participant Details</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs">
              {participants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center space-x-2 pb-4 px-2 text-sm font-extrabold transition-all border-b-2 ${
              activeTab === 'submissions'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            <span>Section 2 — Image Submissions</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs">
              {submissions.length}
            </span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'participants' ? 'Search ID, Name, Email, College...' : 'Search Participant ID, AI Tool, Prompt...'}
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
            />
          </form>

          {activeTab === 'participants' && (
            <div className="flex items-center space-x-3">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 rounded-xl glass-input text-xs bg-slate-900 border border-slate-700"
              >
                <option value="ALL">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="IT">IT</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="AI & DS">AI & DS</option>
                <option value="AI & ML">AI & ML</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 rounded-xl glass-input text-xs bg-slate-900 border border-slate-700"
              >
                <option value="ALL">All Years</option>
                <option value="First Year">First Year</option>
                <option value="Second Year">Second Year</option>
                <option value="Third Year">Third Year</option>
                <option value="Fourth Year">Fourth Year</option>
              </select>
            </div>
          )}

          <button
            onClick={activeTab === 'participants' ? fetchParticipants : fetchSubmissions}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* SECTION 1: PARTICIPANT DETAILS TABLE WITH 30-MINUTE TIMER STATUS */}
        {activeTab === 'participants' && (
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Participant Registration Collection</h3>
                <p className="text-xs text-slate-400">Strictly registration metadata & 30-minute competition completion timer</p>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading participants...</div>
            ) : participants.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No participant records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-4">Participant ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">College</th>
                      <th className="p-4">Department & Year</th>
                      <th className="p-4">Email / Phone</th>
                      <th className="p-4">Start Time</th>
                      <th className="p-4">30-Min Event Timer Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {participants.map((p) => {
                      const timerStatus = getParticipantTimerStatus(p);
                      return (
                        <tr key={p.participant_id} className="hover:bg-slate-900/50">
                          <td className="p-4 font-mono font-bold text-cyan-400">{p.participant_id}</td>
                          <td className="p-4 font-semibold text-white">{p.full_name}</td>
                          <td className="p-4 text-slate-300">{p.college_name}</td>
                          <td className="p-4 text-purple-300 font-medium">
                            {p.department} ({p.year_of_study})
                          </td>
                          <td className="p-4 text-slate-300">
                            <div>{p.email}</div>
                            <div className="text-[11px] font-mono text-slate-400">{p.mobile_number}</div>
                          </td>
                          <td className="p-4 font-mono text-slate-400">
                            {new Date(p.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          {/* 30-Minute Timer Badge */}
                          <td className="p-4">
                            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-[11px] font-bold ${timerStatus.badgeClass}`}>
                              {timerStatus.icon}
                              <span>{timerStatus.label}</span>
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setDeleteTargetId(p.participant_id);
                                setDeleteType('participant');
                              }}
                              className="p-1.5 rounded bg-red-950/60 text-red-400 hover:bg-red-900/60"
                              title="Delete Participant Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: IMAGE SUBMISSIONS COLLECTION WITH ELAPSED DURATION */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Image Submissions Collection</h3>
                <p className="text-xs text-slate-400">Click any image to launch the high-resolution Full-Screen Lightbox Viewer</p>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading image submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="glass-card p-12 rounded-2xl text-center text-slate-400 border border-slate-800">
                No image submissions recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.map((sub) => {
                  const durationStr = getSubmissionDuration(sub);
                  return (
                    <div key={sub.submission_id} className="glass-card rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-purple-500/40 transition-all">
                      {/* Clickable Image Box */}
                      <div
                        onClick={() => setFullscreenImage(sub)}
                        className="relative h-60 bg-black overflow-hidden group cursor-pointer"
                      >
                        <img src={sub.image_url} alt={sub.participant_id} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                        <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded border border-slate-700 text-[10px] font-mono text-cyan-400 font-bold">
                          Participant: {sub.participant_id}
                        </div>

                        {durationStr && (
                          <div className="absolute top-3 right-3 bg-emerald-950/90 text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded border border-emerald-500/40 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span>{durationStr}</span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-2 text-white font-bold text-xs transition-all">
                          <Maximize2 className="w-5 h-5 text-cyan-400" />
                          <span>Open Full-Screen Lightbox</span>
                        </div>
                      </div>

                      {/* Metadata Summary */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-amber-400 flex items-center space-x-1">
                              <Wrench className="w-3.5 h-3.5" />
                              <span>{sub.ai_tool || 'AI Generator'}</span>
                            </span>
                            <span className="text-slate-400 font-semibold">{sub.participant_name}</span>
                          </div>
                          <p className="text-xs text-slate-300 font-mono italic line-clamp-2">"{sub.prompt}"</p>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(sub.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setFullscreenImage(sub)}
                              className="p-1.5 rounded bg-slate-800 text-cyan-400 hover:text-white"
                              title="Open Full Screen Lightbox"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <a
                              href={sub.image_url}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded bg-slate-800 text-emerald-400"
                              title="Download Image"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => {
                                setDeleteTargetId(sub.submission_id);
                                setDeleteType('submission');
                              }}
                              className="p-1.5 rounded bg-red-950/60 text-red-400 hover:bg-red-900/60"
                              title="Delete Submission"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FULL-SCREEN IMAGE LIGHTBOX VIEWER MODAL */}
      {fullscreenImage && (
        <div
          onClick={closeFullscreenViewer}
          className="fixed inset-0 z-50 flex flex-col justify-between p-4 md:p-6 bg-black/95 backdrop-blur-md animate-fadeIn select-none"
        >
          {/* Lightbox Header Bar */}
          <div className="w-full flex items-center justify-between z-10 bg-slate-950/80 p-3 rounded-2xl border border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded bg-cyan-950 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
                Participant: {fullscreenImage.participant_id}
              </span>
              <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
                Submission #{fullscreenImage.submission_id}
              </span>
              <span className="text-xs text-amber-400 font-medium hidden md:inline">
                • Tool: {fullscreenImage.ai_tool || 'AI Platform'}
              </span>
              {getSubmissionDuration(fullscreenImage) && (
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  ⏱ {getSubmissionDuration(fullscreenImage)}
                </span>
              )}
            </div>

            {/* Lightbox Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700 font-mono"
                title="Reset Zoom"
              >
                {Math.round(zoomScale * 100)}%
              </button>

              <a
                href={fullscreenImage.image_url}
                download
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/30"
                title="Download Image"
              >
                <Download className="w-4 h-4" />
              </a>

              <button
                onClick={closeFullscreenViewer}
                className="p-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-400 border border-red-500/30 ml-2"
                title="Close (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Full Screen Image Viewport */}
          <div className="flex-1 flex items-center justify-center my-4 overflow-auto relative cursor-grab active:cursor-grabbing">
            <img
              src={fullscreenImage.image_url}
              alt="Submitted AI Artwork"
              style={{ transform: `scale(${zoomScale})`, transition: 'transform 0.2s ease-out' }}
              className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800/80"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Lightbox Footer Panel */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl mx-auto bg-slate-950/90 p-4 md:p-5 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs z-10"
          >
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Exact AI Prompt</span>
                </span>
                <button
                  onClick={() => handleCopyPrompt(fullscreenImage.prompt)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-slate-200 leading-relaxed max-h-24 overflow-y-auto">
                {fullscreenImage.prompt}
              </p>
            </div>

            <div>
              <span className="font-bold text-white mb-1 block flex items-center space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Image Meaning & Story</span>
              </span>
              <p className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
                {fullscreenImage.concept}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="glass-card max-w-sm w-full p-6 rounded-2xl border border-red-500/40 text-center space-y-4">
            <h3 className="text-base font-bold text-white">Delete {deleteType === 'participant' ? 'Participant Record' : 'Submission'} #{deleteTargetId}?</h3>
            <p className="text-xs text-slate-400">This action cannot be undone.</p>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button onClick={() => setDeleteTargetId(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs">Cancel</button>
              <button onClick={handleDeleteItem} disabled={isDeleting} className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
