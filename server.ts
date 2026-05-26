import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully server-side.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client, falling back to rule-based fallback:", err);
  }
} else {
  console.log("GEMINI_API_KEY not found in env, using simulated AI responses.");
}

// Keep persistent file database path
const DATA_FILE = path.join(process.cwd(), "data.json");

// Helper interface for DB
interface DatabaseSchema {
  users: any[];
  seekerProfiles: any[];
  employerProfiles: any[];
  jobs: any[];
  applications: any[];
  payments: any[];
  referrals: any[];
}

// Fallback seeds for local Anantapur cities
const SEED_DATA: DatabaseSchema = {
  users: [
    { id: "u-admin", phone: "9999999999", email: "admin@meejobs.in", role: "admin", createdAt: new Date().toISOString(), password: "123456", securityQuestion: "In which city were you born?", securityAnswer: "MeeJobs" },
    { id: "u-emp1", phone: "9876543210", email: "contact@anantadesigns.co", role: "employer", createdAt: new Date().toISOString(), password: "123456", securityQuestion: "In which city were you born?", securityAnswer: "MeeJobs" },
    { id: "u-emp2", phone: "9440112233", email: "ramesh.sweets@gmail.com", role: "employer", createdAt: new Date().toISOString(), password: "123456", securityQuestion: "In which city were you born?", securityAnswer: "MeeJobs" },
    { id: "u-seeker1", phone: "8888812345", email: "sravan.kumar@gmail.com", role: "seeker", createdAt: new Date().toISOString(), password: "123456", securityQuestion: "In which city were you born?", securityAnswer: "MeeJobs" },
  ],
  seekerProfiles: [
    {
      userId: "u-seeker1",
      name: "Sravan Kumar",
      email: "sravan.kumar@gmail.com",
      phone: "8888812345",
      photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      skills: ["Sales", "Customer Relations", "Billing Cashier", "Telugu", "Basic English"],
      experience: "1.5 years as Sales Executive at Anupama Textiles",
      location: "Sarda Nagar, Bellary Road",
      resumeFileName: "Sravan_Sales_Resume.pdf",
      resumeUrl: "https://meejobs.in/resumes/sravan.pdf",
      bio: "Energetic commerce graduate looking for retail cashier, sales executive, or store manager role near their locality.",
      education: "B.Com Degree (SKU)"
    }
  ],
  employerProfiles: [
    {
      userId: "u-emp1",
      businessName: "Ananta Digital Solutions",
      logoUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80",
      contactPerson: "Arun Reddy",
      contactPhone: "9876543210",
      whatsappNumber: "919876543210",
      location: "Kamalanagar Main Rd, opposite SKU Post Office",
      description: "Local marketing agency and electronics retail store providing fast service across the region.",
      website: "https://anantadigital.co",
      jobPostsRemaining: 3,
      activePlan: "unlimited_monthly",
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
    },
    {
      userId: "u-emp2",
      businessName: "Sri Krishna Pure Ghee Sweets",
      logoUrl: "https://images.unsplash.com/photo-1505253715459-c2c5db0e22ef?w=150&auto=format&fit=crop&q=80",
      contactPerson: "Ramesh Sharma",
      contactPhone: "9440112233",
      whatsappNumber: "919440112233",
      location: "Saptagiri Circle, Near Clock Tower Road",
      description: "Famous sweet stall and restaurant serving premium confectioneries since 1995.",
      website: "",
      jobPostsRemaining: 1,
      activePlan: "free",
      subscriptionExpiry: undefined
    }
  ],
  jobs: [
    {
      id: "job-1",
      employerId: "u-emp1",
      companyName: "Ananta Digital Solutions",
      companyLogo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80",
      title: "Store Sales Coordinator",
      category: "Retail & Sales",
      description: "We are looking for a dynamic male/female Sales Associate to manage our electronics retail showroom counters. Responsible for welcoming customers, showcasing smartphones/accessories, explaining financing plans (Bajaj Finance), and billing details.",
      requirements: ["Good English or Kannada speaking skills", "Basic computer typing and billing software experience", "Honest, reliable & friendly demeanor"],
      salaryMin: 12000,
      salaryMax: 18000,
      salaryPeriod: "monthly",
      jobType: "Full-time",
      location: "Indiranagar, Bengaluru, Karnataka",
      latitude: 12.9716,
      longitude: 77.5946,
      whatsappNumber: "919876543210",
      contactPhone: "9876543210",
      isFeatured: true,
      status: "active",
      createdAt: new Date().toISOString(),
      viewsCount: 142,
      applicantsCount: 5
    },
    {
      id: "job-2",
      employerId: "u-emp2",
      companyName: "Sri Krishna Pure Sweets Hub",
      companyLogo: "https://images.unsplash.com/photo-1505253715459-c2c5db0e22ef?w=150&auto=format&fit=crop&q=80",
      title: "Assistant Cook / Kitchen Helper",
      category: "Restaurant, Cook & Waiter",
      description: "Urgently food preparation assistant wanted at our sweets center. Will assist the main master chef in mixing recipes, chopping sweets, organizing storage, maintaining absolute kitchen cleanliness, and packaging catering orders.",
      requirements: ["Prior experience in sweetmaking or food court helper is preferred", "Ability to lift heavy raw items", "Willing to work full day shifts"],
      salaryMin: 9000,
      salaryMax: 13000,
      salaryPeriod: "monthly",
      jobType: "Full-time",
      location: "Andheri West, Mumbai, Maharashtra",
      latitude: 19.0760,
      longitude: 72.8777,
      whatsappNumber: "919440112233",
      contactPhone: "9440112233",
      isFeatured: false,
      status: "active",
      createdAt: new Date(Date.now() - 3 * 2 * 3600 * 1000).toISOString(),
      viewsCount: 89,
      applicantsCount: 2
    },
    {
      id: "job-3",
      employerId: "u-emp1",
      companyName: "Ananta Digital Solutions",
      companyLogo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80",
      title: "Delivery Rider & Field Executive",
      category: "Delivery & Logistics",
      description: "Required flexible field coordinators to manage local home deliveries and e-commerce courier handovers in municipal regions. Candidate must possess their own vehicle (Two-wheeler) and valid driver license.",
      requirements: ["Valid Driving License is compulsory", "Own android smartphone for delivery status updates", "Thorough spatial knowledge of local colonies"],
      salaryMin: 350,
      salaryMax: 500,
      salaryPeriod: "daily",
      jobType: "Part-time",
      location: "Gachibowli, Hyderabad, Telangana",
      latitude: 17.3850,
      longitude: 78.4867,
      whatsappNumber: "919876543210",
      contactPhone: "9876543210",
      isFeatured: false,
      status: "active",
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      viewsCount: 210,
      applicantsCount: 8
    }
  ],
  applications: [
    {
      id: "app-1",
      jobId: "job-1",
      jobTitle: "Store Sales Coordinator",
      companyName: "Ananta Digital Solutions",
      seekerId: "u-seeker1",
      seekerName: "Sravan Kumar",
      seekerPhone: "8888812345",
      seekerExperience: "1.5 years as Sales Executive at Anupama Textiles",
      seekerSkills: ["Sales", "Customer Relations", "Billing Cashier", "Telugu"],
      coverLetter: "Hi, I am SKU graduate and live near Bellary Road. I worked in retail textiles before, so I have great sales experience. I can join immediately.",
      status: "applied",
      aiMatchScore: 88,
      aiMatchAnalysis: "High alignment because candidate has 1.5 years prior sales experience in Textiles, speaks local language, and matches requirements closely.",
      createdAt: new Date().toISOString()
    }
  ],
  payments: [
    {
      id: "pay-1",
      employerId: "u-emp1",
      amount: 499,
      description: "Featured Listing Activation for Store Sales Coordinator",
      planId: "single_featured",
      jobId: "job-1",
      razorpayOrderId: "order_mock_123456",
      razorpayPaymentId: "pay_mock_987654",
      status: "success",
      createdAt: new Date().toISOString()
    }
  ],
  referrals: []
};

