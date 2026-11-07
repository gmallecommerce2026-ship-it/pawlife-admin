export type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface OpeningHour {
  day: WeekDay;
  isOpen: boolean;
  openTime: string;  // "08:00"
  closeTime: string; // "17:30"
}

export interface ShelterProfile {
  id: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null; // Bổ sung
  bio: string | null; // Bổ sung
  shelterType: string | null; // Bổ sung
  latitude: number | null; // Bổ sung
  longitude: number | null; // Bổ sung
  address: string;
  phone: string;
  email: string;
  description: string;
  openingHours: OpeningHour[];
  website: string | null;   
  policy: string | null;
}

// Dùng khi submit form (logo xử lý riêng dưới dạng File để đẩy qua FormData)
export interface ShelterProfileFormValues {
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  openingHours: OpeningHour[];
  latitude?: number | null; 
  longitude?: number | null; 
  bio?: string;
  shelterType?: string;
  coverUrl?: string | null;
  website?: string;        
  policy?: string;        
}

export const WEEKDAY_LABEL: Record<WeekDay, string> = {
  MON: 'Thứ 2',
  TUE: 'Thứ 3',
  WED: 'Thứ 4',
  THU: 'Thứ 5',
  FRI: 'Thứ 6',
  SAT: 'Thứ 7',
  SUN: 'Chủ nhật',
};

export const defaultOpeningHours: OpeningHour[] = (
  ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as WeekDay[]
).map((day) => ({
  day,
  isOpen: day !== 'SUN',
  openTime: '08:00',
  closeTime: '17:30',
}));
