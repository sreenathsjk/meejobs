import React, { useState } from "react";
import { Search, MapPin, Sparkles, PhoneCall, TrendingUp, Users, DollarSign, Share2, Award, ArrowUpRight, CheckCircle } from "lucide-react";
import { Job, JobCategory } from "../types";

interface LandingViewProps {
  jobs: Job[];
  onSearch: (filters: { query: string; location: string; category: string; coords?: { latitude: number; longitude: number } | null }) => void;
  onSelectJob: (jobId: string) => void;
  onNavigate: (view: string) => void;
  onOpenAuth: (role?: 'seeker' | 'employer') => void;
}

const POPULAR_CATEGORIES: { name: JobCategory; icon: string; count: number }[] = [
  { name: "Retail & Sales", icon: "🛍️", count: 28 },
  { name: "Delivery & Logistics", icon: "🏍️", count: 41 },
  { name: "Restaurant, Cook & Waiter", icon: "🧑‍🍳", count: 19 },
  { name: "Office Assistant & Admin", icon: "💻", count: 14 },
  { name: "Teaching & Tutoring", icon: "📚", count: 8 },
  { name: "Driver & Logistics", icon: "🚗", count: 15 },
  { name: "Construction, Electrician & Plumber", icon: "⚡", count: 22 },
];

