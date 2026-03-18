import { z } from 'zod';
import { faPalette, faBuilding, faBriefcase } from '@fortawesome/free-solid-svg-icons';
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
  role: z.enum(['CREATOR', 'BRAND', 'AGENCY']),
});

export type RegisterForm = z.infer<typeof registerSchema>;

export interface RoleOption {
  value: 'CREATOR' | 'BRAND' | 'AGENCY';
  label: string;
  icon: IconDefinition;
  desc: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  { value: 'CREATOR', label: 'Creator', icon: faPalette, desc: 'Content creator or influencer' },
  { value: 'BRAND', label: 'Brand', icon: faBuilding, desc: 'Business or product brand' },
  { value: 'AGENCY', label: 'Agency', icon: faBriefcase, desc: 'Talent or marketing agency' },
];

export const STATS = [
  { value: '10K+', label: 'Active Creators' },
  { value: '2K+', label: 'Brand Partners' },
  { value: '50K+', label: 'Campaigns Run' },
  { value: '95%', label: 'Match Accuracy' },
];
