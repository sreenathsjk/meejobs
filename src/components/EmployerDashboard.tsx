import React, { useState, useEffect } from "react";
import { PlusSquare, Sparkles, AlertCircle, ShoppingBag, Users, Phone, Zap, Star, Shield, ArrowUpRight, MessageSquare, MapPin, DollarSign, Calendar, Edit, Building, CheckCircle2, UserCheck, Loader2, Check } from "lucide-react";
import { Job, JobCategory, Application, EmployerProfile } from "../types";

interface EmployerDashboardProps {
  employerId: string;
  employerProfile: EmployerProfile | null;
  onRefreshProfile: () => void;
  onPostJob: (jobData: any) => Promise<any>;
  onUpdateAppStatus: (appId: string, status: string) => Promise<any>;
  onTriggerPayment: (planId: string, jobId?: string) => Promise<any>;
  jobs: Job[];
  applications: Application[];
}

const CATEGORIES: JobCategory[] = [
  'Retail & Sales',
  'Delivery & Logistics',
  'Restaurant, Cook & Waiter',
  'Office Assistant & Admin',
  'Teaching & Tutoring',
  'Driver & Logistics',
  'Construction, Electrician & Plumber',
  'Technical, IT & Customer Support',
  'Security Guard & Helper',
  'Tailoring & Household Help'
];

