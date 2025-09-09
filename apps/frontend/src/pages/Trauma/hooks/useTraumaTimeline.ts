import { useState, useCallback } from 'react';
import { TraumaCase } from '../../../services/traumaService';
import { TimelineEvent } from '../../../components/Common/TimelineView';
import { TraumaService } from '../../../services/traumaService';

export const useTraumaTimeline = () => {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  const convertTraumaCasesToTimelineEvents = useCallback((cases: TraumaCase[]): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    cases.forEach(case_ => {
      // Patient arrival
      if (case_.createdAt) {
        events.push({
          id: `${case_.id}-arrival`,
          timestamp: case_.createdAt,
          title: `Patient Arrival - ${case_.patient?.firstName || 'Unknown'} ${case_.patient?.lastName || 'Patient'}`,
          description: `Patient arrived at ${case_.originHospital?.name || 'hospital'} via ${TraumaService.getModeOfArrivalLabel(case_.modeOfArrival)}`,
          type: 'arrival',
          status: 'completed',
          user: {
            name: case_.createdBy?.firstName ? `${case_.createdBy.firstName} ${case_.createdBy.lastName}` : 'System',
            role: 'Data Collector',
          },
          hospital: case_.originHospital ? {
            name: case_.originHospital.name,
            id: case_.originHospital.id,
          } : undefined,
          details: {
            modeOfArrival: case_.modeOfArrival,
            mechanismOfInjury: case_.mechanismOfInjury,
            chiefComplaint: case_.chiefComplaint,
            patientName: `${case_.patient?.firstName || 'Unknown'} ${case_.patient?.lastName || 'Patient'}`,
            patientNationalId: case_.patient?.nationalId || 'N/A',
          },
        });
      }

      // Assessment
      if (case_.glasgowComaScale) {
        events.push({
          id: `${case_.id}-assessment`,
          timestamp: case_.createdAt,
          title: `Glasgow Coma Scale Assessment - Score: ${case_.glasgowComaScale}`,
          description: `Initial neurological assessment completed`,
          type: 'assessment',
          status: 'completed',
          details: {
            glasgowComaScale: case_.glasgowComaScale,
            criticalCase: case_.criticalCase,
            patientName: `${case_.patient?.firstName || 'Unknown'} ${case_.patient?.lastName || 'Patient'}`,
            patientNationalId: case_.patient?.nationalId || 'N/A',
          },
        });
      }

      // Treatment/Disposition
      if (case_.edDisposition) {
        events.push({
          id: `${case_.id}-disposition`,
          timestamp: case_.updatedAt,
          title: `Disposition - ${TraumaService.getDispositionLabel(case_.edDisposition)}`,
          description: `Patient disposition determined`,
          type: 'treatment',
          status: 'completed',
          details: {
            disposition: case_.edDisposition,
            transferCase: case_.transferCase,
            patientName: `${case_.patient?.firstName || 'Unknown'} ${case_.patient?.lastName || 'Patient'}`,
            patientNationalId: case_.patient?.nationalId || 'N/A',
          },
        });
      }
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const updateTimelineEvents = useCallback((cases: TraumaCase[]) => {
    const events = convertTraumaCasesToTimelineEvents(cases);
    setTimelineEvents(events);
  }, [convertTraumaCasesToTimelineEvents]);

  return {
    timelineEvents,
    updateTimelineEvents,
    convertTraumaCasesToTimelineEvents
  };
};
