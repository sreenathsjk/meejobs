import React, { useState, useEffect } from "react";
import { Search, MapPin, Phone, MessageSquare, Bookmark, Share2, Clipboard, Volume2, Globe, Sparkles, Check, ArrowLeft, Loader2, Award, Info } from "lucide-react";
import { Job, JobCategory, User } from "../types";

interface JobsViewProps {
  jobs: Job[];
  initialFilters: { query: string; location: string; category: string; coords?: { latitude: number; longitude: number } | null };
  currentUser: User | null;
  onApply: (jobId: string, coverLetter?: string) => Promise<any>;
  onSelectJobId: string | null;
  onCloseDetail: () => void;
  savedJobs: string[];
  onToggleSave: (jobId: string) => void;
}

// Haversine formula to compute distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

const POPULAR_INDIAN_CITIES = [
  "All India",
  "Bengaluru, Karnataka",
  "Mumbai, Maharashtra",
  "Delhi NCR",
  "Hyderabad, Telangana",
  "Chennai, Tamil Nadu",
  "Pune, Maharashtra",
  "Kolkata, West Bengal",
  "Ahmedabad, Gujarat",
  "Jaipur, Rajasthan",
  "Anantapur, Andhra Pradesh"
];

export default function JobsView({
  jobs,
  initialFilters,
  currentUser,
  onApply,
  onSelectJobId,
  onCloseDetail,
  savedJobs,
  onToggleSave,
}: JobsViewProps) {
  // Filter states
  const [query, setQuery] = useState(initialFilters.query);
  const [location, setLocation] = useState(initialFilters.location);
  const [category, setCategory] = useState(initialFilters.category);
  const [salaryMin, setSalaryMin] = useState<number>(0);
  const [jobType, setJobType] = useState<string>("All");
  
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(initialFilters.coords || null);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState("");
  const [showLocDropdown, setShowLocDropdown] = useState(false);

  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Application process state
  const [coverLetter, setCoverLetter] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [applyError, setApplyError] = useState("");

  // AI Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<string>("");

  // Sharing feedback state
  const [shareSuccess, setShareSuccess] = useState(false);

  // Sync state filters (e.g. if arriving from Landing page search)
  useEffect(() => {
    setQuery(initialFilters.query);
    setLocation(initialFilters.location);
    setCategory(initialFilters.category);
    if (initialFilters.coords !== undefined) {
      setUserCoords(initialFilters.coords);
    }
  }, [initialFilters]);

  // Handle client-side filtering (refreshes immediately based on inputs)
  useEffect(() => {
    let result = [...jobs];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.description.toLowerCase().includes(q) || 
        j.companyName.toLowerCase().includes(q)
      );
    }

    if (location && location !== "All") {
      if (location !== "Near Me") {
        const loc = location.toLowerCase();
        result = result.filter(j => j.location.toLowerCase().includes(loc));
      }
    }

    if (category && category !== "All") {
      result = result.filter(j => j.category === category);
    }

    if (salaryMin > 0) {
      result = result.filter(j => j.salaryMax >= salaryMin);
    }

    if (jobType && jobType !== "All") {
      result = result.filter(j => j.jobType === jobType);
    }

    // Sort Featured first, unless user selected "Near Me" sorting
    if (location === "Near Me" && userCoords) {
      result.sort((a, b) => {
        const latA = a.latitude || 14.68;
        const lngA = a.longitude || 77.60;
        const latB = b.latitude || 14.68;
        const lngB = b.longitude || 77.60;
        const distA = getDistance(userCoords.latitude, userCoords.longitude, latA, lngA);
        const distB = getDistance(userCoords.latitude, userCoords.longitude, latB, lngB);
        return distA - distB;
      });
    } else {
      result.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    setFilteredJobs(result);

    // Default select first job on desktop if none specified
    if (result.length > 0 && !selectedJob) {
      setSelectedJob(result[0]);
    }
  }, [jobs, query, location, category, salaryMin, jobType, userCoords]);

  // Sync selectedJob directly when user clicks "View Job" from elsewhere
  useEffect(() => {
    if (onSelectJobId) {
      const target = jobs.find(j => j.id === onSelectJobId);
      if (target) {
        setSelectedJob(target);
        setTranslatedDesc(null);  // Reset translation
        setCurrentLang("");
        setAppliedSuccess(false);
        setApplyError("");
        setCoverLetter("");
      }
    }
  }, [onSelectJobId, jobs]);

  const selectJobDetail = (job: Job) => {
    setSelectedJob(job);
    setTranslatedDesc(null);
    setCurrentLang("");
    setAppliedSuccess(false);
    setApplyError("");
    setCoverLetter("");
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setDetectError("Geolocation is not supported by your browser");
      return;
    }
    setDetecting(true);
    setDetectError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserCoords(coords);
        setLocation("Near Me");
        setDetecting(false);
      },
      (error) => {
        console.error("Error setting coordinate search: ", error);
        setDetecting(false);
        const fallbackCoords = { latitude: 14.6819, longitude: 77.6006 };
        setUserCoords(fallbackCoords);
        setLocation("Near Me");
        setDetectError("Fallback mock location activated.");
        setTimeout(() => setDetectError(""), 4000);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Submit Application via current user structure
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    if (!currentUser) {
      setApplyError("You must sign in in order to apply for this job post.");
      return;
    }

    if (currentUser.role !== "seeker") {
      setApplyError("Standard employer or administrator profiles cannot apply to listed posts.");
      return;
    }

    setIsApplying(true);
    setApplyError("");

    try {
      const result = await onApply(selectedJob.id, coverLetter);
      if (result && result.success) {
        setAppliedSuccess(true);
      } else {
        setApplyError(result?.error || "Submit failed. Try again.");
      }
    } catch (err: any) {
      setApplyError(err.message || "Something went wrong.");
    } finally {
      setIsApplying(false);
    }
  };

  // Translate Job Description using Gemini translation helper
  const translateContent = async (lang: string) => {
    if (!selectedJob) return;
    setIsTranslating(true);
    setCurrentLang(lang);
    try {
      const resp = await fetch("/api/ai/transliterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Job Title: ${selectedJob.title}. Job Details: ${selectedJob.description}. Requirements: ${selectedJob.requirements.join(", ")}`,
          targetLanguage: lang
        })
      });
      const data = await resp.json();
      if (data.translatedText) {
        setTranslatedDesc(data.translatedText);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Copy shareable link structure
  const shareJob = (job: Job) => {
    const shareText = `*MeeJobs Post:*\n*${job.title}* at *${job.companyName}*\n📍 Location: ${job.location}\n💰 Salary: ₹${job.salaryMin} - ₹${job.salaryMax} / ${job.salaryPeriod}\n\nApply now or view details here: ${window.location.origin}/jobs?jobId=${job.id}`;
    
    // Copy to clipboard fallback
    navigator.clipboard.writeText(shareText);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  const getPrefilledWhatsAppLink = (job: Job) => {
    const message = encodeURIComponent(
      `Hello ${job.companyName}, I saw your job posting for "${job.title}" on MeeJobs.\n\nIs this position still active? I'd love to chat and share my experience!`
    );
    return `https://wa.me/${job.whatsappNumber}?text=${message}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="meejobs-jobs-view">
      
      {/* Search Filter Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Filter keyword, shop name..."
              className="text-xs sm:text-sm font-semibold text-slate-700 w-full bg-slate-50 rounded-xl pl-9 pr-3 py-3 focus:outline-hidden"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Searchable Indian Localities Combobox */}
          <div className="relative col-span-1" id="location-select-wrap">
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="City (e.g., Bengaluru, Mumbai...)"
                className="text-xs sm:text-sm font-semibold text-slate-700 w-full bg-slate-50 rounded-xl pl-9 pr-10 py-3 focus:outline-hidden"
                value={location === "All" || location === "Near Me" ? "" : location}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocation(val || "All");
                  if (val) {
                    setUserCoords(null);
                  }
                }}
                onFocus={() => setShowLocDropdown(true)}
                onBlur={() => setTimeout(() => setShowLocDropdown(false), 250)}
              />
              <button
                type="button"
                onClick={handleDetectLocation}
                className={`absolute right-2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                  userCoords ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-205 text-slate-400'
                }`}
                title="Detect GPS Near Me"
              >
                {detecting ? (
                  <span className="animate-spin text-xs">⌛</span>
                ) : (
                  <span className="text-[10px] font-bold flex items-center">🎯</span>
                )}
              </button>
            </div>

            {/* Suggestions dropdown list */}
            {showLocDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto py-1 text-left">
                <div 
                  className="px-3 py-2 text-xs font-bold hover:bg-slate-50 cursor-pointer flex items-center space-x-2 text-indigo-600 border-b border-indigo-50"
                  onClick={() => {
                    handleDetectLocation();
                    setShowLocDropdown(false);
                  }}
                >
                  <span>🎯</span>
                  <span>Use My Live Location (GPS / Near Me)</span>
                </div>
                <div 
                  className="px-3 py-1.5 text-xs text-slate-705 hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    setLocation("All");
                    setUserCoords(null);
                  }}
                >
                  All over India
                </div>
                {POPULAR_INDIAN_CITIES.slice(1).map((city) => (
                  <div
                    key={city}
                    className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      setLocation(city);
                      setUserCoords(null);
                    }}
                  >
                    {city}
                  </div>
                ))}
              </div>
            )}
            {detectError && (
              <span className="absolute top-12 left-0 right-0 bg-slate-900 text-white text-[9px] p-1 rounded-sm text-center z-50 animate-pulse">
                {detectError}
              </span>
            )}
          </div>

          {/* Category Select */}
          <div>
            <select
              className="bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 rounded-xl px-3 py-3 w-full focus:outline-hidden cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Job Type Select */}
          <div>
            <select
              className="bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 rounded-xl px-3 py-3 w-full focus:outline-hidden cursor-pointer"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          {/* Action to Clear Filters */}
          <button
            onClick={() => {
              setQuery("");
              setLocation("All");
              setCategory("All");
              setSalaryMin(0);
              setJobType("All");
            }}
            className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl py-3 cursor-pointer transition text-center"
          >
            Clear All Selections
          </button>
        </div>

        {/* Salary filter slider */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-medium text-slate-500">
          <div className="flex items-center space-x-2 w-full sm:max-w-xs">
            <span>Minimum Monthly Goal: <b>₹{salaryMin.toLocaleString()}</b></span>
            <input
              type="range"
              min="0"
              max="30000"
              step="2000"
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
              value={salaryMin}
              onChange={(e) => setSalaryMin(Number(e.target.value))}
            />
          </div>
          <span className="text-slate-400">
            {filteredJobs.length} active matching options retrieved in the district
          </span>
        </div>
      </div>

      {/* Main Grid: Left is listings, Right is sticky details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: LIST OF APPLICABLE JOBS (5 / 12 width) */}
        <div className={`space-y-4 lg:col-span-5 ${selectedJob ? "hidden lg:block animate-fade-in" : "col-span-12"}`}>
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => {
              const isSaved = savedJobs.includes(job.id);
              const isSelected = selectedJob?.id === job.id;
              
              // Geodesic distance representation
              const latJob = job.latitude || 14.68;
              const lngJob = job.longitude || 77.60;
              const distanceKm = userCoords 
                ? getDistance(userCoords.latitude, userCoords.longitude, latJob, lngJob) 
                : null;
              
              return (
                <div
                  key={job.id}
                  onClick={() => selectJobDetail(job)}
                  className={`bg-white rounded-2xl p-5 border cursor-pointer relative group transition duration-200 ${
                    isSelected 
                      ? "border-2 border-indigo-600 bg-indigo-50/20" 
                      : job.isFeatured 
                      ? "border-2 border-amber-200 hover:border-indigo-300" 
                      : "border-slate-200 hover:border-indigo-400"
                  }`}
                >
                  {/* Premium Tag */}
                  {job.isFeatured && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wide flex items-center space-x-0.5 shadow-sm">
                      <Sparkles className="w-2.5 h-2.5 fill-white" />
                      <span>Featured</span>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <img
                      src={job.companyLogo}
                      alt={job.companyName}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                    />
                    <div className="flex-1 min-w-0 pr-6 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase bg-indigo-50 px-1.5 py-0.2 rounded-sm truncate">
                          {job.category}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition truncate">
                        {job.title}
                  </h3>
                      <p className="text-xs font-semibold text-slate-500 truncate">{job.companyName}</p>

                      <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] font-bold text-slate-500">
                        <span className="flex items-center text-slate-400">
                          <MapPin className="w-3 h-3 mr-0.5" />
                          {job.location}
                        </span>
                        {distanceKm !== null && (
                          <span className="bg-indigo-55 text-indigo-700 bg-indigo-50 px-1.5 py-0.3 rounded-sm flex items-center font-bold">
                            🧭 {distanceKm.toFixed(1)} km
                          </span>
                        )}
                        <span className="bg-emerald-50 text-emerald-800 px-1 rounded-xs">
                          ₹{job.salaryMin.toLocaleString()} - ₹{job.salaryMax.toLocaleString()} / {job.salaryPeriod}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bookmark Option */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(job.id);
                    }}
                    className={`absolute bottom-3 right-3 p-1.5 rounded-lg transition ${
                      isSaved ? "text-amber-500 hover:bg-slate-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? "fill-amber-500" : ""}`} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-4">
              <p className="text-sm font-semibold">No job listings found matching your parameters.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setLocation("All");
                  setCategory("All");
                  setSalaryMin(0);
                  setJobType("All");
                }}
                className="text-xs text-indigo-600 font-bold bg-indigo-50 px-4 py-2 rounded-lg"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY DETAIL PANEL (7 / 12 width) */}
        {selectedJob ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-20 overflow-hidden lg:col-span-7 col-span-12">
            
            {/* Header / Brand block */}
            <div className="p-6 border-b border-slate-100 bg-linear-to-b from-slate-50 to-white relative">
              
              {/* Back button for mobile view */}
              <button
                onClick={onCloseDetail}
                className="lg:hidden inline-flex items-center text-slate-500 hover:text-slate-800 text-xs font-bold mb-4 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to listing
              </button>

              <div className="flex justify-between items-start gap-3">
                <div className="flex items-start space-x-4">
                  <img
                    src={selectedJob.companyLogo}
                    alt={selectedJob.companyName}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                  />
                  <div className="space-y-1">
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm font-bold tracking-wider uppercase">
                      {selectedJob.category}
                    </span>
                    <h2 className="text-lg sm:text-xl font-display font-extrabold text-slate-900 leading-tight">
                      {selectedJob.title}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-600">{selectedJob.companyName}</p>
                  </div>
                </div>

                {/* Bookmark Toggle */}
                <button
                  onClick={() => onToggleSave(selectedJob.id)}
                  className={`p-2 rounded-xl transition cursor-pointer border ${
                    savedJobs.includes(selectedJob.id) 
                      ? "border-amber-200 bg-amber-50 text-amber-500" 
                      : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  }`}
                  title="Bookmark job opportunity"
                >
                  <Bookmark className={`w-4 h-4 ${savedJobs.includes(selectedJob.id) ? "fill-amber-500" : ""}`} />
                </button>
              </div>

              {/* General Highlights strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-5 mt-4 border-t border-slate-100">
                <div className="bg-slate-100/50 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Location</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5 mr-0.5 text-slate-500 flex-shrink-0" />
                    {selectedJob.location}
                  </p>
                </div>
                <div className="bg-emerald-50/50 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-emerald-600 uppercase font-semibold">Salary Budget</span>
                  <p className="text-xs font-bold text-emerald-800 mt-0.5 truncate">
                    ₹{selectedJob.salaryMin.toLocaleString()} - ₹{selectedJob.salaryMax.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-100/50 p-2.5 rounded-xl text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Term Period</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {selectedJob.jobType}
                  </p>
                </div>
              </div>
            </div>

            {/* Description & Requirements Box */}
            <div className="p-6 space-y-6 max-h-[450px] overflow-y-auto">
              
              {/* Regional language translator widget */}
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-semibold text-indigo-900">
                  <span className="flex items-center space-x-1">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    <span>Prefer local language? Translate via AI:</span>
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => translateContent("Telugu")}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition uppercase ${
                        currentLang === "Telugu" ? "bg-indigo-600 text-white" : "bg-white text-indigo-700 hover:bg-slate-100"
                      }`}
                    >
                      Telugu (తెలుగు)
                    </button>
                    <button
                      onClick={() => translateContent("Hindi")}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition uppercase ${
                        currentLang === "Hindi" ? "bg-indigo-600 text-white" : "bg-white text-indigo-700 hover:bg-slate-100"
                      }`}
                    >
                      Hindi (हिंदी)
                    </button>
                    {translatedDesc && (
                      <button
                        onClick={() => {
                          setTranslatedDesc(null);
                          setCurrentLang("");
                        }}
                        className="text-[10px] text-slate-500 hover:underline px-1"
                      >
                        Reset English
                      </button>
                    )}
                  </div>
                </div>

                {isTranslating && (
                  <div className="flex items-center justify-center p-3 text-xs text-indigo-500">
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    <span>Translating descriptive paragraphs dynamically...</span>
                  </div>
                )}
                
                {translatedDesc && (
                  <div className="bg-white p-3.5 rounded-lg border border-indigo-100 text-sm italic text-slate-800 space-y-2 shadow-2xs leading-relaxed font-semibold">
                    <p className="text-slate-900">{translatedDesc}</p>
                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">
                      ★ Gemini Translated Translation
                    </span>
                  </div>
                )}
              </div>

              {/* Main Text details */}
              <div className="space-y-2">
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  Job Description & Roles
                </h3>
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {selectedJob.description}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  Candidate Requirements
                </h3>
                <ul className="space-y-1.5">
                  {selectedJob.requirements.map((req, index) => (
                    <li key={index} className="flex items-start text-xs text-slate-700">
                      <span className="text-emerald-500 mr-2 mt-0.5">✔</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Employer / Contact metadata */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1" /> Contact Metadata & Verification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <span className="bg-white px-2 py-1 rounded-sm">Call/Contact person: <b>Available on Apply</b></span>
                  <span className="bg-white px-2 py-1 rounded-sm flex items-center">
                    <Phone className="w-3 h-3 mr-1 text-slate-400" /> Phone: {selectedJob.contactPhone}
                  </span>
                  <span className="bg-white px-2 py-1 rounded-md sm:col-span-2 text-indigo-600 font-medium">
                    WhatsApp active: +{selectedJob.whatsappNumber}
                  </span>
                </div>
              </div>

              {/* Direct apply modal / form */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Apply for this position
                </h3>

                {appliedSuccess ? (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-center space-y-2">
                    <p className="font-bold text-sm">✓ Application Shared Successfully!</p>
                    <p className="text-xs">Your local profile matches and details have been transmitted directly to {selectedJob.companyName}. You can also ping their HR via WhatsApp below to speed up interviewing!</p>
                  </div>
                ) : (
                  <form onSubmit={handleApplySubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Pitch / Brief Cover Note (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Why are you a good fit for this role? e.g., 'I live nearby SKU SKU, have my own vehicle, and worked as cashier before...'"
                        className="w-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 focus:outline-hidden p-3 rounded-xl lg:bg-slate-50/50"
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                      />
                    </div>

                    {applyError && (
                      <p className="text-red-600 text-xs font-semibold">{applyError}</p>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={isApplying}
                        className="flex-1 bg-indigo-600 hover:bg-slate-900 font-bold text-white text-xs sm:text-sm py-3 px-6 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Computing AI match score...</span>
                          </>
                        ) : (
                          <span>Submit Official Platform Application</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* STICKY CTA FOOTER ACTIONS */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3.5 justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => shareJob(selectedJob)}
                  className="flex items-center space-x-1.5 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-600 hover:text-indigo-600 transition tracking-wide cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{shareSuccess ? "Copied Link!" : "Share Job"}</span>
                </button>
                <a
                  href={`tel:${selectedJob.contactPhone}`}
                  className="flex items-center space-x-1.5 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-600 hover:text-indigo-600 transition tracking-wide"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Call Store</span>
                </a>
              </div>

              {/* Dynamic walk-in / direct whatsapp */}
              <a
                href={getPrefilledWhatsAppLink(selectedJob)}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center space-x-1 shadow-2xs"
              >
                <MessageSquare className="w-4 h-4 fill-white text-emerald-600" />
                <span>Instant Apply via WhatsApp</span>
              </a>
            </div>

          </div>
        ) : (
          <div className="bg-slate-100 rounded-2xl p-16 text-center text-slate-400 border border-slate-200 lg:col-span-7 col-span-12">
            Select an active job post on the left grid to review candidate scores, localized regional translations, and secure HR contact details.
          </div>
        )}

      </div>
    </div>
  );
}