export default function EmployerDashboard({
  employerId,
  employerProfile,
  onRefreshProfile,
  onPostJob,
  onUpdateAppStatus,
  onTriggerPayment,
  jobs,
  applications,
}: EmployerDashboardProps) {
  // Tabs: 'listings' | 'applicants' | 'post' | 'pricing' | 'profile'
  const [activeTab, setActiveTab] = useState<'listings' | 'applicants' | 'post' | 'pricing' | 'profile'>('listings');

  // Employer Profile Edit states
  const [businessName, setBusinessName] = useState(employerProfile?.businessName || "");
  const [location, setLocation] = useState(employerProfile?.location || "");
  const [contactPerson, setContactPerson] = useState(employerProfile?.contactPerson || "");
  const [contactPhone, setContactPhone] = useState(employerProfile?.contactPhone || "");
  const [whatsappNumber, setWhatsappNumber] = useState(employerProfile?.whatsappNumber || "");
  const [description, setDescription] = useState(employerProfile?.description || "");
  const [website, setWebsite] = useState(employerProfile?.website || "");
  const [logoUrl, setLogoUrl] = useState(employerProfile?.logoUrl || "");
  
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Post Job form states
  const [jobTitle, setJobTitle] = useState("");
  const [jobCategory, setJobCategory] = useState<JobCategory>('Retail & Sales');
  const [jobType, setJobType] = useState<'Full-time' | 'Part-time' | 'Internship' | 'Contract'>('Full-time');
  const [jobSalaryMin, setJobSalaryMin] = useState("12000");
  const [jobSalaryMax, setJobSalaryMax] = useState("18000");
  const [jobSalaryPeriod, setJobSalaryPeriod] = useState<'monthly' | 'daily' | 'hourly'>('monthly');
  const [jobLocation, setJobLocation] = useState(employerProfile?.location || "Bengaluru, Karnataka");
  const [jobDescription, setJobDescription] = useState("");
  const [jobRequirements, setJobRequirements] = useState<string>("");

  const [isAiWriting, setIsAiWriting] = useState(false);
  const [aiDraftPrompt, setAiDraftPrompt] = useState("");
  const [jobPostMessage, setJobPostMessage] = useState({ type: "", text: "" });

  // Filter listings and applications that belong to this employer
  const myJobs = jobs.filter(j => j.employerId === employerId);
  const myJobIds = myJobs.map(j => j.id);
  const myApplications = applications.filter(a => myJobIds.includes(a.jobId));

  // Razorpay custom checkout frame overlay state
  const [checkoutModal, setCheckoutModal] = useState<{ open: boolean; planId: string; amount: number; jobId?: string }>({
    open: false,
    planId: "",
    amount: 0,
    jobId: undefined,
  });
  const [payCardNum, setPayCardNum] = useState("");
  const [payCardExpiry, setPayCardExpiry] = useState("");
  const [payCardCvv, setPayCardCvv] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Sync profile data when prop changes
  useEffect(() => {
    if (employerProfile) {
      setBusinessName(employerProfile.businessName);
      setLocation(employerProfile.location);
      setContactPerson(employerProfile.contactPerson);
      setContactPhone(employerProfile.contactPhone);
      setWhatsappNumber(employerProfile.whatsappNumber || "91" + employerProfile.contactPhone);
      setDescription(employerProfile.description || "");
      setWebsite(employerProfile.website || "");
      setLogoUrl(employerProfile.logoUrl || "");
    }
  }, [employerProfile]);

  // AI assistant to draft pristine job description
  const handleAiWriteJob = async () => {
    if (!jobTitle) {
      alert("Please enter a basic Job Title first, then click AI Assist.");
      return;
    }
    setIsAiWriting(true);
    try {
      const res = await fetch("/api/ai/optimize-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: jobTitle, inputs: aiDraftPrompt })
      });
      const data = await res.json();
      if (data.description) {
        setJobDescription(data.description);
        if (data.requirements && Array.isArray(data.requirements)) {
          setJobRequirements(data.requirements.join("\n"));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiWriting(false);
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage("");
    try {
      const response = await fetch("/api/profile/employer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: employerId,
          businessName,
          location,
          contactPerson,
          contactPhone,
          whatsappNumber,
          description,
          website,
          logoUrl
        })
      });
      if (response.ok) {
        setProfileMessage("Store profile settings consolidated successfully.");
        onRefreshProfile();
      } else {
        setProfileMessage("Error updating. Check inputs.");
      }
    } catch (err: any) {
      setProfileMessage(err.message || "Failed.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Job Submission Setup (deducts posting limit)
  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription || !jobRequirements) {
      setJobPostMessage({ type: "error", text: "Please supply detailed description parameters and requirements." });
      return;
    }

    setJobPostMessage({ type: "", text: "" });

    const reqLines = jobRequirements.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    const jobData = {
      employerId,
      title: jobTitle,
      category: jobCategory,
      description: jobDescription,
      requirements: reqLines,
      salaryMin: Number(jobSalaryMin),
      salaryMax: Number(jobSalaryMax),
      salaryPeriod: jobSalaryPeriod,
      jobType,
      location: jobLocation,
      whatsappNumber,
      contactPhone
    };

    try {
      const result = await onPostJob(jobData);
      if (result && result.success) {
        setJobPostMessage({ type: "success", text: "Congratulations! Your new position is live in the MeeJobs registry." });
        setJobTitle("");
        setJobRequirements("");
        setJobDescription("");
        setAiDraftPrompt("");
        setActiveTab("listings");
        onRefreshProfile();
      } else {
        setJobPostMessage({ type: "error", text: result.error || "Creation error." });
      }
    } catch (err: any) {
      setJobPostMessage({ type: "error", text: err.message || "Something fell apart." });
    }
  };

  // Update Seeker application status (shortlist, reject)
  const handleAppStatusChange = async (appId: string, status: string) => {
    await onUpdateAppStatus(appId, status);
  };

  // Razorpay simulated order trigger
  const triggerSimulatePayment = (planId: string, jobId?: string) => {
    const amount = planId === "single_post" ? 199 : (planId === "single_featured" ? 499 : 999);
    setCheckoutModal({
      open: true,
      planId,
      amount,
      jobId
    });
  };

  // Confirm simulated payment (calls server verification)
  const submitSimulatedRazorpay = async () => {
    setProcessingPayment(true);
    try {
      // Step 1: Create order on server
      const orderRes = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employerId,
          planId: checkoutModal.planId,
          jobId: checkoutModal.jobId
        })
      });
      const order = await orderRes.json();

      // Step 2: Confirm mock verification on server
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employerId,
          planId: checkoutModal.planId,
          jobId: checkoutModal.jobId,
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: "rzp_play_" + Math.random().toString(36).substr(2, 9)
        })
      });

      if (verifyRes.ok) {
        setPaymentDone(true);
        setTimeout(() => {
          setPaymentDone(false);
          setCheckoutModal({ open: false, planId: "", amount: 0, jobId: undefined });
          setPayCardNum("");
          setPayCardExpiry("");
          setPayCardCvv("");
          onRefreshProfile();
          setActiveTab("listings");
        }, 2200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getApplicationWhatsAppLink = (app: Application) => {
    const message = encodeURIComponent(
      `Hello ${app.seekerName}, I reviewed your application on MeeJobs for our open role. Your AI Matching Score was ${app.aiMatchScore}%! Are you available to join for a walk-in chat?`
    );
    return `https://wa.me/${app.seekerPhone.startsWith("91") ? "" : "91"}${app.seekerPhone}?text=${message}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="employer-dashboard">
      
      {/* Overview Card: Welcome & posting slot indicator */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 to-transparent"></div>
        <div className="space-y-2 relative z-10">
          <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Employer Management Console</p>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
            {employerProfile?.businessName || "Your Local Business Stall"}
          </h1>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {employerProfile?.location || "Bengaluru Regional Outlet"}
            </span>
            <span className="bg-white/10 px-2 py-0.5 rounded-full font-bold text-emerald-300">
              Plan: {employerProfile?.activePlan === "unlimited_monthly" ? "₹999 Unlimited Monthly" : "Free Starter Plan"}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-6 relative z-10">
          <div className="text-center sm:text-right">
            <span className="text-xs text-slate-400 font-mono">Job Posts Left</span>
            <p className="text-3xl sm:text-4xl font-extrabold font-display text-amber-400">
              {employerProfile?.activePlan === "unlimited_monthly" ? "∞" : employerProfile?.jobPostsRemaining ?? 3}
            </p>
          </div>
          
          <button
            onClick={() => setActiveTab("post")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
          >
            <PlusSquare className="w-4 h-4" />
            <span>Create New Job Listing</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-4 py-1">
        <button
          onClick={() => setActiveTab("listings")}
          className={`pb-3 text-xs sm:text-sm font-bold tracking-wide transition cursor-pointer border-b-2 px-1 ${
            activeTab === "listings" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          My Store Listings ({myJobs.length})
        </button>
        <button
          onClick={() => setActiveTab("applicants")}
          className={`pb-3 text-xs sm:text-sm font-bold tracking-wide transition cursor-pointer border-b-2 px-1 ${
            activeTab === "applicants" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Candidate Candidates ({myApplications.length})
        </button>
        <button
          onClick={() => setActiveTab("post")}
          className={`pb-3 text-xs sm:text-sm font-bold tracking-wide transition cursor-pointer border-b-2 px-1 ${
            activeTab === "post" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Post Job with AI Support
        </button>
        <button
          onClick={() => setActiveTab("pricing")}
          className={`pb-3 text-xs sm:text-sm font-bold tracking-wide transition cursor-pointer border-b-2 px-1 ${
            activeTab === "pricing" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Upgrade Plans / Razorpay
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 text-xs sm:text-sm font-bold tracking-wide transition cursor-pointer border-b-2 px-1 ${
            activeTab === "profile" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Store Settings
        </button>
      </div>

      {/* TAB CONTENT GRID */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[400px]">
        
        {/* TAB 1: MY STORE LISTINGS */}
        {activeTab === "listings" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <h2 className="text-base font-display font-black text-slate-900">Manage Your Business Job Posts</h2>
              <span>Scroll to modify listings</span>
            </div>

            {myJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myJobs.map(job => (
                  <div key={job.id} className="border border-slate-200 rounded-2xl p-5 relative group space-y-4">
                    {/* Featured / Sponsor Badges */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm font-semibold uppercase font-mono">
                          {job.category}
                        </span>
                        <h3 className="font-display font-bold text-slate-900 group-hover:text-indigo-600 transition text-sm sm:text-base mt-1">
                          {job.title}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-1">
                        {job.isFeatured ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center space-x-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-500 stroke-amber-600" />
                            <span>Featured (Top rank)</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => triggerSimulatePayment("single_featured", job.id)}
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[10px] font-bold px-2.5 py-1 rounded-sm border border-indigo-100 flex items-center space-x-0.5 cursor-pointer"
                          >
                            <Zap className="w-2.5 h-2.5 fill-indigo-600" />
                            <span>Boost: ₹499</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-500">
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 stroke-slate-400" />
                        {job.location}
                      </span>
                      <span>₹{job.salaryMin.toLocaleString()} - ₹{job.salaryMax.toLocaleString()} / {job.salaryPeriod}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">Views Recorded</span>
                        <span className="font-bold text-slate-800">{job.viewsCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">Current Applicants</span>
                        <span className="font-bold text-slate-800 text-indigo-600">{job.applicantsCount || 0}</span>
                      </div>
                    </div>

                    {/* Delete actions */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={async () => {
                          if (confirm("Are you sure you want to take offline this job slot?")) {
                            await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
                            onRefreshProfile();
                          }
                        }}
                        className="text-slate-400 hover:text-red-600 text-xs font-semibold hover:bg-red-50 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        Delete listing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 border border-dashed border-slate-300 rounded-2xl">
                No active listings posted. Click 'Post Job with AI Support' to write your first job draft.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: JOB APPLICANTS */}
        {activeTab === "applicants" && (
          <div className="space-y-6">
            <h2 className="text-base font-display font-black text-slate-900">Applicant Submissions Database</h2>
            
            {myApplications.length > 0 ? (
              <div className="space-y-4">
                {myApplications.map(app => {
                  const correlatedJob = myJobs.find(j => j.id === app.jobId);
                  
                  return (
                    <div key={app.id} className="border border-slate-200 rounded-2xl p-5 space-y-4 relative">
                      
                      {/* Flex layout for applicant name and score */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div>
                          <h3 className="font-display font-bold text-slate-900 text-md">{app.seekerName}</h3>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            Applied for role: <span className="text-indigo-600 font-bold">{correlatedJob?.title || app.jobTitle}</span>
                          </p>
                        </div>
                        
                        {/* Gemini score badge with glowing ring */}
                        <div className="flex items-center bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5 transition">
                          <div className="text-center">
                            <span className="text-[9px] text-indigo-500 uppercase font-bold tracking-wider block">Gemini AI Match</span>
                            <span className="text-lg font-black text-indigo-700 font-display">{app.aiMatchScore}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Cover letter & Qualities tag */}
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 border border-slate-100 text-xs">
                        <p className="font-semibold text-slate-800">Candidate Pitch:</p>
                        <p className="text-slate-700 leading-relaxed italic">"{app.coverLetter || "No cover details specified."}"</p>
                        <div className="pt-2 border-t border-slate-200/50 flex flex-wrap gap-1">
                          <span className="bg-white border text-slate-600 px-2 py-0.5 rounded-sm font-semibold">Experience: {app.seekerExperience}</span>
                          {app.seekerSkills.map(skill => (
                            <span key={skill} className="bg-white border text-slate-500 px-1.5 py-0.5 rounded-sm">{skill}</span>
                          ))}
                        </div>
                      </div>

                      {/* Qualitative Gemini Analysis snippet */}
                      <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-amber-800 flex items-center space-x-1">
                          <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                          <span>Gemini Candidate Evaluation Report:</span>
                        </p>
                        <p className="text-slate-700 text-[11px] leading-relaxed font-semibold">
                          {app.aiMatchAnalysis}
                        </p>
                      </div>

                      {/* Management control actions */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-400 font-medium">Internal Status:</span>
                          <select
                            value={app.status}
                            onChange={(e) => handleAppStatusChange(app.id, e.target.value)}
                            className="bg-slate-100 border border-slate-200 py-1 px-2 rounded-md font-semibold text-slate-700 focus:outline-hidden cursor-pointer text-[11px]"
                          >
                            <option value="applied">Applied / Pending review</option>
                            <option value="shortlisted">✓ Shortlist</option>
                            <option value="contacted">📞 Contacted</option>
                            <option value="rejected">✕ Reject Candidate</option>
                          </select>
                        </div>

                        {/* Direct WhatsApp Call option */}
                        <a
                          href={getApplicationWhatsAppLink(app)}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center space-x-1.5 transition shadow-2xs"
                        >
                          <MessageSquare className="w-4 h-4 fill-white text-emerald-600" />
                          <span>Contact / Interview via WhatsApp</span>
                        </a>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 border border-dashed border-slate-300 rounded-2xl">
                No active applications received for your posted retail roles. Active listings are broadcast to local candidate groups instantly.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: POST JOB */}
        {activeTab === "post" && (
          <form onSubmit={handleJobSubmit} className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-display font-black text-slate-900">Post a New Job Opportunity</h2>
              <p className="text-xs text-slate-500">Provide direct walkthrough or phone parameters below</p>
            </div>

            {/* AI Assistant Drafter Row */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl space-y-3">
              <label className="text-xs font-bold text-indigo-900 flex items-center space-x-1">
                <Sparkles className="w-4 h-4 fill-indigo-400 text-indigo-500" />
                <span>Need help? Write Bullet Points and let Gemini draft your description:</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g., store assistant, Kamalanagar, Bajaj sales cashier experience, SKU graduates preferred..."
                  className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden flex-1 font-semibold text-slate-700"
                  value={aiDraftPrompt}
                  onChange={(e) => setAiDraftPrompt(e.target.value)}
                />
                <button
                  type="button"
                  disabled={isAiWriting}
                  onClick={handleAiWriteJob}
                  className="bg-indigo-600 hover:bg-slate-900 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition flex items-center justify-center space-x-1"
                >
                  {isAiWriting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      <span>Writing...</span>
                    </>
                  ) : (
                    <span>AI Auto-Write</span>
                  )}
                </button>
              </div>
            </div>

            {/* Title & category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Job Position Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Billing Cashier, Cook Assistant"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Industry Category
                </label>
                <select
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50 cursor-pointer"
                  value={jobCategory}
                  onChange={(e) => setJobCategory(e.target.value as JobCategory)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Salary details */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Salary Range (Min - Max INR)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    required
                    placeholder="Min"
                    className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                    value={jobSalaryMin}
                    onChange={(e) => setJobSalaryMin(e.target.value)}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    required
                    placeholder="Max"
                    className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                    value={jobSalaryMax}
                    onChange={(e) => setJobSalaryMax(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Salary Budget Period
                </label>
                <select
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50 cursor-pointer"
                  value={jobSalaryPeriod}
                  onChange={(e) => setJobSalaryPeriod(e.target.value as any)}
                >
                  <option value="monthly">Monthly Salary</option>
                  <option value="daily">Daily Wage</option>
                  <option value="hourly">Hourly Rate</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Job Contract Type
                </label>
                <select
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50 cursor-pointer"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as any)}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
            </div>

            {/* Description and Requirements text fields */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Job Description & Scope
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain store roles, timings, daily scope, reporting detail..."
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50 font-sans"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Candidate Specific Requirements (One per line)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Valid Driver license&#10;Must speak fluid Telugu&#10;Minimum 1 year retail billing experience"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50 font-mono"
                  value={jobRequirements}
                  onChange={(e) => setJobRequirements(e.target.value)}
                />
              </div>
            </div>

            {/* Location & Contact override fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Specific Store Location Layout
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., opposite Metro Station, Indiranagar, Bengaluru"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  WhatsApp Contact Mobile
                </label>
                <input
                  type="text"
                  required
                  placeholder="91XXXXXXXXXX (Include Country Code, e.g., 919876543210)"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                />
              </div>
            </div>

            {jobPostMessage.text && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                jobPostMessage.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700 border"
              }`}>
                {jobPostMessage.text}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-slate-900 transition font-bold py-3.5 px-6 rounded-xl text-xs sm:text-sm text-white uppercase tracking-wider cursor-pointer shadow-xs"
            >
              List Store Job in Directory
            </button>
          </form>
        )}

        {/* TAB 4: PRICING PLANS */}
        {activeTab === "pricing" && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900">Choose Upgrade Package</h2>
              <p className="text-xs text-slate-500">All payment checkouts are processed securely using Razorpay gateway protocols.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Single Post Pack */}
              <div className="border border-slate-200 rounded-3xl p-6 relative flex flex-col justify-between hover:border-indigo-400 transition">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Single Posting</h3>
                  <div className="text-3xl font-black font-display text-slate-900">₹199</div>
                  <p className="text-xs text-slate-500">Perfect to list one extra opening immediately.</p>
                  <ul className="text-xs text-slate-600 space-y-2 pt-4 border-t border-slate-100">
                    <li>✓ 1 extra active listing slot</li>
                    <li>✓ Standard applicants search report</li>
                    <li>✓ GPay/UPI checkout</li>
                  </ul>
                </div>
                <button
                  onClick={() => triggerSimulatePayment("single_post")}
                  className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl transition hover:bg-indigo-600 mt-6 cursor-pointer"
                >
                  Buy Single Post
                </button>
              </div>

              {/* Single Featured Spotlight Pack */}
              <div className="border-2 border-indigo-600 rounded-3xl p-6 relative flex flex-col justify-between bg-indigo-50/10">
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black px-3.5 py-1 uppercase tracking-wide">
                  Most Demanded
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-indigo-700 uppercase text-[10px] tracking-widest">Featured Spotlight</h3>
                  <div className="text-3xl font-black font-display text-slate-900">₹499</div>
                  <p className="text-xs text-slate-500">Upgrade an active listing to the absolute top of the index with a gold highlight badge.</p>
                  <ul className="text-xs text-slate-600 space-y-2 pt-4 border-t border-slate-100">
                    <li className="font-bold text-indigo-700">★ Appears at the top of category feeds</li>
                    <li>✓ Distinctive gold featured spotlight badge</li>
                    <li>✓ 7x higher local response rating</li>
                    <li>✓ Active AI candidate scoring</li>
                  </ul>
                </div>
                <button
                  onClick={() => triggerSimulatePayment("single_featured")}
                  className="w-full bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-xl transition hover:bg-indigo-700 mt-6 cursor-pointer"
                >
                  Feature Active Job
                </button>
              </div>

              {/* Monthly Unlimited Plan */}
              <div className="border border-slate-200 rounded-3xl p-6 relative flex flex-col justify-between hover:border-indigo-400 transition">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-500 uppercase text-[10px] tracking-widest font-mono">Monthly Unlimited</h3>
                  <div className="text-3xl font-black font-display text-slate-900">₹999</div>
                  <p className="text-xs text-slate-500">Infinite hiring capabilities designed for fast-growing agencies & recruiters.</p>
                  <ul className="text-xs text-slate-600 space-y-2 pt-4 border-t border-slate-100">
                    <li>✓ Unlimited job posts for 30 days</li>
                    <li>✓ 3 featured job boost credits included</li>
                    <li>✓ Direct phone/email priority support</li>
                    <li>✓ Unlimited AI writing assist commands</li>
                  </ul>
                </div>
                <button
                  onClick={() => triggerSimulatePayment("unlimited_monthly")}
                  className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl transition hover:bg-indigo-600 mt-6 cursor-pointer"
                >
                  Buy Unlimited Plan
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: STORE SETTINGS */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <h2 className="text-base font-display font-black text-slate-900">Store Profile Configurations</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Business / Shop Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Venkateswara Sweets & Bakery"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Primary Brand Logo URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-X"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Contact Person / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Ramesh Reddy"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Contact Person Mobile No
                </label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  pattern="[0-9]{10}"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Store Locality Area
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indiranagar, Bengaluru"
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Stall / Agency Bio Profile
              </label>
              <textarea
                rows={3}
                placeholder="Briefly state business history, core products, and work cultures..."
                className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl bg-slate-50/50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {profileMessage && (
              <p className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">{profileMessage}</p>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl text-xs sm:text-sm transition cursor-pointer"
            >
              {profileSaving ? "Saving details..." : "Consolidate and Lock Profile Settings"}
            </button>
          </form>
        )}

      </div>

      {/* 💳 COUPLING: OVERLAY CHECKOUT MODAL (RAZORPAY STYLE FRAME) */}
      {checkoutModal.open && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 text-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-800 shadow-2xl animate-scale-up">
            
            {/* Razorpay Top Blue Strip */}
            <div className="bg-indigo-600 p-5 flex justify-between items-center text-white relative">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-extrabold tracking-wide font-mono">MeeJobs Payment secure Gateway</h3>
                  <p className="text-[10px] text-indigo-200 uppercase tracking-widest">Partnered with Razorpay API</p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutModal({ open: false, planId: "", amount: 0, jobId: undefined })}
                className="text-white hover:text-indigo-200 font-bold text-xs bg-black/20 p-1 rounded-md px-2"
              >
                ✕ Close
              </button>
            </div>

            {/* Simulated Checkout Box */}
            <div className="p-6 space-y-4 text-slate-300">
              
              {paymentDone ? (
                <div className="py-8 text-center space-y-4 animate-bounce">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white text-3xl">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-emerald-400 font-bold text-lg">Transaction Succeeded!</h3>
                    <p className="text-xs text-slate-400">Razorpay ID: pay_sim_{Math.random().toString(36).substr(2, 6)}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Checkout Price</span>
                      <span className="text-slate-200 font-bold text-xs uppercase">{checkoutModal.planId.replace("_", " ")}</span>
                    </div>
                    <span className="text-xl font-black font-display text-emerald-400">
                      ₹{checkoutModal.amount}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Provide Billing Card / UPI Details</label>
                    
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Card Number: #### #### #### ####"
                          className="w-full text-xs font-mono bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-200 focus:outline-hidden"
                          value={payCardNum}
                          onChange={(e) => setPayCardNum(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="MM / YY"
                          maxLength={5}
                          className="w-full text-xs font-mono bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-200 focus:outline-hidden"
                          value={payCardExpiry}
                          onChange={(e) => setPayCardExpiry(e.target.value)}
                        />
                        <input
                          type="password"
                          required
                          placeholder="CVV"
                          maxLength={3}
                          className="w-full text-xs font-mono bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-200 focus:outline-hidden"
                          value={payCardCvv}
                          onChange={(e) => setPayCardCvv(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <button
                      type="button"
                      disabled={processingPayment}
                      onClick={submitSimulatedRazorpay}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 text-xs tracking-wider rounded-xl transition flex items-center justify-center space-x-1 uppercase cursor-pointer"
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          <span>Contacting Banks via Razorpay...</span>
                        </>
                      ) : (
                        <span>Simulate GPay / Secure Pay: ₹{checkoutModal.amount}</span>
                      )}
                    </button>
                    <p className="text-[9px] text-slate-500 text-center uppercase tracking-wide">
                      🔒 Secured 256-Bit SSL Razorpay simulated checkout frame
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
