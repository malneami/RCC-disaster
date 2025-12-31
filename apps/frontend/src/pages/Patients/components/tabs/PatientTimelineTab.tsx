import React from 'react';
import TimelineView, { TimelineEvent } from '../../../../components/Common/TimelineView';

interface PatientTimelineTabProps {
    timelineEvents: TimelineEvent[];
    loading: boolean;
    error?: string | null;
}

const PatientTimelineTab: React.FC<PatientTimelineTabProps> = ({
    timelineEvents,
    loading,
    error,
}) => {
    return (
        <TimelineView
            events={timelineEvents}
            portalType="stroke"
            title="Patients Timeline"
            showSearch={true}
            onSearch={(query, filter) => {
                // TODO: Implement timeline search functionality
                console.log('Timeline search:', query, filter);
            }}
            loading={loading}
            error={error || undefined}
        />
    );
};

export default PatientTimelineTab;
