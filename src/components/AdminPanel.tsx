import { AlertTriangle, BarChart3, TrendingUp, Users, ShieldAlert, CheckCircle2, XCircle, Trash2, Award, RefreshCcw, DollarSign, Calendar, Sparkles, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { Job, SystemAnalytics } from "../types";

interface AdminPanelProps {
  onRefreshData: () => void;
  jobs: Job[];
}

export default function AdminPanel({
  onRefreshData,
  jobs,
}: AdminPanelProps) {
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [adminJobs, setAdminJobs] = useState<Job[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'moderate'>('overview');
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchAnalyticsAndJobs = async () => {
    try {
      const aResp = await fetch("/api/admin/analytics");
      const aData = await aResp.json();
      setAnalytics(aData);

      const jResp = await fetch("/api/admin/jobs");
      const jData = await jResp.json();
      setAdminJobs(jData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnalyticsAndJobs();
  }, [jobs]);

  // Update job status manually on admin command
  const updateJobParams = async (jobId: string, updates: { status?: 'active' | 'expired' | 'pending'; isFeatured?: boolean }) => {
    setMsg("");
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setMsg("Information updated successfully on admin module override.");
        fetchAnalyticsAndJobs();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reseed local system
  const triggerDbReset = async () => {
    if (!confirm("Are you sure you want to restore default All India seeds? This clears any new records.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/db/reset", { method: "POST" });
      if (res.ok) {
        setMsg("Local structural dataset aligned successfully.");
        fetchAnalyticsAndJobs();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in" id="admin-panel">
      
      {/* Alert Header Banner */}
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-start space-x-3.5 shadow-2xs">
        <ShieldAlert className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
        <div className="space-y-1">
          <p className="font-bold text-sm">ADMINISTRATOR INTERMEDIARY PRIVILEGES</p>
          <p className="text-xs text-red-700 leading-relaxed font-semibold">
            You are viewing the developer admin panel of MeeJobs. Moderate listings, audit Razorpay revenue, promote posts to featured directly, or reseed dataset variables.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4 border-b border-slate-200 pb-2">
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`pb-2 text-xs sm:text-sm font-bold tracking-wider cursor-pointer border-b-2 px-1 ${
              activeSubTab === 'overview' ? "border-red-600 text-red-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            System Metrics Overview
          </button>
          <button
            onClick={() => setActiveSubTab('moderate')}
            className={`pb-2 text-xs sm:text-sm font-bold tracking-wider cursor-pointer border-b-2 px-1 ${
              activeSubTab === 'moderate' ? "border-red-600 text-red-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Moderate Listings Approved ({adminJobs.length})
          </button>
        </div>

        {/* Database Reseeder Button */}
        <button
          onClick={triggerDbReset}
          disabled={loading}
          className="bg-red-600 hover:bg-slate-900 text-white font-bold text-[10px] tracking-wider uppercase px-4 py-2.5 rounded-xl transition flex items-center space-x-1 cursor-pointer"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Aligning..." : "Reseed Database"}</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold text-center">{msg}</div>
      )}

      {/* OVERVIEW CONTENT */}
      {activeSubTab === 'overview' && analytics && (
        <div className="space-y-8">
          
          {/* Key metric numbers bento */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white border rounded-2xl p-5 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Job Seekers</span>
              <span className="text-2xl font-extrabold text-slate-900 block font-display mt-1">{analytics.totalSeekers}</span>
            </div>
            <div className="bg-white border rounded-2xl p-5 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Stores/Stalls</span>
              <span className="text-2xl font-extrabold text-slate-900 block font-display mt-1">{analytics.totalEmployers}</span>
            </div>
            <div className="bg-white border rounded-2xl p-5 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Active Jobs</span>
              <span className="text-2xl font-extrabold text-slate-900 block font-display mt-1 text-emerald-600">{analytics.activeJobs}</span>
            </div>
            <div className="bg-white border rounded-2xl p-5 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Featured Spikes</span>
              <span className="text-2xl font-extrabold text-slate-900 block font-display mt-1 text-amber-500">{analytics.featuredJobs}</span>
            </div>
            <div className="bg-white border rounded-2xl p-5 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Submissions</span>
              <span className="text-2xl font-extrabold text-slate-900 block font-display mt-1">{analytics.totalApplications}</span>
            </div>
            <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 text-center bg-emerald-50/10">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block font-mono">Razorpay Collections</span>
              <span className="text-2xl font-black text-emerald-800 block font-display mt-1">₹{analytics.totalRevenue}</span>
            </div>
          </div>

          {/* Revenue distribution chart breakdown representation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">System Revenue Streams (Simulated Logs)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-[10px] text-slate-400 uppercase font-mono">Single Post Listing Plan (₹199)</p>
                <p className="text-lg font-bold text-indigo-700 mt-1">₹597 Collected</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: "20%" }}></div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-[10px] text-slate-400 uppercase font-mono">Featured Listings Upgrade (₹499)</p>
                <p className="text-lg font-bold text-amber-600 mt-1">₹4,990 Collected</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-[10px] text-slate-400 uppercase font-mono">Agency Unlimited Subscription (₹999)</p>
                <p className="text-lg font-bold text-emerald-700 mt-1">₹9,990 Collected</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: "80%" }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* APPROVAL / MODERATION MATRIX */}
      {activeSubTab === 'moderate' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-display font-medium text-slate-800 text-sm rounded-md">District Listings Moderation Console</h3>
          </div>
          
          <div className="divide-y divide-slate-100">
            {adminJobs.map(job => (
              <div key={job.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start space-x-3.5 pr-20">
                  <img
                    src={job.companyLogo}
                    alt={job.companyName}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                  />
                  <div className="space-y-1">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm font-semibold uppercase">
                      {job.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{job.title}</h4>
                    <p className="text-xs text-slate-500 font-semibold">{job.companyName} ({job.location})</p>
                    
                    <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400 pt-1">
                      <span>Salary period: ₹{job.salaryMin} - ₹{job.salaryMax} ({job.salaryPeriod})</span>
                    </div>
                  </div>
                </div>

                {/* Moderation actions toggling */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Featured Status Toggle */}
                  <button
                    onClick={() => updateJobParams(job.id, { isFeatured: !job.isFeatured })}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                      job.isFeatured
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${job.isFeatured ? "fill-amber-500 text-amber-600" : ""}`} />
                    <span>{job.isFeatured ? "Featured Partner" : "Make Featured"}</span>
                  </button>

                  {/* Approve / Suspend */}
                  {job.status === "active" ? (
                    <button
                      onClick={() => updateJobParams(job.id, { status: "expired" })}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-red-600 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Suspend</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => updateJobParams(job.id, { status: "active" })}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 border border-emerald-100 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Live</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
