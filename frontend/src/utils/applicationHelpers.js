import { Clock, Star, Briefcase, Trophy, XCircle } from 'lucide-react';

export const STAGES = [
  { key: 'Applied', label: 'Applied', icon: Clock, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { key: 'Shortlisted', label: 'Shortlisted', icon: Star, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { key: 'Interview', label: 'Interview', icon: Briefcase, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { key: 'Offer', label: 'Offer', icon: Trophy, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { key: 'Rejected', label: 'Rejected', icon: XCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' },
];

export const STATUS_STEPS = ['Applied', 'Shortlisted', 'Interview', 'Offer'];
export const ALL_STATUSES = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'];
