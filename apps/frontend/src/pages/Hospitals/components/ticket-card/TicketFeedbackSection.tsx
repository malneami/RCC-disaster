import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  Typography,
  Collapse,
  IconButton,
  Paper,
  Rating,
  Divider,
  Stack,
} from '@mui/material';
import {
  Feedback as FeedbackIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { UnifiedTicket } from '../../types/tickets';
import { caseFeedbackService, CaseFeedback } from '../../../../services/caseFeedbackService';
import { CaseFeedbackForm } from '../feedback/CaseFeedbackForm';

interface TicketFeedbackSectionProps {
  ticket: UnifiedTicket;
  onFeedbackSubmitted?: () => void;
}

export const TicketFeedbackSection: React.FC<TicketFeedbackSectionProps> = ({
  ticket,
  onFeedbackSubmitted,
}) => {
  const [feedback, setFeedback] = useState<CaseFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [ticket.id]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      // Fetch all feedback and filter for this specific ticket
      const response = await caseFeedbackService.getAll({
        page: 1,
        limit: 100,
      });
      
      // Find feedback for this specific ticket ID
      const ticketFeedback = response.items.find((f: any) => f.ticketId === ticket.id);
      setFeedback(ticketFeedback || null);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      setFeedback(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSuccess = () => {
    setFormOpen(false);
    fetchFeedback();
    onFeedbackSubmitted?.();
  };

  // Don't show for non-transfer tickets or pending tickets
  if (ticket.type !== 'TRANSFER') {
    return null;
  }

  const isCompleted = ticket.status === 'COMPLETED';
  const hasFeedback = feedback !== null;
  const needsFeedback = isCompleted && !hasFeedback;

  return (
    <>
      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <FeedbackIcon fontSize="small" color={hasFeedback ? 'success' : 'action'} />
            <Typography variant="subtitle2" fontWeight="medium">
              Case Feedback
            </Typography>
            {hasFeedback && (
              <CheckCircleIcon fontSize="small" color="success" />
            )}
            {needsFeedback && (
              <Chip
                label="Pending"
                size="small"
                color="warning"
                icon={<WarningIcon />}
              />
            )}
          </Box>

          <Box display="flex" gap={1}>
            {!hasFeedback && isCompleted && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => setFormOpen(true)}
              >
                Submit Feedback
              </Button>
            )}
            {hasFeedback && (
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Feedback Summary */}
        <Collapse in={expanded && hasFeedback}>
          {feedback && (
            <Paper
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Stack spacing={2}>
                {/* Reviewer Info */}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Reviewed by
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {feedback.reviewerName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(feedback.reviewDate), 'MMM dd, yyyy')}
                  </Typography>
                </Box>

                <Divider />

                {/* RCC Coordination Rating */}
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    RCC Coordination Quality
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Rating value={feedback.rccCoordinationRating} readOnly size="small" />
                    <Typography variant="body2" fontWeight="medium">
                      {feedback.rccCoordinationRating}/5
                    </Typography>
                  </Box>
                </Box>

                {/* Key Evaluations */}
                {(feedback.activationAppropriateness ||
                  feedback.destinationAppropriateness ||
                  feedback.transportSafety ||
                  feedback.patientOutcome) && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      Key Evaluations
                    </Typography>
                    <Stack spacing={0.5}>
                      {feedback.activationAppropriateness && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption">Activation:</Typography>
                          <Chip
                            label={feedback.activationAppropriateness.replace(/_/g, ' ')}
                            size="small"
                            color={
                              feedback.activationAppropriateness === 'FULLY_APPROPRIATE'
                                ? 'success'
                                : feedback.activationAppropriateness === 'NOT_APPROPRIATE'
                                ? 'error'
                                : 'warning'
                            }
                          />
                        </Box>
                      )}
                      {feedback.destinationAppropriateness && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption">Destination:</Typography>
                          <Chip
                            label={feedback.destinationAppropriateness.replace(/_/g, ' ')}
                            size="small"
                            color={
                              feedback.destinationAppropriateness === 'FULLY_APPROPRIATE'
                                ? 'success'
                                : feedback.destinationAppropriateness === 'NOT_APPROPRIATE'
                                ? 'error'
                                : 'warning'
                            }
                          />
                        </Box>
                      )}
                      {feedback.transportSafety && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption">Transport:</Typography>
                          <Chip
                            label={feedback.transportSafety.replace(/_/g, ' ')}
                            size="small"
                            color={
                              feedback.transportSafety === 'FULLY_SAFE_AND_APPROPRIATE'
                                ? 'success'
                                : feedback.transportSafety === 'NOT_SAFE_OR_INAPPROPRIATE'
                                ? 'error'
                                : 'warning'
                            }
                          />
                        </Box>
                      )}
                      {feedback.patientOutcome && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption">Outcome:</Typography>
                          <Chip
                            label={feedback.patientOutcome.replace(/_/g, ' ')}
                            size="small"
                            color={
                              feedback.patientOutcome === 'OPTIMAL'
                                ? 'success'
                                : feedback.patientOutcome === 'MORTALITY' ||
                                  feedback.patientOutcome === 'SEVERE_COMPLICATION'
                                ? 'error'
                                : 'warning'
                            }
                          />
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Additional Comments */}
                {feedback.additionalComments && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Comments
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        "{feedback.additionalComments}"
                      </Typography>
                    </Box>
                  </>
                )}

                {/* Status */}
                <Box display="flex" justifyContent="flex-end">
                  <Chip
                    label={feedback.status}
                    size="small"
                    color={
                      feedback.status === 'SUBMITTED'
                        ? 'success'
                        : feedback.status === 'REVIEWED'
                        ? 'info'
                        : 'default'
                    }
                  />
                </Box>
              </Stack>
            </Paper>
          )}
        </Collapse>
      </Box>

      {/* Feedback Form Dialog */}
      {formOpen && (
        <CaseFeedbackForm
          ticket={ticket}
          open={formOpen}
          onSuccess={handleFeedbackSuccess}
          onCancel={() => setFormOpen(false)}
        />
      )}
    </>
  );
};

