import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  User,
  Building,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  FileText,
  HelpCircle,
  ShieldAlert,
  Play,
  RotateCcw,
  Hash,
  Wrench,
  BookOpen,
  Award,
  Pin,
  CheckSquare
} from 'lucide-react';

export default function ParticipantPortal() {
  const navigate = useNavigate();

  // Workflow Steps:
  // Step 1: Participant Details Form
  // Step 2: Rules & Regulations Screen (Timer NOT started yet)
  // Step 3: Timer Started & Image Submission Interface
  const [currentStep, setCurrentStep] = useState(1);

  // Participant Registration State
  const [participantId, setParticipantId] = useState(() => localStorage.getItem('promptify_participant_id') || '');
  const [formData, setFormData] = useState({
    fullName: '',
    collegeName: '',
    department: '',
    yearOfStudy: '',
    email: '',
    mobileNumber: '',
    registrationNo: '',
  });

  // Timer & Session State
  const [remainingSeconds, setRemainingSeconds] = useState(1800);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  // Image Upload & Submission Form (Image, AI Tool Used, Prompt, Concept)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiTool, setAiTool] = useState('');
  const [customAiTool, setCustomAiTool] = useState('');
  const [promptText, setPromptText] = useState('');
  const [conceptText, setConceptText] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Form Errors & Submission states
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccessDetails, setSubmissionSuccessDetails] = useState(null);

  const fileInputRef = useRef(null);

  // 1. Restore Active Session on Mount
  useEffect(() => {
    async function restoreSession() {
      const storedPid = localStorage.getItem('promptify_participant_id');
      if (!storedPid) {
        setLoadingSession(false);
        return;
      }

      try {
        setLoadingSession(true);
        const res = await fetch(`/api/participant/session/${storedPid}`);
        if (res.ok) {
          const data = await res.json();
          setParticipantId(data.participant.participant_id);
          setFormData({
            fullName: data.participant.full_name,
            collegeName: data.participant.college_name,
            department: data.participant.department,
            yearOfStudy: data.participant.year_of_study,
            email: data.participant.email,
            mobileNumber: data.participant.mobile_number,
            registrationNo: data.participant.participant_id,
          });

          setRemainingSeconds(data.remainingSeconds);
          setIsExpired(data.isExpired);
          setIsTimerRunning(!data.isExpired && !data.isSubmitted);

          if (data.isSubmitted) {
            setIsSubmitted(true);
            setSubmissionSuccessDetails({
              participantId: data.participant.participant_id,
              submissionId: data.submissionDetails?.submission_id,
              uploadedAt: data.submissionDetails?.uploaded_at,
            });
          } else {
            setCurrentStep(3); // Timer already active, go directly to Step 3
          }
        }
      } catch (err) {
        console.error('Error restoring session:', err);
      } finally {
        setLoadingSession(false);
      }
    }

    restoreSession();
  }, []);

  // 2. Countdown Timer Effect
  useEffect(() => {
    if (!isTimerRunning || isExpired || isSubmitted) return;

    const timerInterval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setIsTimerRunning(false);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isTimerRunning, isExpired, isSubmitted]);

  // Periodic Timer Sync
  useEffect(() => {
    if (!participantId || !isTimerRunning || isExpired || isSubmitted) return;

    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/participant/session/${participantId}`);
        if (res.ok) {
          const data = await res.json();
          setRemainingSeconds(data.remainingSeconds);
          if (data.isExpired) {
            setIsExpired(true);
            setIsTimerRunning(false);
          }
          if (data.isSubmitted) {
            setIsSubmitted(true);
            setIsTimerRunning(false);
          }
        }
      } catch (e) {
        console.error('Timer sync error:', e);
      }
    }, 15000);

    return () => clearInterval(syncInterval);
  }, [participantId, isTimerRunning, isExpired, isSubmitted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validate Step 1 Participant Details
  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.collegeName.trim()) newErrors.collegeName = 'College Name is required';
    if (!formData.department) newErrors.department = 'Please select Department';
    if (!formData.yearOfStudy) newErrors.yearOfStudy = 'Please select Year of Study';

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile Number is required';
    } else if (!mobileRegex.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber = 'Enter a valid 10-digit Indian mobile number';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Proceed from Step 1 -> Step 2 (Rules & Regulations)
  const handleProceedToRules = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // STEP 2 -> STEP 3: START TIMER & RECORD PARTICIPANT DETAILS
  const handleStartTimer = async () => {
    setIsStarting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/participant/register-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          collegeName: formData.collegeName,
          department: formData.department,
          yearOfStudy: formData.yearOfStudy,
          email: formData.email,
          mobileNumber: formData.mobileNumber,
          participantId: formData.registrationNo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start event session.');
      }

      setParticipantId(data.participantId);
      localStorage.setItem('promptify_participant_id', data.participantId);
      setRemainingSeconds(data.remainingSeconds);
      setIsTimerRunning(true);
      setIsExpired(false);
      setCurrentStep(3); // Transition to Image Upload
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsStarting(false);
    }
  };

  // Image Drag & Drop File Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: 'Invalid file format. Supported formats: JPG, JPEG, PNG, WEBP',
      }));
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: 'File size exceeds 15MB limit.',
      }));
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: null }));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // STEP 3: SUBMIT IMAGE
  const handleFinalImageSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    const step3Errors = {};
    if (!imageFile) step3Errors.image = 'Please upload your AI-generated image.';

    const selectedTool = aiTool === 'Other' ? customAiTool.trim() : aiTool;
    if (!selectedTool) step3Errors.aiTool = 'Please specify the AI Tool used.';
    if (!promptText.trim()) step3Errors.prompt = 'AI Prompt is required.';
    if (!conceptText.trim()) step3Errors.concept = 'Image meaning/concept is required.';

    if (Object.keys(step3Errors).length > 0) {
      setErrors(step3Errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadData = new FormData();
      uploadData.append('participantId', participantId);
      uploadData.append('image', imageFile);
      uploadData.append('aiTool', selectedTool);
      uploadData.append('prompt', promptText);
      uploadData.append('concept', conceptText);

      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: uploadData,
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit image.');
      }

      setIsSubmitted(true);
      setIsTimerRunning(false);
      setSubmissionSuccessDetails({
        submissionId: resData.submissionId,
        participantId: resData.participantId,
        uploadedAt: resData.uploadedAt || Date.now(),
      });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-between pb-12">
      {/* Top Header - No Admin Link */}
      <div className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black tracking-tight text-white">PROMPTIFY</h1>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  AI Image Event
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light">“Imagine. Prompt. Create.”</p>
            </div>
          </div>

          {/* 30-MINUTE TIMER (Starts ONLY in Step 3 after START is clicked) */}
          {isTimerRunning || isExpired ? (
            <div
              className={`flex items-center space-x-3 px-4 py-2 rounded-xl border transition-all ${
                isExpired
                  ? 'bg-red-950/80 border-red-500/50 text-red-400 animate-pulse'
                  : remainingSeconds <= 300
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-400 animate-pulse'
                  : 'bg-slate-900/90 border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/10'
              }`}
            >
              <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
              <div>
                <span className="text-[10px] tracking-widest uppercase font-bold text-slate-400 block">
                  TIME REMAINING
                </span>
                <span className="text-xl font-extrabold tracking-wider font-mono">
                  {formatTime(remainingSeconds)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">
              Timer starts only after clicking <span className="text-cyan-400 font-semibold">START</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-8 flex-1 w-full">
        {/* TIME'S UP BANNER */}
        {isExpired && !isSubmitted && (
          <div className="mb-8 p-6 rounded-2xl bg-red-950/60 border-2 border-red-500/60 text-red-200 text-center shadow-2xl">
            <div className="inline-flex p-3 rounded-full bg-red-900/50 text-red-400 mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">TIME'S UP</h2>
            <p className="text-sm font-medium text-red-300 max-w-md mx-auto">
              Your 30-minute event submission window has ended. Image upload and editing have been disabled.
            </p>
          </div>
        )}

        {/* SUCCESS SCREEN */}
        {isSubmitted ? (
          <div className="my-8 glass-card p-8 md:p-12 rounded-3xl text-center border-2 border-emerald-500/30 shadow-2xl relative overflow-hidden">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-500/40 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Image Submitted Successfully!</h2>
            <p className="text-base text-slate-300 max-w-lg mx-auto mb-8 font-light">
              Your Promptify entry has been successfully submitted and stored in the event database.
            </p>

            {submissionSuccessDetails && (
              <div className="glass-card p-6 rounded-2xl text-left max-w-md mx-auto border border-slate-800 space-y-3 mb-8">
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Participant ID</span>
                  <span className="font-mono font-bold text-cyan-400">{submissionSuccessDetails.participantId}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Submission ID</span>
                  <span className="font-mono text-white">#{submissionSuccessDetails.submissionId}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Submitted At</span>
                  <span className="text-slate-200">
                    {new Date(submissionSuccessDetails.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/')}
              className="px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold transition-all"
            >
              Return to Home
            </button>
          </div>
        ) : (
          <div>
            {/* Submit Error Alert */}
            {submitError && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-sm flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* STEP 1: PARTICIPANT DETAILS FORM */}
            {currentStep === 1 && (
              <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                <div className="border-b border-slate-800/80 pb-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-500/30">
                    Step 1 of 3
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2 flex items-center space-x-2">
                    <User className="w-6 h-6 text-cyan-400" />
                    <span>Participant Information</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Please provide your registration details before reviewing the event rules.
                  </p>
                </div>

                <form onSubmit={handleProceedToRules} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                      <Hash className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Participant / Registration Number (Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="registrationNo"
                      value={formData.registrationNo}
                      onChange={handleInputChange}
                      placeholder="e.g. REG-2026-089 (Leave blank for auto-generated ID)"
                      className="w-full px-4 py-3 rounded-xl glass-input text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Full Name <span className="text-red-400">*</span></span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your complete full name"
                      className={`w-full px-4 py-3 rounded-xl glass-input text-sm ${errors.fullName ? 'border-red-500' : ''}`}
                    />
                    {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-cyan-400" />
                      <span>College Name <span className="text-red-400">*</span></span>
                    </label>
                    <input
                      type="text"
                      name="collegeName"
                      value={formData.collegeName}
                      onChange={handleInputChange}
                      placeholder="Enter your college / institution name"
                      className={`w-full px-4 py-3 rounded-xl glass-input text-sm ${errors.collegeName ? 'border-red-500' : ''}`}
                    />
                    {errors.collegeName && <p className="text-xs text-red-400 mt-1">{errors.collegeName}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Department <span className="text-red-400">*</span></span>
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl glass-input text-sm bg-slate-900 ${errors.department ? 'border-red-500' : ''}`}
                      >
                        <option value="">Select Department</option>
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="IT">IT</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                        <option value="AI & DS">AI & DS</option>
                        <option value="AI & ML">AI & ML</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.department && <p className="text-xs text-red-400 mt-1">{errors.department}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Year of Study <span className="text-red-400">*</span></span>
                      </label>
                      <select
                        name="yearOfStudy"
                        value={formData.yearOfStudy}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl glass-input text-sm bg-slate-900 ${errors.yearOfStudy ? 'border-red-500' : ''}`}
                      >
                        <option value="">Select Year</option>
                        <option value="First Year">First Year</option>
                        <option value="Second Year">Second Year</option>
                        <option value="Third Year">Third Year</option>
                        <option value="Fourth Year">Fourth Year</option>
                      </select>
                      {errors.yearOfStudy && <p className="text-xs text-red-400 mt-1">{errors.yearOfStudy}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Email Address <span className="text-red-400">*</span></span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="yourname@domain.com"
                        className={`w-full px-4 py-3 rounded-xl glass-input text-sm ${errors.email ? 'border-red-500' : ''}`}
                      />
                      {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Phone / Mobile Number <span className="text-red-400">*</span></span>
                      </label>
                      <input
                        type="tel"
                        name="mobileNumber"
                        maxLength={10}
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                        placeholder="10-digit Indian mobile number"
                        className={`w-full px-4 py-3 rounded-xl glass-input text-sm font-mono ${errors.mobileNumber ? 'border-red-500' : ''}`}
                      />
                      {errors.mobileNumber && <p className="text-xs text-red-400 mt-1">{errors.mobileNumber}</p>}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-bold text-black text-sm flex items-center justify-center space-x-2 shadow-lg transition-all"
                    >
                      <span>Continue to Rules & Regulations</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: RULES & REGULATIONS DISPLAY & START TIMER BUTTON */}
            {currentStep === 2 && (
              <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-8">
                <div className="border-b border-slate-800/80 pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded border border-purple-500/30">
                      Step 2 of 3
                    </span>
                    <h2 className="text-2xl font-black text-white mt-2 flex items-center space-x-2">
                      <BookOpen className="w-6 h-6 text-cyan-400" />
                      <span>Rules & Regulations</span>
                    </h2>
                  </div>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Details</span>
                  </button>
                </div>

                {/* PROMPTIFY EVENT FORMAT */}
                <div className="glass-card p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 space-y-3">
                  <h3 className="text-sm font-extrabold text-cyan-300 flex items-center space-x-2">
                    <Pin className="w-4 h-4 text-cyan-400" />
                    <span>📌 Event Format</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Type</span>
                      <span className="font-semibold text-white">Individual Competition</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Mode</span>
                      <span className="font-semibold text-white">AI Image Generation</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Participants</span>
                      <span className="font-semibold text-white">Individual</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Duration</span>
                      <span className="font-bold text-amber-400">30 Minutes</span>
                    </div>
                  </div>
                </div>

                {/* RULES & REGULATIONS LIST */}
                <div className="space-y-4 text-xs text-slate-300">
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <CheckSquare className="w-4 h-4 text-purple-400" />
                    <span>📜 Rules & Regulations</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <h4 className="font-bold text-white mb-1">1. Theme Announcement</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>The theme/topic will be announced at the beginning of the competition.</li>
                        <li>Participants must create an AI-generated image based on the given theme.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <h4 className="font-bold text-white mb-1">2. AI Tools</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>Participants may use any AI image-generation platforms.</li>
                        <li>Participants must create their own prompts.</li>
                        <li>Copying prompts or images from other participants is not allowed.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <h4 className="font-bold text-white mb-1">3. Image Creation</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>The submitted image must be generated during the competition.</li>
                        <li>Participants can generate multiple images but must submit only one final image.</li>
                        <li>The final image must clearly relate to the given theme.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <h4 className="font-bold text-white mb-1">4. Submission Rules</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>Participants must submit their final image before the deadline.</li>
                        <li>Late submissions may not be accepted.</li>
                        <li>The submission should include: Participant Name, Final Image, AI Tool Used, and Prompt Used.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* JUDGING CRITERIA MARKS TABLE */}
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>🏆 Judging Criteria</span>
                  </h3>

                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 font-semibold">
                        <tr>
                          <th className="p-3">Criteria</th>
                          <th className="p-3 text-right">Marks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        <tr>
                          <td className="p-3 font-semibold text-white">🎨 Creativity & Originality</td>
                          <td className="p-3 text-right font-mono font-bold text-cyan-400">25</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">💬 Prompt Quality</td>
                          <td className="p-3 text-right font-mono font-bold text-cyan-400">25</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">🎯 Relevance to Theme</td>
                          <td className="p-3 text-right font-mono font-bold text-cyan-400">25</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">🖼️ Visual Quality</td>
                          <td className="p-3 text-right font-mono font-bold text-cyan-400">25</td>
                        </tr>
                        <tr className="bg-slate-900/90 font-bold">
                          <td className="p-3 text-white">Total</td>
                          <td className="p-3 text-right font-mono text-amber-400 text-sm">100</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* START TIMER BUTTON ACTION */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Edit Registration Details
                  </button>

                  <button
                    type="button"
                    onClick={handleStartTimer}
                    disabled={isStarting}
                    className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:opacity-95 text-black font-extrabold text-sm tracking-wider shadow-xl shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
                  >
                    {isStarting ? (
                      <span>Initializing Event Session...</span>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-black text-black" />
                        <span>START COMPETITION (START 30-MIN TIMER)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: AI IMAGE SUBMISSION INTERFACE (TIMER ACTIVE) */}
            {currentStep === 3 && (
              <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-8">
                <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/30">
                      Step 3 of 3 — Timer Active
                    </span>
                    <h2 className="text-2xl font-black text-white mt-2 flex items-center space-x-2">
                      <ImageIcon className="w-6 h-6 text-cyan-400" />
                      <span>AI Image Submission</span>
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Participant ID</span>
                    <span className="text-xs font-mono font-bold text-cyan-400">{participantId}</span>
                  </div>
                </div>

                <form onSubmit={handleFinalImageSubmit} className="space-y-8">
                  <fieldset disabled={isExpired || isSubmitting} className="space-y-8">
                    {/* Image Drag & Drop */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-2 flex items-center justify-between">
                        <span className="flex items-center space-x-2">
                          <Upload className="w-4 h-4 text-cyan-400" />
                          <span>Upload Your AI-Generated Image <span className="text-red-400">*</span></span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">Formats: JPG, JPEG, PNG, WEBP</span>
                      </label>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {imagePreview ? (
                        <div className="rounded-2xl border-2 border-cyan-500/40 bg-slate-900/90 p-4">
                          <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="w-full md:w-64 h-64 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
                              <img src={imagePreview} alt="AI Upload Preview" className="w-full h-full object-contain" />
                            </div>

                            <div className="flex-1 space-y-3 w-full">
                              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Image Selected & Preview Ready</span>
                              </div>
                              <p className="text-xs text-slate-300 font-mono truncate max-w-md">File: {imageFile?.name}</p>
                              <p className="text-xs text-slate-400">Size: {(imageFile?.size / (1024 * 1024)).toFixed(2)} MB</p>

                              <div className="pt-2 flex items-center space-x-3">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center space-x-1.5"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Replace Image</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-500/30 text-xs font-bold flex items-center space-x-1.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => !isExpired && fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all ${
                            dragActive ? 'border-cyan-400 bg-cyan-950/20' : errors.image ? 'border-red-500/60 bg-red-950/10' : 'border-slate-800 hover:border-cyan-500/40 bg-slate-900/40'
                          } ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Upload className="w-10 h-10 text-cyan-400 mx-auto mb-3 animate-bounce" />
                          <h3 className="text-base font-bold text-white mb-1">Click to Upload or Drag and Drop Image</h3>
                          <p className="text-xs text-slate-400">Supported formats: JPG, JPEG, PNG, WEBP (Max 15MB)</p>
                        </div>
                      )}
                      {errors.image && <p className="text-xs text-red-400 mt-2 font-medium">{errors.image}</p>}
                    </div>

                    {/* AI Tool Used Field */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-1.5 flex items-center space-x-1.5">
                        <Wrench className="w-4 h-4 text-cyan-400" />
                        <span>AI Tool Used <span className="text-red-400">*</span></span>
                      </label>
                      <select
                        value={aiTool}
                        onChange={(e) => {
                          setAiTool(e.target.value);
                          if (errors.aiTool) setErrors((prev) => ({ ...prev, aiTool: null }));
                        }}
                        className={`w-full px-4 py-3 rounded-xl glass-input text-sm bg-slate-900 ${errors.aiTool ? 'border-red-500' : ''}`}
                      >
                        <option value="">Select AI Image Generator Tool</option>
                        <option value="Midjourney">Midjourney</option>
                        <option value="DALL-E 3 / ChatGPT">DALL-E 3 / ChatGPT</option>
                        <option value="Leonardo AI">Leonardo AI</option>
                        <option value="Stable Diffusion">Stable Diffusion</option>
                        <option value="Bing Image Creator">Bing Image Creator</option>
                        <option value="Adobe Firefly">Adobe Firefly</option>
                        <option value="Canva AI">Canva AI</option>
                        <option value="Other">Other Platform</option>
                      </select>

                      {aiTool === 'Other' && (
                        <input
                          type="text"
                          value={customAiTool}
                          onChange={(e) => setCustomAiTool(e.target.value)}
                          placeholder="Specify the AI platform name..."
                          className="w-full mt-3 px-4 py-3 rounded-xl glass-input text-sm"
                        />
                      )}
                      {errors.aiTool && <p className="text-xs text-red-400 mt-1">{errors.aiTool}</p>}
                    </div>

                    {/* Prompt Textarea */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-1.5 flex items-center space-x-1.5">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span>Enter the Prompt Used to Generate This Image <span className="text-red-400">*</span></span>
                      </label>
                      <textarea
                        rows={4}
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="Paste the exact AI prompt you used..."
                        className={`w-full p-4 rounded-xl glass-input text-sm font-mono ${errors.prompt ? 'border-red-500' : ''}`}
                      />
                      {errors.prompt && <p className="text-xs text-red-400 mt-1">{errors.prompt}</p>}
                    </div>

                    {/* Concept Textarea */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-1 flex items-center space-x-1.5">
                        <HelpCircle className="w-4 h-4 text-cyan-400" />
                        <span>What Does Your Image Represent? <span className="text-red-400">*</span></span>
                      </label>
                      <p className="text-xs text-slate-400 mb-2">Explain the story, concept, or message behind your image.</p>
                      <textarea
                        rows={4}
                        value={conceptText}
                        onChange={(e) => setConceptText(e.target.value)}
                        placeholder="Explain what your image represents..."
                        className={`w-full p-4 rounded-xl glass-input text-sm ${errors.concept ? 'border-red-500' : ''}`}
                      />
                      {errors.concept && <p className="text-xs text-red-400 mt-1">{errors.concept}</p>}
                    </div>
                  </fieldset>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isExpired || isSubmitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:opacity-95 text-black font-extrabold text-sm tracking-wider shadow-xl shadow-cyan-500/25 flex items-center justify-center space-x-2 disabled:opacity-40"
                  >
                    {isSubmitting ? (
                      <span>Submitting Image...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-black" />
                        <span>SUBMIT IMAGE</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
