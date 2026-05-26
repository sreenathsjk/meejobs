import { Briefcase, User as UserIcon, LogOut, ShieldAlert, Award, Grid, Menu, X, PlusCircle } from "lucide-react";
import { useState } from "react";
import { User } from "../types";
import MeeJobsLogo from "./MeeJobsLogo";

interface NavbarProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  currentView: string;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export default function Navbar({
  currentUser,
  onNavigate,
  currentView,
  onLogout,
  onOpenAuth,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs" id="meejobs-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate("landing")}
              className="flex items-center cursor-pointer"
              id="brand-logo-btn"
            >
              <MeeJobsLogo className="items-start" darkBg={false} />
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => onNavigate("jobs")}
              className={`text-sm font-medium transition cursor-pointer ${
                currentView === "jobs" ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
              }`}
              id="nav-search-jobs"
            >
              Discover Jobs
            </button>

            {currentUser && currentUser.role === "seeker" && (
              <button
                onClick={() => onNavigate("seeker-dashboard")}
                className={`text-sm font-medium transition cursor-pointer ${
                  currentView === "seeker-dashboard" ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
                }`}
                id="nav-seeker-dash"
              >
                My Profile & Applications
              </button>
            )}

            {currentUser && currentUser.role === "employer" && (
              <button
                onClick={() => onNavigate("employer-dashboard")}
                className={`text-sm font-medium transition cursor-pointer flex items-center space-x-1 ${
                  currentView === "employer-dashboard" ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
                }`}
                id="nav-employer-dash"
              >
                <span>Employer Dashboard</span>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Recruit
                </span>
              </button>
            )}

            {currentUser && currentUser.role === "admin" && (
              <button
                onClick={() => onNavigate("admin-panel")}
                className={`text-sm font-semibold transition cursor-pointer flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-700 rounded-md border border-red-100 uppercase text-[11px] tracking-wider ${
                  currentView === "admin-panel" ? "bg-red-100" : "hover:bg-red-100"
                }`}
                id="nav-admin-panel"
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                Moderation System
              </button>
            )}

            {/* User Session Controller */}
            <div className="border-l border-slate-200 pl-6 flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <div className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center space-x-2 border border-slate-200">
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">
                      {currentUser.role === "admin"
                        ? "Administrator"
                        : currentUser.role === "employer"
                        ? "Employer"
                        : "Job Seeker"}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition list-none cursor-pointer"
                    title="Sign Out"
                    id="nav-logout-btn"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      onOpenAuth();
                    }}
                    className="text-sm font-medium text-slate-600 hover:text-slate-950 cursor-pointer"
                    id="nav-login-btn"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      onOpenAuth();
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition shadow-xs"
                    id="nav-register-btn"
                  >
                    Post a Job Free
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-50 border-t border-slate-200 px-4 pt-2 pb-4 space-y-1">
          <button
            onClick={() => {
              onNavigate("jobs");
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            Discover Jobs
          </button>

          {currentUser && currentUser.role === "seeker" && (
            <button
              onClick={() => {
                onNavigate("seeker-dashboard");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              My Profile & Applications
            </button>
          )}

          {currentUser && currentUser.role === "employer" && (
            <button
              onClick={() => {
                onNavigate("employer-dashboard");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:bg-slate-100"
            >
              Employer Dashboard
            </button>
          )}

          {currentUser && currentUser.role === "admin" && (
            <button
              onClick={() => {
                onNavigate("admin-panel");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 bg-red-50 hover:bg-red-100"
            >
              Moderation Panel
            </button>
          )}

          <div className="border-t border-slate-200 mt-4 pt-4">
            {currentUser ? (
              <div className="space-y-2">
                <div className="px-3 py-2 text-slate-500 text-xs">
                  Signed in as: <span className="font-semibold text-slate-700">{currentUser.phone}</span>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-3">
                <button
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Join / Login
                </button>
                <button
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Post Job Free
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