// Database utility loader
const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  "bengaluru": { latitude: 12.9716, longitude: 77.5946 },
  "bangalore": { latitude: 12.9716, longitude: 77.5946 },
  "mumbai": { latitude: 19.0760, longitude: 72.8777 },
  "delhi": { latitude: 28.7041, longitude: 77.1025 },
  "ncr": { latitude: 28.7041, longitude: 77.1025 },
  "gurgaon": { latitude: 28.4595, longitude: 77.0266 },
  "noida": { latitude: 28.5355, longitude: 77.3910 },
  "hyderabad": { latitude: 17.3850, longitude: 78.4867 },
  "chennai": { latitude: 13.0827, longitude: 80.2707 },
  "pune": { latitude: 18.5204, longitude: 73.8567 },
  "kolkata": { latitude: 22.5726, longitude: 88.3639 },
  "ahmedabad": { latitude: 23.0225, longitude: 72.5714 },
  "jaipur": { latitude: 26.9124, longitude: 75.7873 },
  "anantapur": { latitude: 14.6819, longitude: 77.6006 }
};

function geocodeLocation(locationStr: string): { latitude: number; longitude: number } {
  const norm = (locationStr || "").toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (norm.includes(key)) {
      return {
        latitude: coords.latitude + (Math.random() - 0.5) * 0.015,
        longitude: coords.longitude + (Math.random() - 0.5) * 0.015
      };
    }
  }
  // Generic randomized coordinates within India as fallback
  return {
    latitude: 20.5937 + (Math.random() - 0.5) * 4.0,
    longitude: 78.9629 + (Math.random() - 0.5) * 4.0
  };
}

function readDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const db = JSON.parse(data);
      let migrationNeeded = false;
      if (db.users) {
        db.users.forEach((user: any) => {
          if (!user.password) {
            user.password = "123456";
            user.securityQuestion = "In which city were you born?";
            user.securityAnswer = "MeeJobs";
            migrationNeeded = true;
          }
          if (user.securityAnswer === "Anantapur") {
            user.securityAnswer = "MeeJobs";
            migrationNeeded = true;
          }
          if (user.email && user.email.includes("localjobs.in")) {
            user.email = user.email.replace("localjobs.in", "meejobs.in");
            migrationNeeded = true;
          }
        });
      }
      if (db.jobs) {
        db.jobs.forEach((j: any) => {
          if (j.latitude === undefined || j.longitude === undefined) {
            const coords = geocodeLocation(j.location);
            j.latitude = coords.latitude;
            j.longitude = coords.longitude;
            migrationNeeded = true;
          }
        });
      }
      if (migrationNeeded) {
        writeDB(db);
      }
      return db;
    }
  } catch (err) {
    console.error("Failed to read database file, reloading seeds:", err);
  }
  // Store default seed data if no file
  writeDB(SEED_DATA);
  return SEED_DATA;
}

function writeDB(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database to disk:", err);
  }
}

// Ensure database file is generated immediately on starter boot
readDB();


// ================= AUTH SIMULATED API =================

// Register a new user with password & security verification question
app.post("/api/auth/signup", (req, res) => {
  const { phone, password, selectedRole, email, securityQuestion, securityAnswer } = req.body;
  if (!phone || !password || !selectedRole || !securityQuestion || !securityAnswer) {
    return res.status(400).json({ error: "Required fields missing. Please provide phone, password, role, security question, and answer." });
  }
  
  if (phone.length < 10) {
    return res.status(400).json({ error: "Invalid mobile number. Must be at least 10 digits." });
  }

  const db = readDB();
  const existingUser = db.users.find(u => u.phone === phone);
  if (existingUser) {
    return res.status(400).json({ error: "An account with this phone number already exists." });
  }

  const newUser = {
    id: "u-" + Math.random().toString(36).substr(2, 9),
    phone,
    email: email || `${phone}@localjobs.in`,
    role: selectedRole || "seeker",
    password,
    securityQuestion,
    securityAnswer: securityAnswer.trim(),
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);

  // Bootstrap appropriate profile
  if (newUser.role === "seeker") {
    const newSeeker = {
      userId: newUser.id,
      name: "Job Seeker (" + phone.substring(6) + ")",
      email: newUser.email,
      phone,
      photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      skills: ["Fresh Graduate", "Customer Relations"],
      experience: "Fresh Graduate / No Experience",
      location: "Anantapur City, Andhra Pradesh",
      resumeText: "",
      bio: "",
      education: ""
    };
    db.seekerProfiles.push(newSeeker);
  } else if (newUser.role === "employer") {
    const newEmployer = {
      userId: newUser.id,
      businessName: "Business Stall " + phone.substring(6),
      logoUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80",
      contactPerson: "Owner",
      contactPhone: phone,
      whatsappNumber: "91" + phone,
      location: "Anantapur Market Road, Anantapur",
      jobPostsRemaining: 3,
      activePlan: "free"
    };
    db.employerProfiles.push(newEmployer);
  }

  writeDB(db);

  // Find associated profile
  const profile = newUser.role === "seeker" 
    ? db.seekerProfiles.find(p => p.userId === newUser.id)
    : db.employerProfiles.find(p => p.userId === newUser.id);

  return res.json({
    success: true,
    token: `token-${newUser.id}`,
    user: newUser,
    profile
  });
});

