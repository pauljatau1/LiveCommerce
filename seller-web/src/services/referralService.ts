import { API_CONFIG } from "@/config/constants";
import { apiService } from "@/services/apiService";

export interface ReferralOverviewStats {
  totalReferred: number;
  completedReferrals: number;
  totalEarned: number;
  totalGMV: number;
}

export interface ReferralOverviewData {
  referralCode: string;
  referralLink: string;
  milestone: string;
  stats: ReferralOverviewStats;
  walletBalance: number;
}

export interface Referee {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  registeredAt: string;
}

export interface LinkTarget {
  type: string;
  targetId: string | null;
}

export interface Referral {
  id: string;
  referee: Referee;
  status: 'pending' | 'completed' | 'expired';
  linkTarget: LinkTarget;
  expiresAt: string;
  completedAt: string | null;
  rewardIssued: boolean;
  orderValue: number;
  amountEarned: number;
  createdAt: string;
}

export interface ReferralReminders {
  day3Sent: boolean;
  day7Sent: boolean;
  manualSent: boolean;
  lastSentAt: string | null;
}

export interface ReferralDetail extends Referral {
  reminders: ReferralReminders;
}

export interface ReferralHistoryResponse {
  referrals: Referral[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const REFERRAL_ENDPOINTS = {
  overview: "/sellers/referral/overview",
  history: "/sellers/referral/history",
  detail: (id: string) => `/sellers/referral/${id}`,
  remind: (id: string) => `/sellers/referral/${id}/remind`,
  linkTarget: "/sellers/referral/link-target",
};

export const referralService = {
  /**
   * Get Referral Overview
   */
  async getOverview(): Promise<ReferralOverviewData> {
    const url = REFERRAL_ENDPOINTS.overview;
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.get<{ success: boolean; data: ReferralOverviewData }>(url, config);
    return response.data.data;
  },

  /**
   * Get Referral History
   */
  async getHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<ReferralHistoryResponse> {
    const url = REFERRAL_ENDPOINTS.history;
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
      params,
    };
    const response = await apiService.get<{ success: boolean; data: ReferralHistoryResponse }>(url, config);
    return response.data.data;
  },

  /**
   * Get Single Referral Detail
   */
  async getReferralDetail(referralId: string): Promise<ReferralDetail> {
    const url = REFERRAL_ENDPOINTS.detail(referralId);
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.get<{ success: boolean; data: ReferralDetail }>(url, config);
    return response.data.data;
  },

  /**
   * Remind Pending Referee
   */
  async remindReferee(referralId: string): Promise<{ success: boolean; message: string }> {
    const url = REFERRAL_ENDPOINTS.remind(referralId);
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.post<{ success: boolean; message: string }>(url, {}, config);
    return response;
  },

  /**
   * Update Link Target Dashboard Pref.
   */
  async updateLinkTarget(target: string, targetId: string | null): Promise<void> {
    const url = REFERRAL_ENDPOINTS.linkTarget;
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    await apiService.patch(url, { target, targetId }, config);
  }
};
