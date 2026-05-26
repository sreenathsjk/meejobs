import React, { useState, useEffect } from "react";
import { CheckCircle2, Bookmark, ArrowUpRight, Award, Clipboard, User, Phone, MapPin, Sparkles, AlertCircle, Trash2, Code, Mail, Loader2, BookOpen, Briefcase, FileText } from "lucide-react";
import { User as UserType, SeekerProfile, Job, Application } from "../types";

interface SeekerDashboardProps {
  seekerId: string;
  seekerProfile: SeekerProfile | null;
  onRefreshProfile: () => void;
  savedJobs: string[];
  jobs: Job[];
  applications: Application[];
  onToggleSave: (jobId: string) => void;
  onNavigate: (view: string) => void;
  onSelectJob: (jobId: string) => void;
}

export default function SeekerDashboard({
  seekerId,
  seekerProfile,
  onRefreshProfile,
  savedJobs,
  jobs,
  applications,
  onToggleSave,
  onNavigate,
  onSelectJob,
}: SeekerDashboardProps) {
  // Tabs: 'profile' | 'applications' | 'saved'
  const [activeTab, setActiveTab] = useState<'profile' | 'applications' | 'saved'>('profile');

  // Profile fields editing states
  const [name, setName] = useState(seekerProfile?.name || "");
  const [email, setEmail] = useState(seekerProfile?.email || "");
  const [phone, setPhone] = useState(seekerProfile?.phone || "");
  const [location, setLocation] = useState(seekerProfile?.location || "");
  const [skills, setSkills] = useState(seekerProfile?.skills?.join(", ") || "");
  const [experience, setExperience] = useState(seekerProfile?.experience || "");
  const [bio, setBio] = useState(seekerProfile?.bio || "");
  const [education, setEducation] = useState(seekerProfile?.education || "");
  const [resumeText, setResumeText] = useState(seekerProfile?.resumeText || "");
  
  const [editingSkills, setEditingSkills] = useState(seekerProfile?.skills?.join(", ") || "");

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Resume Upload simulation
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(seekerProfile?.resumeFileName || "");

  // Sync state if seekerProfile updates
  useEffect(() => {
    if (seekerProfile) {
      setName(seekerProfile.name);
      setEmail(seekerProfile.email);
      setPhone(seekerProfile.phone);
      setLocation(seekerProfile.location);
      setSkills(seekerProfile.skills?.join(", ") || "");
      setEditingSkills(seekerProfile.skills?.join(", ") || "");
      setExperience(seekerProfile.experience);
      setBio(seekerProfile.bio || "");
      setEducation(seekerProfile.education || "");
      setResumeText(seekerProfile.resumeText || "");
      setUploadedFileName(seekerProfile.resumeFileName || "");
    }
  }, [seekerProfile]);

  // Filters
  const myApplications = applications.filter(a => a.seekerId === seekerId);
  const savedJobListings = jobs.filter(j => savedJobs.includes(j.id));

  // Profile completion meter metrics (20% per component complete)
  const calculateCompletionPercent = (): number => {
    let score = 0;
    if (name && name !== "Job Seeker") score += 20;
    if (skills && skills.length > 0) score += 20;
    if (experience && experience.trim().length > 5) score += 20;
    if (location && location.trim().length > 3) score += 20;
    if (uploadedFileName || resumeText) score += 20;
    return score;
  };

  const currentCompletion = calculateCompletionPercent();

  // Save changes block
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage("");
    try {
      const parsedSkills = editingSkills.split(",").map(s => s.trim()).filter(s => s.length > 0);

      const response = await fetch("/api/profile/seeker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: seekerId,
          name,
          email,
          phone,
          location,
          skills: parsedSkills,
          experience,
          bio,
          education,
          resumeFileName: uploadedFileName,
          resumeText
        })
      });

      if (response.ok) {
        setSaveMessage("Your candidate profile parameters have been updated.");
        onRefreshProfile();
      } else {
        setSaveMessage("Error syncing settings. Please evaluate requirements.");
      }
    } catch (err: any) {
      setSaveMessage(err.message || "Failed.");
    } finally {
      setSaving(false);
    }
  };

  // Drag and drop Simulated Resume parsing
  const handleResumeDropSimulated = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsParsingResume(true);

    // Simulate AI parsing of resume content utilizing mock reader
    setTimeout(() => {
      setIsParsingResume(false);
      // Generate simulated candidate profile details based on name typed or file
      setResumeText(`[Auto-Extracted Resume Details from PDF: ${file.name}]\nPrior field qualifications: ${experience || "None initialized"}. Listed capabilities: Business and Billing Cashier, Computer Operations.`);
      
      // Auto extend skills list with standard local highlights
      const updatedSkills = editingSkills 
        ? editingSkills + ", Computer Basics, Documentation"
        : "Sales Agent, Billing Software, Telugu, Computer Basics";
        
      setEditingSkills(updatedSkills);
    }, 1800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="seeker-dashboard">
      
      {/* Profiler Header card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs relative">
        <div className="flex items-start space-x-4">
          <div className="bg-indigo-100 text-indigo-700 w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl border border-indigo-200">
            {name ? name.charAt(0).toUpperCase() : "S"}
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 tracking-tight leading-none">{name || "Registered Job Seeker"}</h1>
            <p className="text-xs text-slate-500 font-semibold flex items-center">
              <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> +91 {seekerProfile?.phone}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {seekerProfile?.skills.slice(0, 4).map(skill => (
                <span key={skill} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-sm font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Completion percentage indicator */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl w-full md:max-w-xs space-y-1">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-500">Profile Completion %</span>
            <span className="text-indigo-600">{currentCompletion}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-500"
              style={{ width: `${currentCompletion}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {currentCompletion < 100 ? "Complete profile (skills, resume upload) to get 10x more HR calls!" : "Your profile is optimized for employer walk-ins!"}
          </p>
        </div>
      </div>

      {/* Navigation subtab logs */}
      <div className="flex border-b border-slate-200 gap-4 py-1">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 text-xs sm:text-sm font-bold tracking-wide transition cursor-pointer border-b-2 px-1 ${
            activeTab === "profile" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          My Profile Details
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`pb-3 text-xs sm:text-sm font-bold tracking-wide transition cursor-pointer border-b-2 px-1 ${
            activeTab === "applications" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Applied Jobs ({myApplications.length})
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`pb-3 text-xs sm:text-sm font-bold tracking-wide transition cursor-pointer border-b-2 px-1 ${
            activeTab === "saved" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Saved Bookmarks ({savedJobListings.length})
        </button>
      </div>

      {/* Tab grid content */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[400px]">
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <h2 className="text-base font-display font-black text-slate-900">Configure Candidate Parameters</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sravan Kumar"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="sravan.kumar@gmail.com"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Store Locality Area / City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indiranagar, Bengaluru"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Skills Tags (comma-separated)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cashier, Sales executive, computer, Telugu speaking"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={editingSkills}
                  onChange={(e) => setEditingSkills(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Experience (Years/Companies)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh graduate / 1 year at textile cashier center"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Education Details</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Com SKU Graduate"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Professional Summary Bio</label>
              <textarea
                rows={3}
                placeholder="Briefly state who you are, what local role you are seeking, and target business sectors..."
                className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* Simulated Drag & Drop Resume File Uploader */}
            <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-300 text-center space-y-3 relative">
              <label className="block cursor-pointer">
                <FileText className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <span className="text-xs font-bold text-indigo-700 hover:underline">Simulated Upload PDF Resume</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleResumeDropSimulated}
                />
                <p className="text-[10px] text-slate-400 mt-1">PDF file size max 5MB. Parser automatically populates resume details.</p>
              </label>

              {isParsingResume && (
                <div className="absolute inset-x-0 bottom-4 flex items-center justify-center text-xs text-indigo-600 bg-white/85 py-2 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Gemini Simulated parser extracting keywords...</span>
                </div>
              )}

              {uploadedFileName && (
                <div className="bg-emerald-50 text-emerald-800 text-[11px] font-bold p-2 rounded-lg border border-emerald-200 max-w-xs mx-auto">
                  Registered: {uploadedFileName}
                </div>
              )}
            </div>

            {saveMessage && (
              <p className="p-3 bg-indigo-50 text-indigo-800 rounded-xl text-xs font-semibold">{saveMessage}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl text-xs sm:text-sm transition cursor-pointer"
            >
              {saving ? "Optimizing parameters..." : "Lock Profile Modifications"}
            </button>
          </form>
        )}

        {/* TAB 2: MY SUBMITS */}
        {activeTab === "applications" && (
          <div className="space-y-6">
            <h2 className="text-base font-display font-black text-slate-900 font-bold">Applications & Status Tracker</h2>

            {myApplications.length > 0 ? (
              <div className="space-y-4">
                {myApplications.map(app => (
                  <div key={app.id} className="border border-slate-200 rounded-2xl p-5 relative space-y-3 hover:border-indigo-400 transition" id={`app-${app.id}`}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">{app.jobTitle}</h3>
                        <p className="text-xs text-slate-500 font-semibold">{app.companyName}</p>
                      </div>
                      
                      {/* Application local status highlights */}
                      <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full self-start ${
                        app.status === "shortlisted" 
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                          : app.status === "contacted"
                          ? "bg-amber-100 text-amber-800"
                          : app.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {app.status === "shortlisted" 
                          ? "✓ shortlisted" 
                          : app.status === "contacted"
                          ? "📞 contacted"
                          : app.status === "rejected"
                          ? "✕ rejected"
                          : "applied / pending Store HR"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Assessed compatibility score</span>
                        <p className="text-sm font-black text-indigo-700 font-display mt-0.5">{app.aiMatchScore}% Matching</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Gemini recruitment summary</span>
                        <p className="text-slate-600 font-semibold leading-relaxed text-[11px] mt-0.5">{app.aiMatchAnalysis}</p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          const associatedJobId = app.jobId;
                          onSelectJob(associatedJobId);
                          onNavigate("jobs");
                        }}
                        className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-0.5"
                      >
                        <span>View live listing details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 border border-dashed border-slate-300 rounded-2xl">
                You haven't applied for any jobs yet. Browse hundreds of active shops across India to start.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BOOKMARKS */}
        {activeTab === "saved" && (
          <div className="space-y-6">
            <h2 className="text-base font-display font-black text-slate-900 font-bold">Saved Jobs Directory</h2>

            {savedJobListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedJobListings.map(job => (
                  <div key={job.id} className="border border-slate-200 rounded-2xl p-5 relative hover:border-indigo-400 transition space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-sm">
                          {job.category}
                        </span>
                        <h3 className="font-display font-bold text-slate-900 truncate mt-1 text-sm sm:text-base">{job.title}</h3>
                        <p className="text-xs font-semibold text-slate-500">{job.companyName}</p>
                      </div>
                      <button
                        onClick={() => onToggleSave(job.id)}
                        className="text-amber-500 p-1 rounded-sm hover:bg-slate-100"
                        title="Remove bookmark"
                      >
                        <Bookmark className="w-4 h-4 fill-amber-500" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {job.location}
                      </span>
                      <button
                        onClick={() => {
                          onSelectJob(job.id);
                          onNavigate("jobs");
                        }}
                        className="bg-indigo-600 hover:bg-slate-950 text-white font-bold py-1.5 px-3 rounded-lg text-xs tracking-wide transition cursor-pointer"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 border border-dashed border-slate-300 rounded-2xl">
                No bookmarked listings saved. Review job collections and touch the bookmark icon to save for later.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