// Login user with password
app.post("/api/auth/login", (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: "Please enter both mobile number and password." });
  }

  const db = readDB();
  const user = db.users.find(u => u.phone === phone);
  if (!user) {
    return res.status(400).json({ error: "No account found with this phone number. Please sign up." });
  }

  if (user.password !== password) {
    return res.status(400).json({ error: "Incorrect password. Please try again." });
  }

  const profile = user.role === "seeker"
    ? db.seekerProfiles.find(p => p.userId === user.id)
    : db.employerProfiles.find(p => p.userId === user.id);

  return res.json({
    success: true,
    token: `token-${user.id}`,
    user,
    profile
  });
});

// Retrieve security question for a password recovery trigger
app.post("/api/auth/forgot-password-question", (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Please provide a registered mobile number." });
  }

  const db = readDB();
  const user = db.users.find(u => u.phone === phone);
  if (!user) {
    return res.status(404).json({ error: "No account registered with this mobile number." });
  }

  return res.json({
    success: true,
    securityQuestion: user.securityQuestion || "In which city were you born?"
  });
});

// Reset password based on correct security question answer
app.post("/api/auth/password-reset", (req, res) => {
  const { phone, securityAnswer, newPassword } = req.body;
  if (!phone || !securityAnswer || !newPassword) {
    return res.status(400).json({ error: "Required fields missing. Please provide phone, security answer, and a new password." });
  }

  const db = readDB();
  const user = db.users.find(u => u.phone === phone);
  if (!user) {
    return res.status(404).json({ error: "No account registered with this mobile number." });
  }

  const storedAnswer = (user.securityAnswer || "").trim().toLowerCase();
  const providedAnswer = securityAnswer.trim().toLowerCase();

  if (storedAnswer && storedAnswer !== providedAnswer) {
    return res.status(400).json({ error: "Incorrect answer to security question. Please try again." });
  }

  user.password = newPassword;
  writeDB(db);

  return res.json({
    success: true,
    message: "Password updated successfully! You can now log in with your new password."
  });
});


// ================= PROFILE RETRIEVAL AND SAVING =================

app.get("/api/profile/:userId", (req, res) => {
  const { userId } = req.params;
  const db = readDB();
  const user = db.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: "User not encountered" });
  }

  let profile = null;
  if (user.role === "seeker") {
    profile = db.seekerProfiles.find(p => p.userId === userId);
  } else if (user.role === "employer") {
    profile = db.employerProfiles.find(p => p.userId === userId);
  }

  return res.json({ user, profile });
});

app.post("/api/profile/seeker", (req, res) => {
  const { userId, name, email, phone, location, skills, experience, bio, education, resumeFileName, resumeText } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing identity" });

  const db = readDB();
  let seeker = db.seekerProfiles.find(s => s.userId === userId);

  const updatedSeeker = {
    userId,
    name: name || seeker?.name || "Anonymous",
    email: email || seeker?.email || "",
    phone: phone || seeker?.phone || "",
    photoUrl: seeker?.photoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    skills: Array.isArray(skills) ? skills : (skills ? skills.split(",").map((s: string) => s.trim()) : []),
    experience: experience || seeker?.experience || "",
    location: location || seeker?.location || "Anantapur",
    bio: bio || seeker?.bio || "",
    education: education || seeker?.education || "",
    resumeFileName: resumeFileName || seeker?.resumeFileName || "",
    resumeText: resumeText || seeker?.resumeText || ""
  };

  if (seeker) {
    Object.assign(seeker, updatedSeeker);
  } else {
    db.seekerProfiles.push(updatedSeeker);
  }

  writeDB(db);
  return res.json({ success: true, profile: updatedSeeker });
});

app.post("/api/profile/employer", (req, res) => {
  const { userId, businessName, location, contactPerson, contactPhone, whatsappNumber, description, website, logoUrl } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing identity" });

  const db = readDB();
  let employer = db.employerProfiles.find(e => e.userId === userId);

  const updatedEmployer = {
    userId,
    businessName: businessName || employer?.businessName || "Unnamed Retail Store",
    logoUrl: logoUrl || employer?.logoUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80",
    contactPerson: contactPerson || employer?.contactPerson || "",
    contactPhone: contactPhone || employer?.contactPhone || "",
    whatsappNumber: whatsappNumber || employer?.whatsappNumber || "",
    location: location || employer?.location || "Anantapur Corner",
    description: description || employer?.description || "",
    website: website || employer?.website || "",
    jobPostsRemaining: employer?.jobPostsRemaining !== undefined ? employer.jobPostsRemaining : 3,
    activePlan: employer?.activePlan || "free",
    subscriptionExpiry: employer?.subscriptionExpiry
  };

  if (employer) {
    Object.assign(employer, updatedEmployer);
  } else {
    db.employerProfiles.push(updatedEmployer);
  }

  writeDB(db);
  return res.json({ success: true, profile: updatedEmployer });
});


