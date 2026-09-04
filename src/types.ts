export interface Plant {
  id: string;
  name: string;
  species: string;
  location: string; // e.g., "阳台 (Balcony)", "客厅 (Living Room)", "办公室 (Office)"
  imageUrl?: string;
  imagePosition?: string; // CSS object-position values: "center", "top", "bottom", etc.
  
  // Care intervals in days
  waterInterval: number;
  fertilizeInterval: number;
  pestInterval: number;
  
  // Dates in YYYY-MM-DD
  lastWatered: string;
  lastFertilized: string;
  lastPestControl: string;
  
  healthStatus: 'healthy' | 'warning' | 'dormant'; // "健康", "需注意", "休眠"
  petSafety?: 'safe' | 'toxic'; // "宠物安全" 或 "宠物有毒"
  petSafetyNotes?: string; // 宠物安全或毒性说明，例如："对猫狗有毒，误食易起胃部不适、呕吐。"
  notes: string;
  createdAt: string;
}

export interface CareTask {
  id: string;
  plantId: string;
  plantName: string;
  plantImageUrl?: string;
  type: 'water' | 'fertilize' | 'pest';
  dueDate: string;
  daysRemaining: number;
  isOverdue: boolean;
}

export interface CareLog {
  id: string;
  plantId: string;
  plantName: string;
  type: 'water' | 'fertilize' | 'pest';
  date: string; // YYYY-MM-DD HH:mm:ss or YYYY-MM-DD
  notes: string;
}

export interface CarePlanRecommendation {
  species: string;
  waterInterval: number;
  fertilizeInterval: number;
  pestInterval: number;
  tips: string[];
  pestMeasures: string;
  sunlightNeed: string;
}

export interface GrowthRecord {
  id: string;
  plantId: string;
  date: string; // YYYY-MM-DD
  imageUrl: string; // Base64 or Unsplash URL
  note: string;
  height?: number; // cm
  title?: string;
}