export const POPULAR_INDIAN_CITIES = [
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

export default function LandingView({
  jobs,
  onSearch,
  onSelectJob,
  onNavigate,
  onOpenAuth,
}: LandingViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoc, setSearchLoc] = useState("All");
  const [searchCat, setSearchCat] = useState("All");
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState("");
  const [showLocDropdown, setShowLocDropdown] = useState(false);

  const [referralName, setReferralName] = useState("");
  const [referralPhone, setReferralPhone] = useState("");
  const [referralSent, setReferralSent] = useState(false);

  // Filter 4 featured jobs or newest active jobs
  const featuredJobs = jobs.filter(j => j.isFeatured).slice(0, 4);
  const regularJobs = jobs.filter(j => !j.isFeatured).slice(0, 4);

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
        setSearchLoc("Near Me");
        setDetecting(false);
      },
      (error) => {
        console.error("Error fetching geolocation: ", error);
        setDetecting(false);
        // Fallback mock coordinates near standard active locations to bypass sandboxed iframe restrictions
        const fallbackCoords = { latitude: 14.6819, longitude: 77.6006 };
        setUserCoords(fallbackCoords);
        setSearchLoc("Near Me");
        setDetectError("Fallback mock location activated.");
        setTimeout(() => setDetectError(""), 4000);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query: searchQuery, location: searchLoc, category: searchCat, coords: userCoords });
    onNavigate("jobs");
  };

  const selectCategory = (catName: string) => {
    onSearch({ query: "", location: "All", category: catName, coords: null });
    onNavigate("jobs");
  };

  const handleSendReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralName || !referralPhone) return;
    try {
      const resp = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrerPhone: "Self-Landing", referredPhone: referralPhone })
      });
      if (resp.ok) {
        setReferralSent(true);
        setReferralName("");
        setReferralPhone("");
        setTimeout(() => setReferralSent(false), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-16 pb-24" id="meejobs-landing-view">
      
      {/* 🚀 Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl overflow-hidden py-16 px-6 sm:px-12 shadow-xl mx-4 mt-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-8">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4.5 h-4.5 text-yellow-400" />
            <span>Hyperlocal job matchmaking sorted by real-time distance proximity</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight leading-tight">
            Find Local Jobs in <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-orange-400 to-orange-500">
              Your Locality Instantly
            </span>
          </h1>

          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Directly connect with local sweet shops, retailers, electronics agencies, clinics, and offices near you. 
            No complex CV tests — apply via Single-Click or WhatsApp!
          </p>

          {/* 🔍 Search Widget */}
          <form 
            onSubmit={handleSearchSubmit}
            className="bg-white p-2.5 rounded-2xl shadow-xl text-slate-900 grid grid-cols-1 md:grid-cols-4 gap-2.5 max-w-3xl mx-auto"
            id="hero-search-form"
          >
            {/* Search Input */}
            <div className="flex items-center px-3 border-b md:border-b-0 md:border-r border-slate-100 py-2">
              <Search className="w-5 h-5 text-indigo-500 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Job Title, e.g., Cashier, Driver..."
                className="w-full text-sm font-medium focus:outline-hidden"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Interactive Searchable Indian City Input */}
            <div className="flex flex-col justify-center px-3 border-b md:border-b-0 md:border-r border-slate-100 py-2 relative" id="location-select-wrap">
              <div className="flex items-center w-full">
                <MapPin className="w-5 h-5 text-indigo-500 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="City (e.g., Bengaluru, Mumbai...)"
                  className="w-full text-sm font-semibold text-slate-700 bg-transparent focus:outline-hidden"
                  value={searchLoc === "All" || searchLoc === "Near Me" ? "" : searchLoc}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchLoc(val || "All");
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
                  title="Detect GPS Near Me"
                  className={`flex-shrink-0 p-1.5 rounded-lg transition-colors cursor-pointer ${
                    userCoords ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-400'
                  }`}
                >
                  {detecting ? (
                    <span className="animate-spin text-xs">⌛</span>
                  ) : (
                    <span className="text-xs">🎯</span>
                  )}
                </button>
              </div>

              {/* Autocomplete Dropdown popup */}
              {showLocDropdown && (
                <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto py-1">
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
                    className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      setSearchLoc("All");
                      setUserCoords(null);
                    }}
                  >
                    All over India
                  </div>
                  {POPULAR_INDIAN_CITIES.slice(1).map((city) => (
                    <div
                      key={city}
                      className="px-3 py-1.5 text-xs text-slate-705 hover:bg-slate-50 cursor-pointer text-left"
                      onClick={() => {
                        setSearchLoc(city);
                        setUserCoords(null);
                      }}
                    >
                      {city}
                    </div>
                  ))}
                </div>
              )}

              {detectError && (
                <div className="absolute top-11 left-0 right-0 bg-slate-900 text-white text-[10px] p-1 px-2 rounded-lg text-center z-50 animate-bounce">
                  {detectError}
                </div>
              )}
            </div>

            {/* Category Select */}
            <div className="flex items-center px-3 py-2">
              <select
                className="w-full bg-transparent text-sm font-medium focus:outline-hidden cursor-pointer text-slate-700"
                value={searchCat}
                onChange={(e) => setSearchCat(e.target.value)}
              >
                <option value="All">All Sectors</option>
                {POPULAR_CATEGORIES.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 transition text-white px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 cursor-pointer shadow-md"
            >
              <span>Search Jobs</span>
            </button>
          </form>

          {/* Quick CTA Shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300">
            <span>Or: </span>
            <button 
              onClick={() => onOpenAuth('seeker')}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-full border border-white/10 transition cursor-pointer"
            >
              💼 Register as Job Seeker
            </button>
            <button 
              onClick={() => onOpenAuth('employer')}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition cursor-pointer"
            >
              📢 Post Job for your Shop
            </button>
          </div>
        </div>
      </section>

      {/* 📊 District Economic Indicators Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold text-center mb-8">
          MeeJobs Live Activity Tracker
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-xs">
            <Users className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
            <div className="text-3xl font-extrabold text-slate-900 font-display">1,240+</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Verified Seekers Registered</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-xs">
            <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
            <div className="text-3xl font-extrabold text-slate-900 font-display">160+</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Active Local Employers</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-xs">
            <PhoneCall className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
            <div className="text-3xl font-extrabold text-slate-900 font-display">4,890+</div>
            <div className="text-xs font-medium text-slate-500 mt-1">WhatsApp Interview Leads Sent</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-xs fire-animation">
            <DollarSign className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <div className="text-3xl font-extrabold text-slate-900 font-display">₹15,500</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Avg Store Manager Monthly Pay</div>
          </div>
        </div>
      </section>

      {/* ⭐ PREMIUM / FEATURED listings (Top Priority) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-sm">
              <Award className="w-4 h-4 fill-amber-400 stroke-amber-500" />
              <span>Premium Priority Partners</span>
            </div>
            <h2 className="text-2xl sm:text-3.5xl font-display font-bold text-slate-900 mt-1">
              Active Featured Jobs
            </h2>
          </div>
          <button
            onClick={() => {
              onSearch({ query: "", location: "All", category: "All" });
              onNavigate("jobs");
            }}
            className="text-indigo-600 hover:text-indigo-850 font-semibold text-sm flex items-center space-x-1"
          >
            <span>View all listing databases</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {featuredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredJobs.map((job) => (
              <div 
                key={job.id}
                className="bg-sky-50/50 hover:bg-sky-50 border-2 border-indigo-200 rounded-2xl p-6 transition duration-300 relative overflow-hidden group shadow-xs cursor-pointer"
                onClick={() => onSelectJob(job.id)}
              >
                {/* Featured Badge */}
                <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-extrabold px-3 py-1 pb-1.5 rounded-bl-xl tracking-wider uppercase flex items-center space-x-1 shadow-sm">
                  <Sparkles className="w-3 h-3 fill-white" />
                  <span>Featured Partner</span>
                </div>

                <div className="flex items-start space-x-4">
                  <img
                    src={job.companyLogo}
                    alt={job.companyName}
                    className="w-12 h-12 rounded-xl object-cover border border-indigo-100"
                  />
                  <div className="space-y-1 pr-14">
                    <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                      {job.category}
                    </span>
                    <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition">
                      {job.title}
                    </h3>
                    <p className="text-sm font-semibold text-slate-700">{job.companyName}</p>
                    
                    {/* Location and Salary */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-500">
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {job.location}
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-sm">
                        ₹{job.salaryMin.toLocaleString()} - ₹{job.salaryMax.toLocaleString()} / {job.salaryPeriod}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded-sm">{job.jobType}</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 pt-3">
                      {job.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-10 text-center border border-dashed border-slate-300 text-slate-500">
            No featured posts listed currently. Buy a ₹499 featured slot to spotlight your retail shop at the top!
          </div>
        )}
      </section>

      {/* 💼 Categories Bento Box Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3.5xl font-display font-bold text-slate-900">
            Browse Highly Demanded Local Sectors
          </h2>
          <p className="text-slate-500 text-sm">
            Quickly filter jobs based on local industry categorizations with direct walk-in options
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {POPULAR_CATEGORIES.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => selectCategory(cat.name)}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-2xl p-6 text-left transition duration-200 group cursor-pointer shadow-xs"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition duration-200">{cat.icon}</div>
              <h3 className="font-display font-bold text-slate-900 group-hover:text-indigo-600 text-md truncate">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center">
                <span>Explore roles</span>
                <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition" />
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* 🤝 Local Referral Program Feature */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-8 sm:p-12 text-white grid grid-cols-1 lg:grid-cols-2 gap-8 items-center shadow-lg">
          <div className="space-y-4">
            <span className="bg-indigo-500 text-white rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
              Growth & Integration
            </span>
            <h2 className="text-3xl font-display font-bold tracking-tight">
              Earn ₹50 for every verified business/friend you refer!
            </h2>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Help your local sweet stalls, textile owners, or fellow college students register on MeeJobs. 
              Once they write their profile details & verify through OTP, get instant GPay rewards!
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-xs">
            {referralSent ? (
              <div className="space-y-4 text-center">
                <div className="bg-emerald-500/20 text-emerald-300 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold text-sm">Referral Logged! We will contact you soon.</span>
                </div>
                <button
                  onClick={() => setReferralSent(false)}
                  className="text-xs text-indigo-200 hover:text-white underline"
                >
                  Refer another contact
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendReferral} className="space-y-3">
                <h3 className="text-xs uppercase tracking-widest font-bold text-indigo-200">
                  Refer Friend / Local Shop
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Friend's Name / Stall"
                    className="bg-white/20 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-hidden placeholder:text-white/60"
                    value={referralName}
                    onChange={(e) => setReferralName(e.target.value)}
                  />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit Phone No"
                    pattern="[0-9]{10}"
                    className="bg-white/20 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-hidden placeholder:text-white/60"
                    value={referralPhone}
                    onChange={(e) => setReferralPhone(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg text-xs transition uppercase cursor-pointer"
                >
                  Verify and Refer Now
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 📋 Standard Active Job Openings Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Recent Openings Near You
          </h2>
          <p className="text-xs text-slate-500">
            Updated just now • Direct hiring contracts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regularJobs.length > 0 ? (
            regularJobs.map((job) => (
              <div 
                key={job.id}
                onClick={() => onSelectJob(job.id)}
                className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-5 cursor-pointer transition flex items-start space-x-4 shadow-2xs group"
              >
                <img
                  src={job.companyLogo}
                  alt={job.companyName}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-slate-900 group-hover:text-indigo-600 transition text-sm sm:text-base truncate">
                    {job.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">{job.companyName}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-semibold text-slate-400">
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-0.5" />
                      {job.location}
                    </span>
                    <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-sm">
                      ₹{job.salaryMin.toLocaleString()} - ₹{job.salaryMax.toLocaleString()} / {job.salaryPeriod}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center text-xs text-slate-500 bg-slate-100 p-8 rounded-xl border border-slate-200">
              No recent jobs listed. Be the first shop in your area to start! Only takes 2 minutes.
            </div>
          )}
        </div>
      </section>

      {/* 📈 Monetization Value Information */}
      <section className="bg-slate-100/10 border-t border-b border-slate-200 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Simple, transparent, monetizable plans</span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">Pricing built specifically for local retailers</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Free Starter</h3>
              <div className="text-3xl font-extrabold text-slate-900 font-display my-2">₹0</div>
              <p className="text-xs text-slate-500 mb-4">Great to test local demand</p>
              <ul className="text-xs text-slate-700 text-left space-y-2 border-t border-slate-100 pt-4">
                <li>✓ List up to 3 live job posts</li>
                <li>✓ Direct WhatsApp applications</li>
                <li>✓ Basic Seeker Match report</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-indigo-600 relative overflow-hidden shadow-xs">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black px-3 py-1 uppercase tracking-widest">
                Best Buy
              </div>
              <h3 className="font-bold text-indigo-700 text-sm uppercase tracking-wider">Premium Feature</h3>
              <div className="text-3xl font-extrabold text-slate-900 font-display my-2">₹499</div>
              <p className="text-xs text-slate-500 mb-4">Spotlight your business</p>
              <ul className="text-xs text-slate-700 text-left space-y-2 border-t border-slate-100 pt-4">
                <li className="font-bold text-indigo-600">★ Appears at the absolute top of the system</li>
                <li>✓ 7x more premium applicants</li>
                <li>✓ Full WhatsApp broadcast badge</li>
                <li>✓ AI match scoring unlocked</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Agency Growth</h3>
              <div className="text-3xl font-extrabold text-slate-900 font-display my-2">₹999</div>
              <p className="text-xs text-slate-500 mb-4">Unlimited Monthly Plan</p>
              <ul className="text-xs text-slate-700 text-left space-y-2 border-t border-slate-100 pt-4">
                <li>✓ Infinite listings for 30 days</li>
                <li>✓ Spotlight 3 featured jobs at top</li>
                <li>✓ Automated resume matching</li>
                <li>✓ Phone & Email support logs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 🌐 Local SEO Landing Links Footer block */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200 pt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-slate-500">
          <div>
            <h4 className="font-semibold text-slate-800 uppercase tracking-widest mb-3">Browse Jobs Near You</h4>
            <ul className="space-y-1">
              <li><button onClick={() => selectCategory("Retail & Sales")} className="hover:underline text-left">Cashier & store managers</button></li>
              <li><button onClick={() => selectCategory("Delivery & Logistics")} className="hover:underline text-left">Courier & delivery executives</button></li>
              <li><button onClick={() => selectCategory("Restaurant, Cook & Waiter")} className="hover:underline text-left">Cooks & kitchen helpers</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 uppercase tracking-widest mb-3">Popular Localities</h4>
            <ul className="space-y-1">
              <li><button onClick={() => onSearch({query: "", location: "Kamalanagar", category: "All", coords: null})} className="hover:underline text-left">Kamalanagar Hub</button></li>
              <li><button onClick={() => onSearch({query: "", location: "Bellary Road", category: "All", coords: null})} className="hover:underline text-left">Bellary Road shops</button></li>
              <li><button onClick={() => onSearch({query: "", location: "RTC Bus Stand", category: "All", coords: null})} className="hover:underline text-left">RTC Layout sector</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 uppercase tracking-widest mb-3">Regional Dialects</h4>
            <ul className="space-y-1">
              <li><span className="text-slate-600 block">Telugu Translation: Activated</span></li>
              <li><span className="text-slate-600 block">Hindi/Kannada: Activated</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 uppercase tracking-widest mb-3">MeeJobs Secure</h4>
            <p className="text-[10px] text-slate-400">
              Simulated with secure Sandboxed Razorpay test checkout protocols & automatic regulatory compliance. Built with ❤️ for local Indian businesses.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