// ================= JOBS SERVICE =================

// Search/filter jobs
app.get("/api/jobs", (req, res) => {
  const { query, salaryMin, location, jobType, category, isFeatured } = req.query;
  const db = readDB();
  
  let result = db.jobs.filter(job => job.status === "active");

  if (query) {
    const q = String(query).toLowerCase();
    result = result.filter(j => 
      j.title.toLowerCase().includes(q) || 
      j.description.toLowerCase().includes(q) || 
      j.companyName.toLowerCase().includes(q)
    );
  }

  if (salaryMin) {
    const minSal = Number(salaryMin);
    result = result.filter(j => j.salaryMax >= minSal);
  }

  if (location && location !== "All") {
    const loc = String(location).toLowerCase();
    result = result.filter(j => j.location.toLowerCase().includes(loc));
  }

  if (jobType && jobType !== "All") {
    result = result.filter(j => j.jobType === jobType);
  }

  if (category && category !== "All") {
    result = result.filter(j => j.category === category);
  }

  if (isFeatured === "true") {
    result = result.filter(j => j.isFeatured);
  }

  // Sort: Featured first, then descending by createdAt
  result.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return res.json(result);
});

// Single Job & Increment view count
app.get("/api/jobs/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const job = db.jobs.find(j => j.id === id);

  if (!job) {
    return res.status(404).json({ error: "Job listing not encountered" });
  }

  job.viewsCount = (job.viewsCount || 0) + 1;
  writeDB(db);

  return res.json(job);
});

// Create Job
app.post("/api/jobs", (req, res) => {
  const {
    employerId,
    title,
    category,
    description,
    requirements,
    salaryMin,
    salaryMax,
    salaryPeriod,
    jobType,
    location,
    whatsappNumber,
    contactPhone
  } = req.body;

  if (!employerId || !title || !category || !description) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  const db = readDB();
  const empProfile = db.employerProfiles.find(e => e.userId === employerId);

  if (!empProfile) {
    return res.status(400).json({ error: "Employer profile must be populated before listing jobs" });
  }

  // Check remaining slots if not unlimited
  if (empProfile.activePlan !== "unlimited_monthly" && empProfile.jobPostsRemaining <= 0) {
    return res.status(402).json({ 
      error: "No remaining free postings. Purchase ₹199 Single Post or Buy ₹999 Unlimited monthly subscription.",
      remainingPosts: 0 
    });
  }

  let jobLat = Number(req.body.latitude);
  let jobLng = Number(req.body.longitude);

  if (isNaN(jobLat) || isNaN(jobLng) || !jobLat || !jobLng) {
    const locStr = location || empProfile.location || "";
    const coords = geocodeLocation(locStr);
    jobLat = coords.latitude;
    jobLng = coords.longitude;
  }

  const newJob = {
    id: "job-" + Math.random().toString(36).substr(2, 9),
    employerId,
    companyName: empProfile.businessName,
    companyLogo: empProfile.logoUrl,
    title,
    category,
    description,
    requirements: Array.isArray(requirements) ? requirements : [requirements],
    salaryMin: Number(salaryMin) || 10000,
    salaryMax: Number(salaryMax) || 15000,
    salaryPeriod: salaryPeriod || "monthly",
    jobType: jobType || "Full-time",
    location: location || empProfile.location,
    latitude: jobLat,
    longitude: jobLng,
    whatsappNumber: whatsappNumber || empProfile.whatsappNumber || "919999999999",
    contactPhone: contactPhone || empProfile.contactPhone,
    isFeatured: false,
    status: "active", // Approved directly for rapid onboarding, with admin override
    createdAt: new Date().toISOString(),
    viewsCount: 0,
    applicantsCount: 0
  };

  db.jobs.push(newJob);

  // Decrement posting slots if not unlimited
  if (empProfile.activePlan !== "unlimited_monthly") {
    empProfile.jobPostsRemaining = Math.max(0, empProfile.jobPostsRemaining - 1);
  }

  writeDB(db);
  return res.json({ success: true, job: newJob, remainingPosts: empProfile.jobPostsRemaining });
});


