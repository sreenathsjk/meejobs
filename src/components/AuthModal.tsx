import React, { useState } from "react";
import { Phone, Check, Mail, ArrowRight, Loader2, Sparkles, KeyRound, HelpCircle, Undo2, Lock } from "lucide-react";
import MeeJobsLogo from "./MeeJobsLogo";

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (token: string, user: any, profile: any) => void;
}

const SECURITY_QUESTIONS = [
  "In which city were you born?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite food or sweet?",
  "What was the brand or name of your first job?"
];

export default function AuthModal({
  onClose,
  onLoginSuccess,
}: AuthModalProps) {
  // Modes: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Forgot password sub-steps: 'phone' | 'answer'
  const [forgotStep, setForgotStep] = useState<'phone' | 'answer'>('phone');
  
  // Input fields state
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<'seeker' | 'employer'>('seeker');
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retrievedQuestion, setRetrievedQuestion] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Tracking the active input field for the helpful touch-keypad appending
  const [activeField, setActiveField] = useState<'phone' | 'password' | 'securityAnswer' | 'newPassword' | 'email'>('phone');

  // Virtual Keypad numbers
  const KEYPAD_NUMS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Back"];

  const handleKeypadPress = (val: string) => {
    setErrorMsg("");
    let currentVal = "";
    let setVal: React.Dispatch<React.SetStateAction<string>> | null = null;
    let maxLength = 35;

    if (activeField === 'phone') {
      currentVal = phone;
      setVal = setPhone;
      maxLength = 10;
    } else if (activeField === 'password') {
      currentVal = password;
      setVal = setPassword;
    } else if (activeField === 'securityAnswer') {
      currentVal = securityAnswer;
      setVal = setSecurityAnswer;
    } else if (activeField === 'newPassword') {
      currentVal = newPassword;
      setVal = setNewPassword;
    } else if (activeField === 'email') {
      currentVal = email;
      setVal = setEmail;
    }

    if (!setVal) return;

    if (val === 'Clear') {
      setVal("");
    } else if (val === 'Back') {
      setVal(currentVal.slice(0, -1));
    } else {
      if (currentVal.length < maxLength) {
        setVal(currentVal + val);
      }
    }
  };

  // Submit Password Registration
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setErrorMsg("Please provide a valid 10-digit Indian phone number.");
      return;
    }
    if (password.length < 4) {
      setErrorMsg("Password should be at least 4 characters long.");
      return;
    }
    if (!securityAnswer.trim()) {
      setErrorMsg("Please provide an answer for your security recovery question.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const resp = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          password,
          selectedRole,
          email,
          securityQuestion,
          securityAnswer: securityAnswer.trim()
        })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setSuccessMsg("Account created successfully!");
        onLoginSuccess(data.token, data.user, data.profile);
        onClose();
      } else {
        setErrorMsg(data.error || "Failed to create account. Please check inputs.");
      }
    } catch (err) {
      setErrorMsg("Failed to communicate with auth server.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Password Sign-In
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setErrorMsg("Both mobile number and password are required.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        onLoginSuccess(data.token, data.user, data.profile);
        onClose();
      } else {
        setErrorMsg(data.error || "Invalid phone number or incorrect password.");
      }
    } catch (err) {
      setErrorMsg("Failed to log in because of server response failure.");
    } finally {
      setLoading(false);
    }
  };

  // Step 1 of Forgotten Pass: Retrieve registered security question
  const handleForgotPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setErrorMsg("Provide your registered 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const resp = await fetch("/api/auth/forgot-password-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setRetrievedQuestion(data.securityQuestion);
        setForgotStep('answer');
        setActiveField('securityAnswer');
      } else {
        setErrorMsg(data.error || "No account found with this phone number.");
      }
    } catch (err) {
      setErrorMsg("Failed to communicate with server.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 of Forgotten Pass: Reset and log in
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityAnswer.trim() || !newPassword) {
      setErrorMsg("All recovery credentials are required.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const resp = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          securityAnswer: securityAnswer.trim(),
          newPassword
        })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setSuccessMsg(data.message);
        
        // Auto sign in user after successful reset
        const loginResp = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password: newPassword })
        });
        const loginData = await loginResp.json();
        if (loginResp.ok && loginData.success) {
          onLoginSuccess(loginData.token, loginData.user, loginData.profile);
          onClose();
        } else {
          // If auto-login fails, send to ordinary login with reset confirmation
          setMode('login');
          setPassword(newPassword);
          setSuccessMsg("Password reset successfully! Please log in with your new password.");
        }
      } else {
        setErrorMsg(data.error || "Security answer did not match. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Password update failure. Please try later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs" id="auth-modal">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 animate-scale-up grid grid-cols-1">
        
        {/* Modal Top Branding banner */}
        <div className="bg-indigo-600 p-5 text-white text-center relative space-y-1">
          <div className="flex justify-center mb-1">
            <MeeJobsLogo darkBg={true} className="items-center" />
          </div>
          <span className="text-[10px] bg-black/20 text-indigo-50 px-3 py-0.5 rounded-full uppercase tracking-widest font-extrabold text-[9px]">
            Hyperlocal Job Exchange
          </span>
          <h2 className="text-xl font-display font-extrabold tracking-tight">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Free Account' : 'Forgotten Password'}
          </h2>
          <p className="text-xs text-indigo-100 px-2 font-medium">
            {mode === 'login' && 'Enter password or reset with secret questions'}
            {mode === 'signup' && 'Fast registration with security backup system'}
            {mode === 'forgot' && 'Answering your question updates password for free'}
          </p>
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 text-white hover:text-indigo-200 font-bold bg-black/25 rounded-md p-1 px-2.5 text-xs cursor-pointer border-0"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-center">
              <p className="text-red-700 text-xs font-semibold">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
              <p className="text-emerald-700 text-xs font-semibold">{successMsg}</p>
            </div>
          )}

          {/* ================= MODE: LOGIN ================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-3">
                
                <div className={`space-y-1 p-0.5 rounded-xl border transition ${activeField === 'phone' ? 'border-indigo-500 bg-indigo-50/10' : 'border-transparent'}`}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs sm:text-sm font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit phone"
                      maxLength={10}
                      onFocus={() => setActiveField('phone')}
                      className="w-full text-xs sm:text-sm font-bold text-slate-700 bg-slate-50 pl-12 pr-3 py-2.5 rounded-lg focus:outline-hidden focus:bg-white border border-slate-100"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>

                <div className={`space-y-1 p-0.5 rounded-xl border transition ${activeField === 'password' ? 'border-indigo-500 bg-indigo-50/10' : 'border-transparent'}`}>
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Your Password
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Demo: 123456</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="Enter entry password"
                      onFocus={() => setActiveField('password')}
                      className="w-full text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 pl-9 pr-3 py-2.5 rounded-lg focus:outline-hidden focus:bg-white border border-slate-100"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

              </div>

              <div className="flex justify-between items-center text-xs px-1 text-indigo-600 font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setForgotStep('phone');
                    setActiveField('phone');
                  }}
                  className="hover:underline cursor-pointer"
                >
                  Forgot Password? (Free Recovery)
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-slate-950 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm transition flex items-center justify-center space-x-2 uppercase tracking-wide cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-slate-400 text-xs">
                  New to MeeJobs?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setActiveField('phone');
                    }}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer ml-1"
                  >
                    Create Free Profile
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ================= MODE: SIGNUP ================= */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div className="space-y-2.5">
                
                {/* Role selection toggle */}
                <div className="space-y-1 block">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Register As
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('seeker')}
                      className={`py-2 px-3 text-[11px] font-bold border rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition ${
                        selectedRole === 'seeker' 
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-extrabold" 
                          : "border-slate-200 text-slate-500 bg-white"
                      }`}
                    >
                      <span>Job Seeker</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('employer')}
                      className={`py-2 px-3 text-[11px] font-bold border rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition ${
                        selectedRole === 'employer' 
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-extrabold" 
                          : "border-slate-200 text-slate-500 bg-white"
                      }`}
                    >
                      <span>Employer</span>
                    </button>
                  </div>
                </div>

                <div className={`space-y-1 p-0.5 rounded-xl border transition ${activeField === 'phone' ? 'border-indigo-500 bg-indigo-50/10' : 'border-transparent'}`}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pl-1">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      onFocus={() => setActiveField('phone')}
                      className="w-full text-xs font-bold text-slate-700 bg-slate-50 pl-11 pr-3 py-2.5 rounded-lg focus:outline-hidden focus:bg-white border border-slate-100"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>

                <div className={`space-y-1 p-0.5 rounded-xl border transition ${activeField === 'password' ? 'border-indigo-500 bg-indigo-50/10' : 'border-transparent'}`}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pl-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="Min 4 characters"
                      onFocus={() => setActiveField('password')}
                      className="w-full text-xs font-bold text-slate-700 bg-slate-50 pl-8.5 pr-3 py-2.5 rounded-lg focus:outline-hidden focus:bg-white border border-slate-100"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pl-1">
                    Select a Secret Question (Used for FREE recovery)
                  </label>
                  <div className="relative">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <select
                      className="w-full text-xs bg-slate-50 pl-8.5 pr-8 py-2.5 rounded-lg text-slate-600 font-semibold border border-slate-100 focus:outline-hidden focus:bg-white cursor-pointer appearance-none"
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                    >
                      {SECURITY_QUESTIONS.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={`space-y-1 p-0.5 rounded-xl border transition ${activeField === 'securityAnswer' ? 'border-indigo-500 bg-indigo-50/10' : 'border-transparent'}`}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pl-1">
                    Your Secret Answer
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Type answer here (keep safe, case-insensitive)"
                    onFocus={() => setActiveField('securityAnswer')}
                    className="w-full text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2.5 rounded-lg focus:outline-hidden focus:bg-white border border-slate-100"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                  />
                </div>

                <div className={`space-y-1 p-0.5 rounded-xl border transition ${activeField === 'email' ? 'border-indigo-500 bg-indigo-50/10' : 'border-transparent'}`}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pl-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      placeholder="e.g. sweets@gmail.com"
                      onFocus={() => setActiveField('email')}
                      className="w-full text-xs bg-slate-50 pl-8.5 pr-3 py-2.5 rounded-lg focus:outline-hidden focus:bg-white text-slate-600 font-semibold border border-slate-100"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-slate-950 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm transition flex items-center justify-center space-x-2 uppercase tracking-wide cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing Up...</span>
                  </>
                ) : (
                  <>
                    <span>Sign Up & Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-slate-400 text-xs">
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setActiveField('phone');
                    }}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer ml-1"
                  >
                    Log In Directly
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ================= MORE: FORGOT PASSWORD RECOVERY ================= */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {forgotStep === 'phone' ? (
                <form onSubmit={handleForgotPhoneSubmit} className="space-y-4">
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl text-xs text-amber-800 space-y-1">
                    <p className="font-extrabold flex items-center">
                      <HelpCircle className="w-3.5 h-3.5 mr-1" />
                      Free Self-Service Recovery Flow
                    </p>
                    <p className="text-[10px] leading-relaxed">
                      Enter your phone number to fetch the custom secret question you selected during registration. It is completely free.
                    </p>
                  </div>

                  <div className={`space-y-1 p-0.5 rounded-xl border transition ${activeField === 'phone' ? 'border-indigo-500 bg-indigo-50/10' : 'border-transparent'}`}>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pl-1">
                      Registered Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        onFocus={() => setActiveField('phone')}
                        className="w-full text-xs font-bold text-slate-700 bg-slate-50 pl-11 pr-3 py-2.5 rounded-lg focus:outline-hidden focus:bg-white border border-slate-100"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="py-2.5 text-xs text-slate-500 rounded-xl hover:bg-slate-100 transition font-bold cursor-pointer border bg-white"
                    >
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-slate-950 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 uppercase tracking-wide cursor-pointer"
                    >
                      {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Get Question</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Your Security Question
                    </p>
                    <p className="text-xs text-slate-800 font-extrabold flex items-center">
                      <HelpCircle className="w-4 h-4 text-indigo-500 mr-2 shrink-0" />
                      <span>{retrievedQuestion}</span>
                    </p>
                  </div>

                  <div className={`space-y-1 p-0.5 rounded-xl border transition ${activeField === 'securityAnswer' ? 'border-indigo-500 bg-indigo-50/10' : 'border-transparent'}`}>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pl-1">
                      Your Recovery Answer
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Type the answer you entered during signup"
                      onFocus={() => setActiveField('securityAnswer')}
                      className="w-full text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2.5 rounded-lg focus:outline-hidden focus:bg-white border"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                    />
                  </div>

                  <div className={`space-y-1 p-0.5 rounded-xl border transition ${activeField === 'newPassword' ? 'border-indigo-500 bg-indigo-50/10' : 'border-transparent'}`}>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pl-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Define new password (Min 4 chars)"
                      onFocus={() => setActiveField('newPassword')}
                      className="w-full text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2.5 rounded-lg focus:outline-hidden focus:bg-white border"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('phone')}
                      className="py-2.5 text-xs text-slate-500 rounded-xl hover:bg-slate-100 transition font-bold cursor-pointer border bg-white flex items-center justify-center space-x-1"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-slate-950 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 uppercase tracking-wide cursor-pointer"
                    >
                      {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Verify & Login</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 🎹 INTELLIGENT VIRTUAL PHONE TOUCH KEYPAD */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-1.5 px-0.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Touch Pad typing
              </span>
              <span className="text-[10px] bg-slate-200/60 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
                Active: <b className="font-mono uppercase">{activeField === 'securityAnswer' ? 'Answer' : activeField === 'newPassword' ? 'New Pass' : activeField}</b>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {KEYPAD_NUMS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className={`py-2 rounded-lg text-sm font-extrabold transition active:scale-95 cursor-pointer ${
                    k === "Clear" || k === "Back"
                      ? "bg-slate-200 text-slate-600 text-xs hover:bg-slate-300"
                      : "bg-white text-slate-800 hover:bg-indigo-50 border border-slate-200"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Secure disclaimer strip */}
          <p className="text-[9px] text-slate-400 text-center leading-relaxed font-medium">
            🔒 Protected by local memory tokens. Security details are hosted strictly server-side in your region.
          </p>

        </div>
      </div>
    </div>
  );
}
