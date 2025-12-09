// Ambulance Recommendation Types

export interface ScoreFactor {
  name: string;
  points: number;
  maxPoints: number;
  description: string;
}

export interface ZoneVisitSummary {
  hospitalId: string;
  hospitalName: string;
  totalVisits: number;
  lastVisitDate: Date | null;
  avgDurationMinutes: number;
  recentVisits: Array<{
    entryTime: Date;
    exitTime: Date | null;
    durationMinutes: number | null;
    zoneType: string;
  }>;
}

export interface AmbulanceRecommendation {
  ambulance: {
    id: string;
    callSign: string;
    plateNumber: string;
    type: string;
    status: string;
    currentLocationLat: number | null;
    currentLocationLng: number | null;
    driver: any;
  };
  score: number;
  factors: ScoreFactor[];
  estimatedArrivalMinutes: number | null;
  distanceKm: number | null;
  zoneHistory: ZoneVisitSummary | null;
  lastGPSUpdate: Date | null;
  recentAssignments: number;
}