// Delete job
app.delete("/api/jobs/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const jobIdx = db.jobs.findIndex(j => j.id === id);

  if (jobIdx === -1) {
    return res.status(404).json({ error: "Job listing not found." });
  }

  db.jobs.splice(jobIdx, 1);
  writeDB(db);
  return res.json({ success: true });
});


// ================= JOB APPLICATIONS & GEMINI ASSESSMENT =================

// Submit job application
app.post("/api/applications", async (req, res) => {
  const { jobId, seekerId, coverLetter } = req.body;
  
  if (!jobId || !seekerId) {
    return res.status(400).json({ error: "Missing identity" });
  }

  const db = readDB();
  const job = db.jobs.find(j => j.id === jobId);
  const seeker = db.seekerProfiles.find(s => s.userId === seekerId);

  if (!job || !seeker) {
    return res.status(404).json({ error: "Job listing or job seeker profile not found" });
  }

  // Prevent double application
  const existingApp = db.applications.find(a => a.jobId === jobId && a.seekerId === seekerId);
  if (existingApp) {
    return res.status(400).json({ error: "You have already applied for this job." });
  }

  // Trigger real or simulated Gemini Match score
  let score = 75;
  let analysis = "Moderate matching. Match computed via local structural alignment algorithm.";
  
  if (ai) {
    try {
      const prompt = `Analyze matching score (0 to 100) and provide a short and professional 1-sentence Rayalaseema/Indian-focused recruitment feedback.
        Job Title: ${job.title}
        Job Category: ${job.category}
        Job Requirements: ${job.requirements.join(", ")}
        Job Description: ${job.description}
        
        Candidate Profile:
        Candidate Name: ${seeker.name}
        Skills: ${seeker.skills.join(", ")}
        Experience: ${seeker.experience}
        Education: ${seeker.education || "Undergraduate/General Education"}
        Candidate Details/Resume: ${seeker.bio || "No extra bio"} ${seeker.resumeText || ""}
        
        Respond with raw JSON conforming precisely to this format:
        {
          "score": 85,
          "analysis": "Excellent candidate with strong direct retail experience and great communication in Telugu."
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              analysis: { type: Type.STRING }
            },
            required: ["score", "analysis"]
          }
        }
      });

      const responseText = response.text ? response.text.trim() : "";
      const jsonRes = JSON.parse(responseText);
      score = jsonRes.score || 72;
      analysis = jsonRes.analysis || "Candidate matches requirements well.";
    } catch (err) {
      console.warn("Could not match via Gemini, fallback to basic logic:", err);
      // Rough mock score based on matching keywords
      const reqMatched = job.requirements.filter(reqWord => 
        seeker.skills.some(skill => skill.toLowerCase().includes(reqWord.toLowerCase()) || reqWord.toLowerCase().includes(skill.toLowerCase()))
      ).length;
      score = 60 + (reqMatched * 15);
      if (score > 98) score = 98;
    }
  } else {
    // Structural simulated keyword matching
    const commonKeywordCount = seeker.skills.filter(s => 
      job.title.toLowerCase().includes(s.toLowerCase()) || 
      job.description.toLowerCase().includes(s.toLowerCase())
    ).length;
    score = 70 + (commonKeywordCount * 8);
    if (score > 95) score = 95;
    analysis = "Match score simulated successfully. Candidate possesses highly relevant skills matching current local business targets.";
  }

  const newApp = {
    id: "app-" + Math.random().toString(36).substr(2, 9),
    jobId,
    jobTitle: job.title,
    companyName: job.companyName,
    seekerId,
    seekerName: seeker.name,
    seekerPhone: seeker.phone,
    seekerExperience: seeker.experience,
    seekerSkills: seeker.skills,
    coverLetter: coverLetter || "",
    status: "applied",
    aiMatchScore: score,
    aiMatchAnalysis: analysis,
    createdAt: new Date().toISOString()
  };

  db.applications.push(newApp);
  job.applicantsCount = (job.applicantsCount || 0) + 1;
  writeDB(db);

  return res.json({ success: true, application: newApp });
});

// Update Application status
app.patch("/api/applications/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Missing status value" });

  const db = readDB();
  const appModel = db.applications.find(a => a.id === id);

  if (!appModel) {
    return res.status(404).json({ error: "Application record not encountered." });
  }

  appModel.status = status;
  writeDB(db);

  return res.json({ success: true, application: appModel });
});

// View applications by Seeker or Employer
app.get("/api/applications", (req, res) => {
  const { seekerId, employerId } = req.query;
  const db = readDB();

  let results = db.applications;

  if (seekerId) {
    results = results.filter(a => a.seekerId === seekerId);
  }

  if (employerId) {
    const employerJobs = db.jobs.filter(j => j.employerId === employerId).map(j => j.id);
    results = results.filter(a => employerJobs.includes(a.jobId));
  }

  // Sort descending
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json(results);
});


// ================= AI DYNAMIC HELPERS (TELUGU / JOB POST OPTIMIZER) =================

// Assist business to generate descriptions
app.post("/api/ai/optimize-job", async (req, res) => {
  const { title, inputs } = req.body;
  if (!title) return res.status(400).json({ error: "Missing job title query" });

  const defaultDescription = `We are hiring a candidate for ${title}. Responsibilities include managing customer workflow, handling store front sales, maintaining registers, and reporting daily metrics to store coordinators.`;
  const defaultRequirements = ["Friendly and reliable personality", "Honesty & punctual attendance", "Willingness to handle multi-tasking"];

  if (!ai) {
    return res.json({
      title,
      description: `[Simulated AI Post] Hiring a professional ${title}. Details: ${inputs || "Responsible for handling core retail operations, logistics handovers, or kitchen assembly lines quickly."}`,
      requirements: ["Familiar with local languages", "Honest & reliable", "Available for immediate start"]
    });
  }

  try {
    const prompt = `Write a professional, attractive, simple job description and 3 specific bullet points for local job seekers in Indian small towns (like Anantapur). It must target freshers and blue-collar/sales roles.
      Job Title: ${title}
      Business Details / Bullet points typed: ${inputs || "No details provided"}
      
      Respond only with raw JSON conforming precisely to this schema format:
      {
        "description": "A well-written 3-4 sentence job description...",
        "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"]
      }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            requirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["description", "requirements"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      title,
      description: parsed.description || defaultDescription,
      requirements: parsed.requirements || defaultRequirements
    });
  } catch (err) {
    console.warn("AI Generation fail, fallback to local text generator:", err);
    return res.json({
      title,
      description: defaultDescription,
      requirements: defaultRequirements
    });
  }
});

