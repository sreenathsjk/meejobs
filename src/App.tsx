import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LandingView from "./components/LandingView";
import JobsView from "./components/JobsView";
import EmployerDashboard from "./components/EmployerDashboard";
import SeekerDashboard from "./components/SeekerDashboard";
import AdminPanel from "./components/AdminPanel";
import AuthModal from "./components/AuthModal";
import { User, Job, Application, EmployerProfile, SeekerProfile } from "./types";
import { Briefcase, AlertTriangle, ShieldCheck } from "lucide-react";

export default function App() {
  // Navigation View Router State: 'landing' | 'jobs' | 'employer-dashboard' | 'seeker-dashboard' | 'admin-panel'
  const [currentView, setCurrentView] = useState<string>("landing");

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [seekerProfile, setSeekerProfile] = useState<SeekerProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // App Master Datasets
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  
  // Filtering & Selected Job Bridge State
  const [searchFilters, setSearchFilters] = useState<{ query: string; location: string; category: string; coords?: { latitude: number; longitude: number } | null }>({ query: "", location: "All", category: "All", coords: null });
  const [onSelectJobId, setOnSelectJobId] = useState<string | null>(null);

  // Loading States
  const [loading, setLoading] = useState(true);

  // Load user session and bookmarks from localStorage on initial render
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("sub_auth_token");
      const storedUser = localStorage.getItem("sub_auth_user");
      
      if (storedToken && storedUser) {
        const userObj = JSON.parse(storedUser);
        setCurrentUser(userObj);
        fetchAssociatedProfile(userObj.id, userObj.role);
      }

      const storedBookmarks = localStorage.getItem("meejobs_saved_jobs");
      if (storedBookmarks) {
        setSavedJobs(JSON.parse(storedBookmarks));
      }
    } catch (err) {
      console.error("Failed to load local storage session details:", err);
    }
  }, []);

  // Sync Jobs listing and applications when mounting/modifying data
  const syncRegistryDetails = async () => {
    try {
      const jobsResp = await fetch("/api/jobs");
      const jobsData = await jobsResp.json();
      setJobs(jobsData);

      const appResp = await fetch("/api/applications");
      const appData = await appResp.json();
      setApplications(appData);
    } catch (err) {
      console.warn("Failed to synchronize job details from API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncRegistryDetails();
  }, [currentUser]);

  // Fetch associated details on user login
  const fetchAssociatedProfile = async (userId: string, role: string) => {
    try {
      const resp = await fetch(`/api/profile/${userId}`);
      if (resp.ok) {
        const data = await resp.json();
        if (role === "employer") {
          setEmployerProfile(data.profile);
        } else if (role === "seeker") {
          setSeekerProfile(data.profile);
        }
      }
    } catch (err) {
      console.error("Error retrieving user profile coordinates:", err);
    }
  };

  // Login SUCCESS callbacks
  const handleLoginSuccess = (token: string, user: any, profile: any) => {
    localStorage.setItem("sub_auth_token", token);
    localStorage.setItem("sub_auth_user", JSON.stringify(user));
    
    setCurrentUser(user);
    if (user.role === "employer") {
      setEmployerProfile(profile);
      setCurrentView("employer-dashboard");
    } else if (user.role === "seeker") {
      setSeekerProfile(profile);
      setCurrentView("seeker-dashboard");
    } else if (user.role === "admin") {
      setCurrentView("admin-panel");
    }
    syncRegistryDetails();
  };

  // Logout Trigger
  const handleLogout = () => {
    localStorage.removeItem("sub_auth_token");
    localStorage.removeItem("sub_auth_user");
    setCurrentUser(null);
    setEmployerProfile(null);
    setSeekerProfile(null);
    setCurrentView("landing");
  };

  // Profile Refresh Action
  const handleRefreshProfile = () => {
    if (currentUser) {
      fetchAssociatedProfile(currentUser.id, currentUser.role);
      syncRegistryDetails();
    }
  };

  // Navigate Controller with scroll alignment
  const handleNavigation = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle Search Trigger from Landing Page
  const handleSearchTrigger = (filters: { query: string; location: string; category: string; coords?: { latitude: number; longitude: number } | null }) => {
    setSearchFilters(filters);
    setOnSelectJobId(null);
  };

  // Job Click Select Bridge Controller
  const handleSelectJobDetail = (jobId: string) => {
    setOnSelectJobId(jobId);
    setSearchFilters({ query: "", location: "All", category: "All", coords: null });
    handleNavigation("jobs");
  };

  // Handle Bookmark Job Save
  const handleToggleSaveJob = (jobId: string) => {
    let updated;
    if (savedJobs.includes(jobId)) {
      updated = savedJobs.filter(id => id !== jobId);
    } else {
      updated = [...savedJobs, jobId];
    }
    setSavedJobs(updated);
    localStorage.setItem("meejobs_saved_jobs", JSON.stringify(updated));
  };

  // Handle New Job Posting Form Submission
  const handlePostJobSubmit = async (jobData: any) => {
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData)
      });
      const data = await res.json();
      if (res.ok) {
        syncRegistryDetails();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to submit listing." };
    }
  };

  // Handle Seeker Application Submission
  const handleApplySubmit = async (jobId: string, coverLetter?: string) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          seekerId: currentUser?.id,
          coverLetter
        })
      });
      const data = await res.json();
      if (res.ok) {
        syncRegistryDetails();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message || "Communication failure." };
    }
  };

  // Handle Employer App Status Upgrades
  const handleUpdateAppStatus = async (appId: string, status: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        syncRegistryDetails();
        return { success: true };
      }
    } catch (err) {
      console.error(err);
    }
    return { success: false };
  };

  // Trigger simulated order razorpay
  const handleTriggerSimPayment = async (planId: string, jobId?: string) => {
    return { success: true };
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="meejobs-applet">
      
      {/* 🧭 NAVIGATION COMPONENT */}
      <Navbar
        currentUser={currentUser}
        onNavigate={handleNavigation}
        currentView={currentView}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* 🚀 MAIN CORE BODY ROUTER */}
      <main className="flex-grow">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="animate-spin border-4 border-indigo-600 border-t-transparent w-10 h-10 rounded-full"></div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Syncing MeeJobs proximity feeds...</p>
          </div>
        ) : (
          <>
            {currentView === "landing" && (
              <LandingView
                jobs={jobs}
                onSearch={handleSearchTrigger}
                onSelectJob={handleSelectJobDetail}
                onNavigate={handleNavigation}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            )}

            {currentView === "jobs" && (
              <JobsView
                jobs={jobs}
                initialFilters={searchFilters}
                currentUser={currentUser}
                onApply={handleApplySubmit}
                onSelectJobId={onSelectJobId}
                onCloseDetail={() => setOnSelectJobId(null)}
                savedJobs={savedJobs}
                onToggleSave={handleToggleSaveJob}
              />
            )}

            {currentView === "employer-dashboard" && currentUser && (
              <EmployerDashboard
                employerId={currentUser.id}
                employerProfile={employerProfile}
                onRefreshProfile={handleRefreshProfile}
                onPostJob={handlePostJobSubmit}
                onUpdateAppStatus={handleUpdateAppStatus}
                onTriggerPayment={handleTriggerSimPayment}
                jobs={jobs}
                applications={applications}
              />
            )}

            {currentView === "seeker-dashboard" && currentUser && (
              <SeekerDashboard
                seekerId={currentUser.id}
                seekerProfile={seekerProfile}
                onRefreshProfile={handleRefreshProfile}
                savedJobs={savedJobs}
                jobs={jobs}
                applications={applications}
                onToggleSave={handleToggleSaveJob}
                onNavigate={handleNavigation}
                onSelectJob={handleSelectJobDetail}
              />
            )}

            {currentView === "admin-panel" && currentUser && currentUser.role === "admin" && (
              <AdminPanel
                onRefreshData={syncRegistryDetails}
                jobs={jobs}
              />
            )}
          </>
        )}
      </main>

      {/* FOOTER STRIP */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-300">MeeJobs</span>
          </div>
          <p className="text-center font-mono text-[10px]">
            © {new Date().getFullYear()} MeeJobs Platform Inc. • Hyperlocal employment matchmaking sorting by user distance metrics.
          </p>
          <div className="flex space-x-4 font-semibold">
            <button onClick={() => {
              // Direct login shortcut for easy administrative checking
              setCurrentUser({ id: "u-admin", phone: "9999999999", role: "admin", createdAt: new Date().toISOString() });
              setCurrentView("admin-panel");
            }} className="hover:text-white cursor-pointer hover:underline text-[10px]">
              Admin Entrance Bypass
            </button>
          </div>
        </div>
      </footer>

      {/* AUTHENTICATION SYSTEM OVERLAY MODAL */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

    </div>
  );
}
