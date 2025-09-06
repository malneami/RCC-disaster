import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

import { StrokeCase, StrokeTimeline, StrokeService } from '../../../services/strokeService';
import CaseSelector from './StrokeTimelineView/CaseSelector';
import TimelineStepper from './StrokeTimelineView/TimelineStepper';

interface StrokeTimelineViewProps {
  cases: StrokeCase[];
}

const StrokeTimelineView: React.FC<StrokeTimelineViewProps> = ({ cases }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [timeline, setTimeline] = useState<StrokeTimeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCaseId) {
      loadTimeline(selectedCaseId);
    } else {
      setTimeline([]);
    }
  }, [selectedCaseId]);

  const loadTimeline = async (caseId: string) => {
    try {
      setLoading(true);
      setError(null);
      const timelineData = await StrokeService.getStrokeTimelineForCase(caseId);
      setTimeline(timelineData);
    } catch (err) {
      setError('Failed to load timeline data');
      console.error('Error loading timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId);
  };

  return (
    <Box>
      <CaseSelector
        cases={cases}
        selectedCaseId={selectedCaseId}
        onCaseSelect={handleCaseSelect}
      />

      {selectedCaseId && (
        <TimelineStepper
          timeline={timeline}
          loading={loading}
          error={error}
        />
      )}
    </Box>
  );
};

export default StrokeTimelineView;