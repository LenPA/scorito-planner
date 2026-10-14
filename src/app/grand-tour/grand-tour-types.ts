export type StageType = 'flat' | 'hilly' | 'mountain' | 'time_trial' | 'gravel';

export interface Stage {
  stageNumber: number;
  date: string;
  startLocation: string;
  endLocation: string;
  distanceKm: number;
  stageType: StageType;
  difficulty: number; // 1 to 5 stars
  description?: string;
}

export type GrandTourId = 'giro' | 'tour' | 'vuelta';

export interface GrandTourInfo {
  id: GrandTourId;
  name: string;
  nickname: string;
  country: string;
  flag: string;
  accentColor: string;
  gradientClass: string;
  leaderJerseyName: string;
  pointsJerseyName: string;
  mountainJerseyName: string;
  youthJerseyName: string;
  stages: Stage[];
}

export interface ClassificationPick {
  position: number;
  riderId: number | null;
  points: number;
}

export interface TourClassificationPicks {
  general: { [position: number]: number | null }; // 1 to 20
  points: { [position: number]: number | null };  // 1 to 5
  mountain: { [position: number]: number | null }; // 1 to 5
  youth: { [position: number]: number | null };   // 1 to 5
}

export interface StageLineup {
  stageNumber: number;
  riderIds: number[]; // exactly up to 9 riders
  captainId: number | null; // 1 dagkopman
}
