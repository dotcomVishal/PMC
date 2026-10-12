import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Download, 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Archive, 
  FileCheck, 
  X,
  Eye
} from 'lucide-react';
import { auth, loginWithIITMandi, logOut as firebaseLogOut, onAuthStateChanged } from '../firebase';

interface PhotoPreviewData {
  fileId: string;
  fileName: string;
  rollNumber?: string;
  submittedAt?: string;
  fileSize?: number;
}

interface EventItem {
  id: string;
  name: string;
  description: string;
  eventDate: string;
  hasSlides: boolean;
  slidesOriginalName?: string;
  submissionStart: string;
  submissionEnd: string;
  createdAt: string;
}

interface SubmissionFile {
  id: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
}

interface MySubmission {
  id: string;
  rollNumber: string;
  email: string;
  submittedAt: string;
  updatedAt: string;
  files: SubmissionFile[];
}

interface AdminSubmission {
  id: string;
  rollNumber: string;
  email: string;
  name?: string;
  submittedAt: string;
  updatedAt: string;
  files: SubmissionFile[];
}

export default function LearningFest() {
  // Auth state
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('pmc_token'));
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem('pmc_email') || '');
  const [rollNumber, setRollNumber] = useState<string>(() => localStorage.getItem('pmc_roll') || '');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('pmc_is_admin') === 'true');
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // View state
  const [adminView, setAdminView] = useState(false);

  // Events & Submissions
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [mySubmission, setMySubmission] = useState<MySubmission | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Multi-file upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Admin Portal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    eventDate: '',
    submissionStart: '',
    submissionEnd: ''
  });
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Admin submissions list
  const [adminSubmissions, setAdminSubmissions] = useState<AdminSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // In-place photo preview modal state
  const [previewPhoto, setPreviewPhoto] = useState<PhotoPreviewData | null>(null);

  // Helper to store user session
  const saveSession = (token: string, email: string, roll: string, adminStatus: boolean) => {
    localStorage.setItem('pmc_token', token);
    localStorage.setItem('pmc_email', email);
    localStorage.setItem('pmc_roll', roll);
    localStorage.setItem('pmc_is_admin', adminStatus ? 'true' : 'false');
    setAuthToken(token);
    setUserEmail(email);
    setRollNumber(roll);
    setIsAdmin(adminStatus);
  };

  const clearSession = () => {
    localStorage.removeItem('pmc_token');
    localStorage.removeItem('pmc_email');
    localStorage.removeItem('pmc_roll');
    localStorage.removeItem('pmc_is_admin');
    setAuthToken(null);
    setUserEmail('');
    setRollNumber('');
    setIsAdmin(false);
    setAdminView(false);
  };

  // 1. Initial auth verification
  useEffect(() => {
    const initAuth = async () => {
      // Check stored token first
      const storedToken = localStorage.getItem('pmc_token');
      if (storedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUserEmail(data.email);
            setRollNumber(data.rollNumber);
            setIsAdmin(data.isAdmin);
            setAuthLoading(false);
            return;
          } else {
            clearSession();
          }
        } catch {
          // Keep stored credentials or re-verify
        }
      }

      // Check Firebase state if token was absent/expired
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser && fbUser.email) {
          const email = fbUser.email.toLowerCase();
          if (email.endsWith('@students.iitmandi.ac.in') || email.endsWith('@iitmandi.ac.in')) {
            try {
              const token = await fbUser.getIdToken();
              const roll = email.split('@')[0].toUpperCase();
              const adminStatus = email === 'b25339@students.iitmandi.ac.in';
              saveSession(token, email, roll, adminStatus);
            } catch (e) {
              console.error('Firebase token fetch error:', e);
            }
          }
        }
        setAuthLoading(false);
      });

      return () => unsubscribe();
    };

    initAuth();
  }, []);

  // 2. Fetch Events
  const fetchEvents = async () => {
    if (!authToken) return;
    setLoadingEvents(true);
    try {
      const res = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (data.length > 0 && !selectedEventId) {
          setSelectedEventId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchEvents();
    }
  }, [authToken]);

  // 3. Fetch User Submission for Selected Event
  useEffect(() => {
    const fetchMySubmission = async () => {
      if (!authToken || !selectedEventId) return;
      try {
        const res = await fetch(`/api/events/${selectedEventId}/my-submission`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMySubmission(data);
        }
      } catch (e) {
        console.error('Failed to fetch submission:', e);
      }
    };

    fetchMySubmission();
    setSelectedFiles([]);
    setUploadError(null);
    setUploadSuccess(null);
  }, [selectedEventId, authToken]);

  // 4. Fetch Admin Submissions if in Admin View
  useEffect(() => {
    const fetchAdminSubmissions = async () => {
      if (!authToken || !isAdmin || !adminView || !selectedEventId) return;
      setLoadingSubmissions(true);
      try {
        const res = await fetch(`/api/admin/events/${selectedEventId}/submissions`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAdminSubmissions(data);
        }
      } catch (e) {
        console.error('Failed to load admin submissions:', e);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    fetchAdminSubmissions();
  }, [adminView, selectedEventId, authToken, isAdmin]);

  // Handle Google Sign-In with IIT Mandi account
  const handleGoogleLogin = async () => {
    setLoginError(null);
    setAuthLoading(true);
    try {
      const user = await loginWithIITMandi();
      const token = await user.getIdToken();
      const email = (user.email || '').toLowerCase();
      const roll = email.split('@')[0].toUpperCase();
      const adminStatus = email === 'b25339@students.iitmandi.ac.in';
      saveSession(token, email, roll, adminStatus);
    } catch (err: any) {
      if (err.message && err.message.includes('auth/configuration-not-found')) {
        setLoginError('Google Sign-In is not enabled yet in your Firebase Console project (pmc-learning-fest). Go to console.firebase.google.com -> pmc-learning-fest -> Authentication -> Sign-in method and enable Google provider.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User closed popup
      } else {
        setLoginError(err.message || 'Google sign-in failed. Please sign in with your IIT Mandi institute account.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogOut();
    } catch {}
    clearSession();
  };

  // File Handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (!e.target.files) return;

    const filesArray = Array.from(e.target.files);
    const combinedFiles = [...selectedFiles, ...filesArray];
    const totalSize = combinedFiles.reduce((acc, f) => acc + f.size, 0);

    if (totalSize > 50 * 1024 * 1024) {
      setUploadError(`Files exceed 50 MB limit (${(totalSize / (1024 * 1024)).toFixed(2)} MB).`);
    }

    setSelectedFiles(combinedFiles);
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    const totalSize = updated.reduce((acc, f) => acc + f.size, 0);
    if (totalSize <= 50 * 1024 * 1024) {
      setUploadError(null);
    }
  };

  const handleSubmitFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !selectedEventId || selectedFiles.length === 0) return;

    const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
      setUploadError('Total file size exceeds 50 MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await fetch(`/api/events/${selectedEventId}/submissions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed.');
      }

      setUploadSuccess('Submission uploaded successfully.');
      setSelectedFiles([]);

      // Refresh user submission
      const subRes = await fetch(`/api/events/${selectedEventId}/my-submission`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (subRes.ok) {
        setMySubmission(await subRes.json());
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading submission.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSlides = async (eventId: string, originalName?: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/events/${eventId}/slides`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to download slides.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName || 'slides.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert('Could not download slides.');
    }
  };

  // Admin Event Handlers
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !isAdmin) return;

    setCreatingEvent(true);
    setCreateError(null);

    const formData = new FormData();
    formData.append('name', newEvent.name);
    formData.append('description', newEvent.description);
    formData.append('eventDate', newEvent.eventDate);
    formData.append('submissionStart', newEvent.submissionStart);
    formData.append('submissionEnd', newEvent.submissionEnd);
    if (slideFile) {
      formData.append('slide', slideFile);
    }

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Event creation failed.');
      }

      setShowCreateModal(false);
      setNewEvent({
        name: '',
        description: '',
        eventDate: '',
        submissionStart: '',
        submissionEnd: ''
      });
      setSlideFile(null);
      await fetchEvents();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create event.');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Delete this event? Submissions and slides will be erased.')) return;
    if (!authToken || !isAdmin) return;

    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        setSelectedEventId(null);
        await fetchEvents();
      }
    } catch {
      alert('Failed to delete event.');
    }
  };

  const handleDownloadAllZip = async (eventId: string, eventName: string) => {
    if (!authToken || !isAdmin) return;
    try {
      const res = await fetch(`/api/admin/events/${eventId}/download-all`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventName.replace(/[^a-zA-Z0-9_-]/g, '_')}_submissions.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert('Error downloading submissions archive.');
    }
  };

  const isImageFile = (fileName: string, mimeType?: string) => {
    return (mimeType && mimeType.startsWith('image/')) || /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(fileName);
  };

  const handleDownloadFile = async (fileId: string, filename: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/submissions/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert('Error downloading file.');
    }
  };

  // Date and file formatters
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const getSubmissionStatus = (ev?: EventItem) => {
    if (!ev) return { status: 'unknown', label: '', canSubmit: false };
    const now = new Date();
    const start = new Date(ev.submissionStart);
    const end = new Date(ev.submissionEnd);

    if (now < start) {
      return { 
        status: 'upcoming', 
        label: `OPENS ${formatDateTime(ev.submissionStart)}`,
        canSubmit: false 
      };
    }
    if (now > end) {
      return { 
        status: 'closed', 
        label: `CLOSED ${formatDateTime(ev.submissionEnd)}`,
        canSubmit: false 
      };
    }
    return { 
      status: 'open', 
      label: `OPEN UNTIL ${formatDateTime(ev.submissionEnd)}`,
      canSubmit: true 
    };
  };

  // Loading State
  if (authLoading) {
    return (
      <section className="min-h-screen bg-background pt-36 pb-20 px-6 flex items-center justify-center">
        <div className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Loading...
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Sharp, High-Contrast Login (NO AI Slop, NO generic icons)
  // -------------------------------------------------------------
  if (!authToken) {
    return (
      <section className="min-h-screen bg-background pt-36 pb-24 px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-surface border border-white/20 rounded-sm p-8 md:p-12 text-center">
          
          <h1 className="text-4xl md:text-5xl font-display uppercase tracking-widest text-white mb-8">
            LEARNING FEST
          </h1>

          {loginError && (
            <div className="mb-6 p-3 rounded-sm bg-red-950/60 border border-red-500/60 text-red-200 font-mono text-xs text-left">
              {loginError}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-display text-xl uppercase tracking-widest rounded-sm transition-colors font-bold flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>SIGN IN WITH GOOGLE</span>
          </button>

        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Authenticated Learning Fest
  // -------------------------------------------------------------
  return (
    <section className="min-h-screen bg-background pt-28 sm:pt-36 pb-20 px-4 sm:px-8 md:px-12 text-primary">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10 mb-8">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display uppercase tracking-widest text-white">
                LEARNING FEST
              </h1>
              {isAdmin && (
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm bg-white text-black font-mono">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-zinc-400 font-mono text-xs mt-1 truncate max-w-xs sm:max-w-none">
              {rollNumber} &bull; {userEmail}
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap w-full sm:w-auto">
            {isAdmin && (
              <button
                onClick={() => setAdminView(!adminView)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-sm text-xs uppercase tracking-wider font-display text-sm sm:text-base transition-colors border ${
                  adminView 
                    ? 'bg-white text-black border-white font-bold' 
                    : 'bg-transparent text-white border-white/30 hover:border-white'
                }`}
              >
                {adminView ? 'VIEW EVENTS' : 'ADMIN PORTAL'}
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex-1 sm:flex-none px-4 py-2 rounded-sm bg-transparent hover:bg-white/10 border border-white/20 hover:border-white text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors text-center"
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ADMIN PORTAL VIEW */}
        {/* ========================================================= */}
        {adminView && isAdmin ? (
          <div className="space-y-10">
            
            {/* Admin Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 rounded-sm border border-white/10">
              <div>
                <h2 className="text-2xl font-display uppercase tracking-wider text-white">ADMIN PORTAL</h2>
                <p className="text-zinc-400 font-mono text-xs mt-1">Manage events, upload session slides, and download submissions.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-white text-black font-display text-base uppercase tracking-wider hover:bg-zinc-200 transition-colors font-bold"
              >
                <Plus size={16} />
                <span>CREATE EVENT</span>
              </button>
            </div>

            {/* Submissions Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-display uppercase tracking-wider text-white">COMPETITION SUBMISSIONS</h3>
                  <p className="text-zinc-400 font-mono text-xs">Select an event below to inspect submissions by roll number.</p>
                </div>

                {selectedEvent && (
                  <button
                    onClick={() => handleDownloadAllZip(selectedEvent.id, selectedEvent.name)}
                    disabled={adminSubmissions.length === 0}
                    className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-sm bg-white text-black font-display text-sm uppercase tracking-wider font-bold hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Archive size={16} />
                    <span>DOWNLOAD ALL (.ZIP)</span>
                  </button>
                )}
              </div>

              {/* Event selector tabs (wrapped, no horizontal scroll) */}
              <div className="flex flex-wrap gap-2">
                {events.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEventId(ev.id)}
                    className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-sm font-display text-sm sm:text-base uppercase tracking-wider transition-colors border ${
                      selectedEventId === ev.id
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-surface border-white/10 text-zinc-400 hover:text-white hover:border-white/30'
                    }`}
                  >
                    {ev.name}
                  </button>
                ))}
              </div>

              {/* Submissions Table */}
              {loadingSubmissions ? (
                <div className="p-8 text-center font-mono text-xs text-zinc-400 bg-surface rounded-sm border border-white/10">
                  Loading submissions...
                </div>
              ) : adminSubmissions.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-zinc-400 bg-surface rounded-sm border border-white/10">
                  No submissions recorded for this event.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* MOBILE VIEW: Cards for smartphones */}
                  <div className="sm:hidden space-y-3">
                    {adminSubmissions.map(sub => (
                      <div key={sub.id} className="p-4 rounded-sm bg-surface border border-white/10 space-y-2.5 font-mono text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-base font-bold text-white tracking-wider">{sub.rollNumber}</span>
                          <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-sm">
                            {sub.files.length} FILE{sub.files.length !== 1 ? 'S' : ''}
                          </span>
                        </div>
                        
                        {/* Prominent Submission Timestamp */}
                        <div className="flex flex-col gap-0.5 text-zinc-300 text-[11px] bg-background/60 p-2 rounded-sm border border-white/5">
                          <div className="flex items-center gap-1.5 text-white font-medium">
                            <Clock size={12} className="text-zinc-400 flex-shrink-0" />
                            <span>SUBMITTED: {formatDateTime(sub.submittedAt)}</span>
                          </div>
                          {sub.updatedAt && sub.updatedAt !== sub.submittedAt && (
                            <span className="text-[10px] text-zinc-400 pl-4">
                              UPDATED: {formatDateTime(sub.updatedAt)}
                            </span>
                          )}
                        </div>

                        <p className="text-zinc-400 text-[11px] truncate">{sub.email}</p>

                        {/* Files list */}
                        <div className="pt-2 border-t border-white/10 space-y-1.5">
                          {sub.files.map(f => {
                            const isImage = isImageFile(f.originalName, f.mimeType);
                            return (
                              <div key={f.id} className="flex items-center justify-between gap-2 p-2 rounded-sm bg-background border border-white/5">
                                <div className="truncate">
                                  {isImage ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewPhoto({
                                        fileId: f.id,
                                        fileName: f.originalName,
                                        rollNumber: sub.rollNumber,
                                        submittedAt: sub.submittedAt,
                                        fileSize: f.fileSize
                                      })}
                                      className="flex items-center gap-1.5 text-left text-white truncate font-bold group"
                                    >
                                      <Eye size={13} className="text-white flex-shrink-0 group-hover:scale-110 transition-transform" />
                                      <span className="truncate underline decoration-white/30">{f.originalName}</span>
                                    </button>
                                  ) : (
                                    <span className="flex items-center gap-1.5 text-zinc-300 truncate">
                                      <FileText size={13} className="text-zinc-400 flex-shrink-0" />
                                      <span className="truncate">{f.originalName}</span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-zinc-500 text-[10px]">{formatBytes(f.fileSize)}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(f.id, f.originalName)}
                                    className="p-1 text-zinc-400 hover:text-white"
                                    title="Download"
                                  >
                                    <Download size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP / TABLET VIEW: High-contrast Table */}
                  <div className="hidden sm:block overflow-x-auto border border-white/10 rounded-sm bg-surface">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-white/5 border-b border-white/10 text-zinc-400 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4">ROLL NUMBER</th>
                          <th className="py-3 px-4">EMAIL</th>
                          <th className="py-3 px-4">SUBMISSION TIMESTAMP</th>
                          <th className="py-3 px-4">FILES</th>
                          <th className="py-3 px-4 text-right">COUNT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {adminSubmissions.map(sub => (
                          <tr key={sub.id} className="hover:bg-white/[0.02]">
                            <td className="py-3.5 px-4 font-bold text-white text-sm">
                              {sub.rollNumber}
                            </td>
                            <td className="py-3.5 px-4 text-zinc-300">
                              {sub.email}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-white font-medium flex items-center gap-1.5">
                                  <Clock size={12} className="text-zinc-400 flex-shrink-0" />
                                  <span>{formatDateTime(sub.submittedAt)}</span>
                                </span>
                                {sub.updatedAt && sub.updatedAt !== sub.submittedAt && (
                                  <span className="text-[10px] text-zinc-400 pl-4">
                                    Updated: {formatDateTime(sub.updatedAt)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1.5">
                                {sub.files.map(f => {
                                  const isImage = isImageFile(f.originalName, f.mimeType);
                                  return (
                                    <div key={f.id} className="flex items-center gap-2">
                                      {isImage ? (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewPhoto({
                                            fileId: f.id,
                                            fileName: f.originalName,
                                            rollNumber: sub.rollNumber,
                                            submittedAt: sub.submittedAt,
                                            fileSize: f.fileSize
                                          })}
                                          className="text-left text-white hover:underline flex items-center gap-1.5 text-[11px] font-bold group"
                                          title="View photo in place"
                                        >
                                          <Eye size={13} className="text-white group-hover:scale-110 transition-transform" />
                                          <span className="underline decoration-white/30 hover:decoration-white">{f.originalName}</span>
                                          <span className="text-zinc-400 font-normal">({formatBytes(f.fileSize)})</span>
                                        </button>
                                      ) : (
                                        <span className="text-zinc-300 text-[11px] flex items-center gap-1.5">
                                          <FileText size={12} className="text-zinc-400" />
                                          <span>{f.originalName} ({formatBytes(f.fileSize)})</span>
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadFile(f.id, f.originalName)}
                                        className="text-zinc-400 hover:text-white p-0.5 transition-colors"
                                        title="Download file"
                                      >
                                        <Download size={12} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right text-zinc-400">
                              {sub.files.length} file{sub.files.length !== 1 ? 's' : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Manage Events List */}
            <div className="space-y-4">
              <h3 className="text-2xl font-display uppercase tracking-wider text-white">PUBLISHED EVENTS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(ev => (
                  <div key={ev.id} className="bg-surface p-5 rounded-sm border border-white/10 flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-display uppercase tracking-wider text-white">{ev.name}</h4>
                      <p className="text-xs text-zinc-400 font-sans mt-1 line-clamp-2">{ev.description}</p>
                      <div className="mt-3 flex items-center gap-4 font-mono text-[11px] text-zinc-400">
                        <span>DATE: {formatDate(ev.eventDate)}</span>
                        <span>SLIDES: {ev.hasSlides ? 'YES' : 'NO'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* ========================================================= */
          /* REGULAR EVENTS VIEW: Sharp Rectangular Tabs & Details */
          /* ========================================================= */
          <div>
            {loadingEvents ? (
              <div className="p-16 text-center font-mono text-xs text-zinc-400">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="p-16 text-center bg-surface rounded-sm border border-white/10">
                <h3 className="text-3xl font-display uppercase tracking-wider text-white">NO EVENTS YET</h3>
                <p className="text-zinc-400 text-sm mt-2 font-sans">
                  Events will be announced shortly.
                </p>
                {isAdmin && (
                  <button
                    onClick={() => { setAdminView(true); setShowCreateModal(true); }}
                    className="mt-6 px-6 py-2.5 rounded-sm bg-white text-black font-display text-base uppercase tracking-wider font-bold"
                  >
                    CREATE EVENT
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT: Rectangular Tabs for Events (Vertical Stack, No horizontal scroll) */}
                <div className="lg:col-span-4 space-y-3">
                  <h2 className="text-xs uppercase font-mono tracking-widest text-zinc-400 mb-2">
                    EVENTS ({events.length})
                  </h2>
                  <div className="flex flex-col gap-2.5 sm:gap-3">
                    {events.map(ev => {
                      const isSelected = ev.id === selectedEventId;
                      const status = getSubmissionStatus(ev);

                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedEventId(ev.id)}
                          className={`w-full text-left p-4 sm:p-5 rounded-sm border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-surface border-white shadow-[0_0_15px_rgba(255,255,255,0.05)] ring-1 ring-white/20'
                              : 'bg-surface/50 border-white/10 hover:border-white/30 hover:bg-surface'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <h3 className="text-lg sm:text-xl font-display uppercase tracking-wider text-white">
                              {ev.name}
                            </h3>
                            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-sm border whitespace-nowrap flex-shrink-0 ${
                              status.status === 'open' 
                                ? 'bg-white text-black border-white font-bold'
                                : status.status === 'upcoming'
                                ? 'border-white/40 text-white'
                                : 'border-white/10 text-zinc-500'
                            }`}>
                              {status.status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 font-sans line-clamp-2 leading-relaxed mb-3">
                            {ev.description}
                          </p>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                            <Calendar size={13} className="flex-shrink-0" />
                            <span>{formatDate(ev.eventDate)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT: Selected Event Details & Submission Box */}
                <div className="lg:col-span-8 bg-surface border border-white/10 rounded-sm p-5 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
                  {selectedEvent ? (
                    <>
                      {/* Event Header */}
                      <div>
                        <div className="flex items-center gap-2 font-mono text-xs uppercase text-zinc-400 mb-2">
                          <Calendar size={13} />
                          <span>{formatDate(selectedEvent.eventDate)}</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display uppercase tracking-wider text-white break-words">
                          {selectedEvent.name}
                        </h2>
                        <p className="text-zinc-300 text-sm md:text-base mt-4 leading-relaxed font-sans whitespace-pre-line break-words">
                          {selectedEvent.description}
                        </p>
                      </div>

                      {/* Presentation Slides Section */}
                      <div className="pt-6 border-t border-white/10">
                        <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">
                          EVENT SLIDES
                        </h4>
                        {selectedEvent.hasSlides ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-sm bg-background border border-white/10">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <FileText size={20} className="text-white flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-mono text-white truncate">
                                  {selectedEvent.slidesOriginalName || 'Slides.pdf'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownloadSlides(selectedEvent.id, selectedEvent.slidesOriginalName)}
                              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-white text-black font-display text-sm uppercase tracking-wider hover:bg-zinc-200 transition-colors font-bold w-full sm:w-auto flex-shrink-0"
                            >
                              <Download size={14} />
                              <span>DOWNLOAD SLIDES</span>
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs font-mono text-zinc-500">
                            Slides will be uploaded after the session.
                          </p>
                        )}
                      </div>

                      {/* Competition Track & Submissions Section */}
                      <div className="pt-6 border-t border-white/10 space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                          <div>
                            <h3 className="text-xl sm:text-2xl font-display uppercase tracking-wider text-white">
                              COMPETITION SUBMISSION
                            </h3>
                          </div>
                          
                          {(() => {
                            const status = getSubmissionStatus(selectedEvent);
                            return (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-sm bg-background border border-white/10 font-mono text-[11px] sm:text-xs text-zinc-300">
                                <Clock size={13} className="flex-shrink-0" />
                                <span>{status.label}</span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Existing Submission Details */}
                        {mySubmission && (
                          <div className="p-4 sm:p-5 rounded-sm bg-background border border-white/20 space-y-3 font-mono text-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-white/10">
                              <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                                <CheckCircle size={16} className="text-white flex-shrink-0" />
                                <span className="truncate">SUBMISSION RECEIVED &bull; {mySubmission.rollNumber}</span>
                              </div>
                              <span className="text-[11px] text-zinc-400">
                                {formatDateTime(mySubmission.updatedAt || mySubmission.submittedAt)}
                              </span>
                            </div>

                            <div className="space-y-2 pt-1">
                              {mySubmission.files.map(f => {
                                const isImage = isImageFile(f.originalName, f.mimeType);
                                return (
                                  <div key={f.id} className="flex items-center justify-between gap-2 p-2 rounded-sm bg-surface/50 border border-white/5">
                                    <div className="min-w-0 flex-1 truncate">
                                      {isImage ? (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewPhoto({
                                            fileId: f.id,
                                            fileName: f.originalName,
                                            rollNumber: mySubmission.rollNumber,
                                            submittedAt: mySubmission.submittedAt,
                                            fileSize: f.fileSize
                                          })}
                                          className="text-white hover:underline flex items-center gap-2 text-left font-bold truncate group w-full"
                                          title="Click to view photo in place"
                                        >
                                          <Eye size={14} className="text-white flex-shrink-0 group-hover:scale-110 transition-transform" />
                                          <span className="truncate underline decoration-white/40">{f.originalName}</span>
                                        </button>
                                      ) : (
                                        <span className="text-white flex items-center gap-2 truncate">
                                          <FileText size={14} className="text-zinc-400 flex-shrink-0" />
                                          <span className="truncate">{f.originalName}</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 font-mono text-zinc-400 text-[11px]">
                                      <span className="hidden xs:inline text-zinc-500">{formatBytes(f.fileSize)}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadFile(f.id, f.originalName)}
                                        className="p-1.5 text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-sm transition-colors"
                                        title="Download"
                                      >
                                        <Download size={13} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {getSubmissionStatus(selectedEvent).canSubmit && (
                              <p className="text-[11px] text-zinc-400 pt-2 border-t border-white/10">
                                You can upload new files below to update your submission before the deadline.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Upload Form (If submission window is active) */}
                        {getSubmissionStatus(selectedEvent).canSubmit ? (
                          <form onSubmit={handleSubmitFiles} className="space-y-4">
                            <div className="border border-dashed border-white/20 hover:border-white/40 rounded-sm p-8 text-center bg-background/50 transition-colors">
                              <Upload size={28} className="mx-auto text-zinc-400 mb-3" />
                              <label className="cursor-pointer block">
                                <span className="px-4 py-2 rounded-sm bg-white/10 hover:bg-white/20 text-white font-display text-sm uppercase tracking-wider inline-block mb-2 transition-colors">
                                  SELECT FILES
                                </span>
                                <input
                                  type="file"
                                  multiple
                                  onChange={handleFileSelect}
                                  className="hidden"
                                />
                              </label>
                              <p className="text-xs font-mono text-zinc-400">
                                Multiple files allowed. Size limit: <span className="text-white font-bold">50 MB</span>
                              </p>
                            </div>

                            {/* Selected files preview */}
                            {selectedFiles.length > 0 && (
                              <div className="space-y-2 bg-background p-4 rounded-sm border border-white/10 font-mono text-xs">
                                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                                  <span className="text-zinc-400 uppercase">
                                    SELECTED ({selectedFiles.length})
                                  </span>
                                  <span className={
                                    selectedFiles.reduce((a, b) => a + b.size, 0) > 50 * 1024 * 1024
                                      ? 'text-red-400 font-bold'
                                      : 'text-white'
                                  }>
                                    TOTAL: {formatBytes(selectedFiles.reduce((a, b) => a + b.size, 0))} / 50 MB
                                  </span>
                                </div>

                                <div className="max-h-48 overflow-y-auto space-y-1.5 pt-2">
                                  {selectedFiles.map((file, i) => (
                                    <div key={i} className="flex justify-between items-center p-1.5 rounded hover:bg-white/5">
                                      <div className="flex items-center gap-2 truncate pr-2">
                                        <FileCheck size={14} className="text-zinc-400 flex-shrink-0" />
                                        <span className="text-white truncate">{file.name}</span>
                                        <span className="text-zinc-500">({formatBytes(file.size)})</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeFile(i)}
                                        className="text-zinc-400 hover:text-red-400 px-2"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {uploadError && (
                              <div className="p-3 rounded-sm bg-red-950/40 border border-red-500/50 text-red-300 font-mono text-xs flex items-center gap-2">
                                <AlertCircle size={15} className="flex-shrink-0" />
                                <span>{uploadError}</span>
                              </div>
                            )}

                            {uploadSuccess && (
                              <div className="p-3 rounded-sm bg-green-950/40 border border-green-500/50 text-green-300 font-mono text-xs flex items-center gap-2">
                                <CheckCircle size={15} className="flex-shrink-0" />
                                <span>{uploadSuccess}</span>
                              </div>
                            )}

                            <button
                              type="submit"
                              disabled={selectedFiles.length === 0 || uploading || selectedFiles.reduce((a, b) => a + b.size, 0) > 50 * 1024 * 1024}
                              className="w-full py-3.5 rounded-sm bg-white text-black font-display text-lg uppercase tracking-wider hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                            >
                              {uploading ? 'UPLOADING...' : mySubmission ? 'UPDATE SUBMISSION' : 'SUBMIT ENTRY'}
                            </button>
                          </form>
                        ) : (
                          <div className="p-6 rounded-sm bg-background border border-white/10 text-center font-mono text-xs text-zinc-400">
                            {getSubmissionStatus(selectedEvent).status === 'upcoming' 
                              ? 'SUBMISSIONS WILL UNLOCK WHEN WINDOW OPENS.' 
                              : 'SUBMISSION WINDOW HAS ENDED.'}
                          </div>
                        )}

                      </div>
                    </>
                  ) : null}
                </div>

              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* CREATE EVENT MODAL (ADMIN ONLY) */}
        {/* ========================================================= */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="max-w-xl w-full bg-surface border border-white/20 rounded-sm p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <h3 className="text-2xl font-display uppercase tracking-wider text-white">CREATE EVENT</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-zinc-400 hover:text-white text-xl"
                >
                  <X size={20} />
                </button>
              </div>

              {createError && (
                <div className="p-3 rounded-sm bg-red-950/40 border border-red-500/50 text-red-300 font-mono text-xs">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateEvent} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-zinc-400 uppercase mb-1">EVENT NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="Event Name"
                    value={newEvent.name}
                    onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                    className="w-full bg-background border border-white/20 rounded-sm p-3 text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase mb-1">DESCRIPTION</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Description and competition brief..."
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full bg-background border border-white/20 rounded-sm p-3 text-white focus:outline-none focus:border-white font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase mb-1">EVENT DATE</label>
                  <input
                    type="date"
                    required
                    value={newEvent.eventDate}
                    onChange={e => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                    className="w-full bg-background border border-white/20 rounded-sm p-3 text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 uppercase mb-1">SUBMISSION START</label>
                    <input
                      type="datetime-local"
                      required
                      value={newEvent.submissionStart}
                      onChange={e => setNewEvent({ ...newEvent, submissionStart: e.target.value })}
                      className="w-full bg-background border border-white/20 rounded-sm p-3 text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 uppercase mb-1">SUBMISSION END</label>
                    <input
                      type="datetime-local"
                      required
                      value={newEvent.submissionEnd}
                      onChange={e => setNewEvent({ ...newEvent, submissionEnd: e.target.value })}
                      className="w-full bg-background border border-white/20 rounded-sm p-3 text-white focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase mb-1">SLIDES (PDF/PPTX)</label>
                  <input
                    type="file"
                    accept=".pdf,.pptx,.ppt,.odp,.zip"
                    onChange={e => setSlideFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full bg-background border border-white/20 rounded-sm p-2 text-zinc-400 file:mr-4 file:py-1 file:px-3 file:rounded-sm file:border-0 file:bg-white file:text-black file:font-mono file:text-xs"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-sm bg-transparent hover:bg-white/10 text-zinc-400 hover:text-white uppercase font-display text-sm tracking-wider"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={creatingEvent}
                    className="px-5 py-2 rounded-sm bg-white text-black uppercase font-display text-base tracking-wider font-bold hover:bg-zinc-200 disabled:opacity-40"
                  >
                    {creatingEvent ? 'PUBLISHING...' : 'PUBLISH EVENT'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* IN-PLACE PHOTO VIEWER MODAL (LIGHTBOX) */}
        {/* ========================================================= */}
        {previewPhoto && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm"
            onClick={() => setPreviewPhoto(null)}
          >
            <div 
              className="max-w-4xl w-full bg-[#121212] border border-white/20 rounded-sm overflow-hidden flex flex-col max-h-[92vh] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-4 sm:px-6 py-3 border-b border-white/10 bg-surface">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
                  <Eye size={18} className="text-white flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-mono text-white font-bold truncate">
                      {previewPhoto.fileName}
                    </p>
                    {previewPhoto.rollNumber && (
                      <p className="text-[10px] sm:text-[11px] font-mono text-zinc-400 truncate">
                        ROLL: {previewPhoto.rollNumber} {previewPhoto.submittedAt && `• ${formatDateTime(previewPhoto.submittedAt)}`}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-sm hover:bg-white/10 transition-colors flex-shrink-0"
                  title="Close preview"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Photo Display */}
              <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-black min-h-[200px]">
                <img
                  src={`/api/submissions/files/${previewPhoto.fileId}/view?token=${authToken}`}
                  alt={previewPhoto.fileName}
                  className="max-h-[60vh] sm:max-h-[68vh] w-auto max-w-full object-contain mx-auto rounded-sm select-none"
                />
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-3 border-t border-white/10 bg-surface flex justify-between items-center font-mono text-xs gap-3">
                <span className="text-zinc-400 text-[11px] truncate">
                  {previewPhoto.fileSize ? formatBytes(previewPhoto.fileSize) : 'Photo Preview'}
                </span>
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewPhoto.fileId, previewPhoto.fileName)}
                  className="flex items-center justify-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white text-black font-display text-xs sm:text-sm uppercase tracking-wider font-bold rounded-sm hover:bg-zinc-200 transition-colors flex-shrink-0"
                >
                  <Download size={13} />
                  <span>DOWNLOAD</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
