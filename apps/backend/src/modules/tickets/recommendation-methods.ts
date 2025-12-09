  /**
   * Get recommended ambulances for a ticket with scoring
   */
  async getRecommendedAmbulances(ticketId: string): Promise<AmbulanceRecommendation[]> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        originHospital: true,
        destinationHospital: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!ticket.originHospital) {
      throw new BadRequestException('Ticket must have an origin hospital');
    }

    // Get all available ambulances
    const availableAmbulances = await this.prisma.ambulance.findMany({
      where: {
        isActive: true,
        status: { in: ['AVAILABLE', 'ON_STANDBY'] },
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });

    if (availableAmbulances.length === 0) {
      return [];
    }

    // Score each ambulance
    const recommendations = await Promise.all(
      availableAmbulances.map(amb => this.scoreAmbulance(amb, ticket))
    );

    // Sort by score (highest first)
    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Score an ambulance for a specific ticket
   */
  private async scoreAmbulance(
    ambulance: any,
    ticket: any
  ): Promise<AmbulanceRecommendation> {
    let score = 0;
    const factors: ScoreFactor[] = [];

    // 1. Distance Score (0-40 points)
    const distanceScore = await this.calculateDistanceScore(
      ambulance,
      ticket.originHospital
    );
    score += distanceScore.points;
    factors.push(distanceScore);

    // 2. Zone Familiarity Score (0-20 points)
    const familiarityScore = await this.calculateFamiliarityScore(
      ambulance.id,
      ticket.originHospitalId
    );
    score += familiarityScore.points;
    factors.push(familiarityScore);

    // 3. Current Zone Status Score (0-20 points)
    const zoneScore = await this.calculateZoneScore(
      ambulance.id,
      ticket.originHospitalId
    );
    score += zoneScore.points;
    factors.push(zoneScore);

    // 4. Recent Activity Score (0-10 points)
    const activityScore = await this.calculateActivityScore(ambulance.id);
    score += activityScore.points;
    factors.push(activityScore);

    // 5. Assignment History Score (0-10 points)
    const historyScore = await this.calculateHistoryScore(ambulance.id);
    score += historyScore.points;
    factors.push(historyScore);

    // Get additional metadata
    const zoneHistory = await this.getRecentZoneHistory(
      ambulance.id,
      ticket.originHospitalId
    );

    const estimatedArrival = await this.estimateArrival(
      ambulance,
      ticket.originHospital
    );

    const lastGPSUpdate = await this.getLastGPSUpdate(ambulance.id);

    const recentAssignments = await this.getRecentAssignmentCount(ambulance.id);

    return {
      ambulance: {
        id: ambulance.id,
        callSign: ambulance.callSign,
        plateNumber: ambulance.plateNumber,
        type: ambulance.type,
        status: ambulance.status,
        currentLocationLat: ambulance.currentLocationLat,
        currentLocationLng: ambulance.currentLocationLng,
        driver: ambulance.driver,
      },
      score,
      factors,
      estimatedArrivalMinutes: estimatedArrival,
      distanceKm: distanceScore.distance,
      zoneHistory,
      lastGPSUpdate,
      recentAssignments,
    };
  }

  /**
   * Calculate distance score (0-40 points)
   */
  private async calculateDistanceScore(
    ambulance: any,
    originHospital: any
  ): Promise<ScoreFactor & { distance: number | null }> {
    if (!ambulance.currentLocationLat || !ambulance.currentLocationLng) {
      return {
        name: 'Distance',
        points: 0,
        maxPoints: 40,
        description: 'No GPS location available',
        distance: null,
      };
    }

    if (!originHospital.latitude || !originHospital.longitude) {
      return {
        name: 'Distance',
        points: 0,
        maxPoints: 40,
        description: 'Hospital location not available',
        distance: null,
      };
    }

    const distance = this.calculateHaversineDistance(
      ambulance.currentLocationLat,
      ambulance.currentLocationLng,
      originHospital.latitude,
      originHospital.longitude
    );

    let points = 0;
    let description = '';

    if (distance < 1) {
      points = 40;
      description = `Very close (${distance.toFixed(2)} km)`;
    } else if (distance < 3) {
      points = 30;
      description = `Close (${distance.toFixed(2)} km)`;
    } else if (distance < 5) {
      points = 20;
      description = `Moderate distance (${distance.toFixed(2)} km)`;
    } else if (distance < 10) {
      points = 10;
      description = `Far (${distance.toFixed(2)} km)`;
    } else {
      points = 0;
      description = `Very far (${distance.toFixed(2)} km)`;
    }

    return {
      name: 'Distance',
      points,
      maxPoints: 40,
      description,
      distance,
    };
  }

  /**
   * Calculate zone familiarity score (0-20 points)
   */
  private async calculateFamiliarityScore(
    ambulanceId: string,
    hospitalId: string
  ): Promise<ScoreFactor> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentVisits = await this.prisma.ambulanceZoneLog.count({
      where: {
        ambulanceId,
        hospitalId,
        entryTime: { gte: sevenDaysAgo },
      },
    });

    const monthlyVisits = await this.prisma.ambulanceZoneLog.count({
      where: {
        ambulanceId,
        hospitalId,
        entryTime: { gte: thirtyDaysAgo },
      },
    });

    let points = 0;
    let description = '';

    if (recentVisits > 0) {
      points = 20;
      description = `Visited ${recentVisits} time(s) in last 7 days`;
    } else if (monthlyVisits > 0) {
      points = 10;
      description = `Visited ${monthlyVisits} time(s) in last 30 days`;
    } else {
      points = 0;
      description = 'Never visited this hospital';
    }

    return {
      name: 'Zone Familiarity',
      points,
      maxPoints: 20,
      description,
    };
  }

  /**
   * Calculate current zone status score (0-20 points)
   */
  private async calculateZoneScore(
    ambulanceId: string,
    hospitalId: string
  ): Promise<ScoreFactor> {
    // Check if currently in the zone
    const currentZone = await this.prisma.ambulanceZoneLog.findFirst({
      where: {
        ambulanceId,
        hospitalId,
        exitTime: null,
      },
    });

    if (currentZone) {
      return {
        name: 'Current Zone',
        points: 20,
        maxPoints: 20,
        description: 'Currently in origin hospital zone',
      };
    }

    // Check if in a nearby zone
    const nearbyZone = await this.prisma.ambulanceZoneLog.findFirst({
      where: {
        ambulanceId,
        exitTime: null,
      },
      include: {
        hospital: true,
      },
    });

    if (nearbyZone) {
      return {
        name: 'Current Zone',
        points: 10,
        maxPoints: 20,
        description: `Currently in ${nearbyZone.hospital.name} zone`,
      };
    }

    return {
      name: 'Current Zone',
      points: 0,
      maxPoints: 20,
      description: 'Not in any hospital zone',
    };
  }

  /**
   * Calculate activity score (0-10 points)
   */
  private async calculateActivityScore(ambulanceId: string): Promise<ScoreFactor> {
    const latestGPS = await this.prisma.gPSTrackingLog.findFirst({
      where: { ambulanceId },
      orderBy: { timestamp: 'desc' },
    });

    if (!latestGPS) {
      return {
        name: 'Recent Activity',
        points: 0,
        maxPoints: 10,
        description: 'No GPS data available',
      };
    }

    const ageMinutes = (Date.now() - latestGPS.timestamp.getTime()) / 60000;

    let points = 0;
    let description = '';

    if (ageMinutes < 5) {
      points = 10;
      description = 'Very recent GPS update (<5 mins)';
    } else if (ageMinutes < 15) {
      points = 5;
      description = 'Recent GPS update (<15 mins)';
    } else {
      points = 0;
      description = `GPS update ${Math.round(ageMinutes)} mins ago`;
    }

    return {
      name: 'Recent Activity',
      points,
      maxPoints: 10,
      description,
    };
  }

  /**
   * Calculate assignment history score (0-10 points)
   */
  private async calculateHistoryScore(ambulanceId: string): Promise<ScoreFactor> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentAssignments = await this.prisma.eMSAssignment.count({
      where: {
        ambulanceId,
        assignedAt: { gte: last24Hours },
      },
    });

    const completedAssignments = await this.prisma.eMSAssignment.count({
      where: {
        ambulanceId,
        assignedAt: { gte: last24Hours },
        status: AssignmentStatus.ARRIVED,
      },
    });

    let points = 0;
    let description = '';

    if (recentAssignments === 0) {
      points = 10;
      description = 'No recent assignments (well-rested)';
    } else if (recentAssignments <= 2) {
      points = 8;
      description = `${recentAssignments} assignment(s) in last 24h`;
    } else if (recentAssignments <= 5) {
      points = 5;
      description = `${recentAssignments} assignments in last 24h`;
    } else {
      points = 0;
      description = `${recentAssignments} assignments in last 24h (busy)`;
    }

    // Bonus for high completion rate
    if (recentAssignments > 0) {
      const completionRate = completedAssignments / recentAssignments;
      if (completionRate >= 0.8) {
        description += ' • High success rate';
      }
    }

    return {
      name: 'Assignment History',
      points,
      maxPoints: 10,
      description,
    };
  }

  /**
   * Get recent zone history for an ambulance at a specific hospital
   */
  private async getRecentZoneHistory(
    ambulanceId: string,
    hospitalId: string
  ): Promise<ZoneVisitSummary | null> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const visits = await this.prisma.ambulanceZoneLog.findMany({
      where: {
        ambulanceId,
        hospitalId,
        entryTime: { gte: thirtyDaysAgo },
      },
      include: {
        hospital: true,
      },
      orderBy: { entryTime: 'desc' },
      take: 5,
    });

    if (visits.length === 0) {
      return null;
    }

    const totalVisits = visits.length;
    const lastVisit = visits[0];
    const avgDuration =
      visits
        .filter(v => v.durationMinutes !== null)
        .reduce((sum, v) => sum + (v.durationMinutes || 0), 0) /
      Math.max(visits.filter(v => v.durationMinutes !== null).length, 1);

    return {
      hospitalId,
      hospitalName: lastVisit.hospital.name,
      totalVisits,
      lastVisitDate: lastVisit.entryTime,
      avgDurationMinutes: Math.round(avgDuration),
      recentVisits: visits.map(v => ({
        entryTime: v.entryTime,
        exitTime: v.exitTime,
        durationMinutes: v.durationMinutes,
        zoneType: v.zoneType,
      })),
    };
  }

  /**
   * Estimate arrival time in minutes
   */
  private async estimateArrival(
    ambulance: any,
    originHospital: any
  ): Promise<number | null> {
    if (!ambulance.currentLocationLat || !ambulance.currentLocationLng) {
      return null;
    }

    if (!originHospital.latitude || !originHospital.longitude) {
      return null;
    }

    const distance = this.calculateHaversineDistance(
      ambulance.currentLocationLat,
      ambulance.currentLocationLng,
      originHospital.latitude,
      originHospital.longitude
    );

    // Assume average speed of 40 km/h in city
    const avgSpeedKmh = 40;
    const estimatedMinutes = (distance / avgSpeedKmh) * 60;

    return Math.round(estimatedMinutes);
  }

  /**
   * Get last GPS update timestamp
   */
  private async getLastGPSUpdate(ambulanceId: string): Promise<Date | null> {
    const latestGPS = await this.prisma.gPSTrackingLog.findFirst({
      where: { ambulanceId },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    });

    return latestGPS?.timestamp || null;
  }

  /**
   * Get count of recent assignments
   */
  private async getRecentAssignmentCount(ambulanceId: string): Promise<number> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return await this.prisma.eMSAssignment.count({
      where: {
        ambulanceId,
        assignedAt: { gte: last24Hours },
      },
    });
  }

  /**
   * Calculate distance using Haversine formula
   */
  private calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const EARTH_RADIUS_KM = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
