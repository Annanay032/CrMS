import { z } from 'zod';
import { faPalette, faBuilding, faBriefcase, faShieldHalved, faUserTie } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export const API_BASE = '/api';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['CREATOR', 'BRAND', 'AGENCY', 'ADMIN']),
  inviteCode: z.string().optional(),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
});

export type RegisterForm = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export interface RoleOption {
  value: 'CREATOR' | 'BRAND' | 'AGENCY' | 'ADMIN';
  label: string;
  icon: IconDefinition;
  desc: string;
  requiresInvite?: boolean;
}

export const ROLE_OPTIONS: RoleOption[] = [
  { value: 'CREATOR', label: 'Creator', icon: faPalette, desc: 'Content creator or influencer' },
  { value: 'BRAND', label: 'Brand', icon: faBuilding, desc: 'Business or product brand' },
  { value: 'AGENCY', label: 'Agency', icon: faBriefcase, desc: 'Talent or marketing agency' },
  { value: 'ADMIN', label: 'Admin', icon: faShieldHalved, desc: 'Platform administrator', requiresInvite: true },
];

export const STATS = [
  { value: '10K+', label: 'Active Creators' },
  { value: '2K+', label: 'Brand Partners' },
  { value: '50K+', label: 'Campaigns Run' },
  { value: '95%', label: 'Match Accuracy' },
];

export const SSO_PROVIDERS = [
  { id: 'google', label: 'Google', href: `${API_BASE}/auth/google` },
  { id: 'microsoft', label: 'Microsoft', href: `${API_BASE}/auth/microsoft` },
  { id: 'okta', label: 'Company SSO', href: `${API_BASE}/auth/okta` },
];
