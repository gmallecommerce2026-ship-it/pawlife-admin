// src/services/shelterService.ts
import { apiClient } from '@/lib/api/ApiClient';

export interface ShelterDashboardStats {
  stats: {
    availablePets: number;
    pendingApplications: number;
    adoptedCount: number;
    qrIssued: number;
  };
  adoptionTrend: { month: string; dogs: number; cats: number }[];
  petTypeDistribution: { name: string; value: number; color: string }[];
}

const unwrapItem = <T = any>(res: any): T => {
  if (res?.data !== undefined) return res.data;
  return res;
};

export const shelterService = {
  getDashboardStats: async (): Promise<ShelterDashboardStats> => {
    const res = await apiClient.get('/pets/shelter/dashboard');
    return unwrapItem(res);
  },
};