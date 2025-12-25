// Enhanced Crew Assignment Types

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
  lastVisitDate: string | null;
  avgDurationMinutes: number;
  recentVisits: Array<{
    entryTime: string;
    exitTime: string | null;
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
  etaToOrigin: number | null;
  etaToDestination: number | null;
  distanceKm: number | null;
  zoneHistory: ZoneVisitSummary | null;
  lastGPSUpdate: string | null;
  recentAssignments: number;
  zoneLogs: AmbulanceZoneLog[];
}

export interface AmbulanceZoneLog {
  id: string;
  ambulanceId: string;
  hospitalId: string;
  zoneType: string;
  entryTime: string;
  exitTime: string | null;
  durationMinutes: number | null;
}
