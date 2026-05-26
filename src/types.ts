/**
 * Database Schema and Application Types for MeeJobs
 */

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: 'employer' | 'seeker' | 'admin';
  createdAt: string;
  password?: string;
  securityQuestion?: string;
  securityAnswer?: string;
}

export interface SeekerProfile {
  userId: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string;
  skills: string[];
  experience: string;
  location: string;
  resumeUrl?: string; // Optional PDF Link (Simulated)
  resumeFileName?: string;
  resumeText?: string; // Extracted/Inputted resume details
  bio?: string;
  education?: string;
}

export interface EmployerProfile {
  userId: string;
  businessName: string;
  logoUrl: string;
  contactPerson: string;
  contactPhone: string;
  whatsappNumber: string;
  location: string;
  description?: string;
  website?: string;
  jobPostsRemaining: number;
  activePlan: 'free' | 'unlimited_monthly';
  subscriptionExpiry?: string;
}

export interface Job {
  id: string;
  employerId: string;
  companyName: string;
  companyLogo: string;
  title: string;
  category: JobCategory;
  description: string;
  requirements: string[];
  salaryMin: number;
  salaryMax: number;
  salaryPeriod: 'monthly' | 'daily' | 'hourly';
  jobType: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  location: string;
  whatsappNumber: string;
  contactPhone: string;
  isFeatured: boolean;
  status: 'active' | 'expired' | 'pending';
  createdAt: string;
  viewsCount: number;
  applicantsCount: number;
  latitude?: number;
  longitude?: number;
}

export type JobCategory =
  | 'Retail & Sales'
  | 'Delivery & Logistics'
  | 'Restaurant, Cook & Waiter'
  | 'Office Assistant & Admin'
  | 'Teaching & Tutoring'
  | 'Driver & Logistics'
  | 'Construction, Electrician & Plumber'
  | 'Technical, IT & Customer Support'
  | 'Security Guard & Helper'
  | 'Tailoring & Household Help';

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  seekerId: string;
  seekerName: string;
  seekerPhone: string;
  seekerExperience: string;
  seekerSkills: string[];
  coverLetter?: string;
  status: 'applied' | 'shortlisted' | 'rejected' | 'contacted';
  aiMatchScore: number; // 0-100% computed via Gemini matching
  aiMatchAnalysis: string; // Brief reasoning computed via Gemini matching
  createdAt: string;
}

export interface Payment {
  id: string;
  employerId: string;
  amount: number;
  description: string;
  planId: 'single_post' | 'single_featured' | 'unlimited_monthly';
  jobId?: string; // Associated job ID if paying to list/feature
  razorpayOrderId: string;
  razorpayPaymentId: string;
  status: 'success' | 'failed';
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerPhone: string;
  referredPhone: string;
  status: 'pending' | 'joined';
  createdAt: string;
}

export interface SystemAnalytics {
  totalSeekers: number;
  totalEmployers: number;
  totalJobs: number;
  activeJobs: number;
  featuredJobs: number;
  totalRevenue: number;
  totalApplications: number;
}