// Translation Helper (specifically into Telugu language or general Hindi)
app.post("/api/ai/transliterate", async (req, res) => {
  const { text, targetLanguage } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text query" });
  const lang = targetLanguage || "Telugu";

  if (!ai) {
    // Basic local language translation simulations for display
    const simulatedTelugu = `[Telugu Translation] ${text.substring(0, 100)}... స్థానిక ఉద్యోగావకాశం. ఆసక్తిగల అభ్యర్థులు వెంటనే వాట్సాప్ లేదా నేరుగా అప్లై చేసుకోగలరు!`;
    return res.json({ translatedText: simulatedTelugu });
  }

  try {
    const prompt = `Translate the following job post detail exactly into localized ${lang} script, maintaining clear, easy-to-read, standard regional phrases for freshers or blue-collar workers.
      Text to translate:
      ${text}
      
      Respond with ONLY the finalized translation text. Do not wrap in markdown quotes or extra messages.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.json({ translatedText: response.text ? response.text.trim() : text });
  } catch (err) {
    console.error("Translation server mistake:", err);
    return res.status(500).json({ error: "Translation process failed." });
  }
});


// ================= PAYMENT SYSTEM (RAZORPAY SIMULATION COUPLING) =================

// Create Razorpay mock order
app.post("/api/payments/order", (req, res) => {
  const { employerId, planId, jobId } = req.body;
  
  if (!employerId || !planId) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  let amount = 199;
  let description = "Single Job Listing Post Plan";

  if (planId === "single_featured") {
    amount = 499;
    description = "Upgrade to Featured Job Post Listing";
  } else if (planId === "unlimited_monthly") {
    amount = 999;
    description = "Unlimited Monthly Job Posting Subscription";
  }

  // Create Mock Order Id
  const rzpOrderId = "rzp_order_" + Math.random().toString(36).substr(2, 12);

  return res.json({
    success: true,
    amount,
    currency: "INR",
    razorpayOrderId: rzpOrderId,
    planId,
    jobId,
    description,
    employerId
  });
});

// Verify payment and augment employer status
app.post("/api/payments/verify", (req, res) => {
  const { employerId, planId, jobId, razorpayOrderId, razorpayPaymentId } = req.body;

  if (!employerId || !planId || !razorpayOrderId) {
    return res.status(400).json({ error: "Verification attributes missing" });
  }

  const db = readDB();
  const empProfile = db.employerProfiles.find(e => e.userId === employerId);

  if (!empProfile) {
    return res.status(404).json({ error: "Employer profile not found" });
  }

  // Register Transaction Record
  const newPayment = {
    id: "pay-" + Math.random().toString(36).substr(2, 9),
    employerId,
    amount: planId === "single_post" ? 199 : (planId === "single_featured" ? 499 : 999),
    description: `Paid for ${planId} activation`,
    planId,
    jobId,
    razorpayOrderId,
    razorpayPaymentId: razorpayPaymentId || "rzp_pymnt_" + Math.random().toString(36).substr(2, 10),
    status: "success",
    createdAt: new Date().toISOString()
  };
  
  db.payments.push(newPayment);

  // Apply features
  if (planId === "single_post") {
    empProfile.jobPostsRemaining += 1;
  } else if (planId === "single_featured" && jobId) {
    const targetJob = db.jobs.find(j => j.id === jobId);
    if (targetJob) {
      targetJob.isFeatured = true;
    }
  } else if (planId === "unlimited_monthly") {
    empProfile.activePlan = "unlimited_monthly";
    empProfile.jobPostsRemaining += 100; // Large allotment
    empProfile.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  }

  writeDB(db);

  return res.json({
    success: true,
    message: "Payment successfully validated & features provisioned instantly!",
    profile: empProfile,
    payment: newPayment
  });
});


// ================= REFERRALS & USER STATS API =================

app.post("/api/referrals", (req, res) => {
  const { referrerPhone, referredPhone } = req.body;
  if (!referrerPhone || !referredPhone) {
    return res.status(400).json({ error: "Referrer and referee phone numbers required." });
  }

  const db = readDB();
  const existingReferral = db.referrals.find(rf => rf.referredPhone === referredPhone);
  if (existingReferral) {
    return res.status(400).json({ error: "This mobile contact is already referred." });
  }

  const newRef = {
    id: "ref-" + Math.random().toString(36).substr(2, 9),
    referrerPhone,
    referredPhone,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  db.referrals.push(newRef);
  writeDB(db);

  return res.json({ success: true, referral: newRef });
});


// ================= SYSTEM ADMINISTRATOR ANALYTICS & MODERATION =================

app.get("/api/admin/analytics", (req, res) => {
  const db = readDB();
  
  const totalSeekers = db.users.filter(u => u.role === "seeker").length;
  const totalEmployers = db.users.filter(u => u.role === "employer").length;
  const totalJobs = db.jobs.length;
  const activeJobs = db.jobs.filter(j => j.status === "active").length;
  const featuredJobs = db.jobs.filter(j => j.isFeatured).length;
  const totalApplications = db.applications.length;
  
  // Calculate total money collected
  let totalRevenue = 0;
  db.payments.forEach(p => {
    if (p.status === "success") {
      totalRevenue += p.amount;
    }
  });

  return res.json({
    totalSeekers,
    totalEmployers,
    totalJobs,
    activeJobs,
    featuredJobs,
    totalRevenue,
    totalApplications
  });
});

// Admin listings control
app.get("/api/admin/jobs", (req, res) => {
  const db = readDB();
  return res.json(db.jobs);
});

// Toggle Job status
app.patch("/api/admin/jobs/:id/toggle", (req, res) => {
  const { id } = req.params;
  const { status, isFeatured } = req.body;
  
  const db = readDB();
  const job = db.jobs.find(j => j.id === id);

  if (!job) {
    return res.status(404).json({ error: "Job listing not encountered." });
  }

  if (status !== undefined) {
    job.status = status;
  }
  if (isFeatured !== undefined) {
    job.isFeatured = isFeatured;
  }

  writeDB(db);
  return res.json({ success: true, job });
});


// ================= SEED DATA CONTROL ENDPOINT =================

app.post("/api/db/reset", (req, res) => {
  writeDB(SEED_DATA);
  return res.json({ success: true, message: "Local DB re-seeded successfully." });
});


// ================= VITE OR STATIC STATIC MIDDLEWARE LOADER =================

if (process.env.NODE_ENV !== "production") {
  // Developer hot module integration
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  }).then((vite) => {
    app.use(vite.middlewares);
    
    // Fallback everything else to client-side single page app routing
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "index.html"));
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server launched in dev mode of MeeJobs on http://localhost:${PORT}`);
    });
  });
} else {
  // Production files layout serving
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
 
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running in production of MeeJobs at port ${PORT}`);
  });
}
