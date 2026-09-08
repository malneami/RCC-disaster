import React from 'react';
import { Box, Paper, Typography, CircularProgress, Alert, Chip, useTheme, Button, Card, CardContent, Grid } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import {
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';

import { Hospital, HospitalFilters } from '../../services/hospitalService';
import type { DisasterIncident } from '../../services/disasterService';
import { getIncidentTypeLabel } from '../../services/disasterService';
import HospitalDetailDrawer from './components/HospitalDetailDrawer';
import CreateHospitalDialog from './components/CreateHospitalDialog';
import UpdateCapacityDialog from './components/UpdateCapacityDialog';
import FilterDialog from './components/FilterDialog';
import GenericTabs from '../../components/Common/GenericTabs';

import { HospitalsHeader } from './components/view/HospitalsHeader';
import { HospitalsMetrics } from './components/view/HospitalsMetrics';
import { HospitalCard } from './components/view/HospitalCard';
import { useHospitalsView } from './hooks/useHospitalsView';

const COLOR_MAP: Record<string, string> = {
  RED: '#DC2626',
  YELLOW: '#D97706',
  GREEN: '#059669',
  BLACK: '#374151',
};

interface HospitalsPageProps {
  hospitals: Hospital[];
  loading: boolean;
  error: string | null;
  tabValue: number;
  selectedHospital: Hospital | null;
  filters: HospitalFilters;
  dialogStates: {
    createDialogOpen: boolean;
    updateCapacityDialogOpen: boolean;
    filterDialogOpen: boolean;
  };
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onUpdateCapacity: (hospital: Hospital) => void;
  onViewDashboard: (hospitalId: string) => void;
  onCreateHospital: (hospitalData: any) => void;
  onDeleteHospital: (hospitalId: string) => void;
  onUpdateCapacitySubmit: (hospitalId: string, capacityData: any) => void;
  onApplyFilters: (filters: HospitalFilters) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onDialogClose: (dialogType: string) => void;
  onDialogOpen: (dialogType: string) => void;
  incidents?: DisasterIncident[];
  loadingIncidents?: boolean;
  onRefreshIncidents?: () => void;
  onViewDisasterManagement?: () => void;
}

const HospitalsPage: React.FC<HospitalsPageProps> = ({
  hospitals,
  loading,
  error,
  tabValue,
  selectedHospital,
  filters,
  dialogStates,
  onTabChange,
  onUpdateCapacity,
  onViewDashboard,
  onCreateHospital,
  onDeleteHospital,
  onUpdateCapacitySubmit,
  onApplyFilters,
  onResetFilters,
  onRefresh,
  onDialogClose,
  onDialogOpen,
  incidents = [],
  loadingIncidents = false,
  onRefreshIncidents,
  onViewDisasterManagement,
}) => {
  const theme = useTheme();

  const {
    searchQuery,
    setSearchQuery,
    setStatusFilter,
    selectedHospitalForDrawer,
    drawerOpen,
    setDrawerOpen,
    stats,
    filteredHospitals,
    handleCardClick,
    filterChips,
    getChipStyles,
  } = useHospitalsView(hospitals);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Hospital Management | MASAR</title>
      </Helmet>

      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#f8fafc',
          pb: 4,
        }}
      >
        <HospitalsHeader
          totalHospitals={stats.total}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={onRefresh}
          onAddHospital={() => onDialogOpen('create')}
        />

        {error && (
          <Alert severity="error" sx={{ mx: 4, mt: 2 }}>
            {error}
          </Alert>
        )}

        <GenericTabs
          tabs={[
            {
              label: 'Hospitals',
              icon: <HospitalIcon />,
              content: (
                <Box>
                  <HospitalsMetrics stats={stats} />
                  <Box sx={{ px: { xs: 2, md: 4 }, py: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1.5, sm: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Filter:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {filterChips.map((f) => (
                          <Chip
                            key={f.key}
                            label={f.label}
                            size="small"
                            onClick={() => setStatusFilter(f.key)}
                            sx={getChipStyles(f.key, f.color)}
                          />
                        ))}
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', ml: { xs: 0, sm: 'auto' } }}>
                      Showing {filteredHospitals.length} of {hospitals.length} hospitals
                    </Typography>
                  </Box>
                  <Box sx={{ px: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredHospitals.length === 0 ? (
                      <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                        <HospitalIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.secondary">No hospitals found</Typography>
                      </Paper>
                    ) : (
                      filteredHospitals.map((hospital) => (
                        <HospitalCard
                          key={hospital.id}
                          hospital={hospital}
                          isSelected={selectedHospitalForDrawer?.id === hospital.id}
                          onClick={() => handleCardClick(hospital)}
                          onDelete={() => onDeleteHospital(hospital.id)}
                        />
                      ))
                    )}
                  </Box>
                </Box>
              ),
            },
            {
              label: 'Disaster Incidents',
              icon: <FontAwesomeIcon icon={faExclamationTriangle} />,
              content: (
                <Box>
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Incidents by destination hospital
                    </Typography>
                    {onViewDisasterManagement && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FontAwesomeIcon icon={faExternalLinkAlt} />}
                        onClick={onViewDisasterManagement}
                      >
                        Disaster Management
                      </Button>
                    )}
                  </Box>
                  {loadingIncidents ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : (() => {
                    const byHospital = new Map<string, { hospital: { id: string; name: string }; incidents: DisasterIncident[] }>();
                    for (const inc of incidents) {
                      for (const a of inc.ambulanceAssignments || []) {
                        const h = a.destinationHospital;
                        if (h) {
                          if (!byHospital.has(h.id)) byHospital.set(h.id, { hospital: h, incidents: [] });
                          const entry = byHospital.get(h.id)!;
                          if (!entry.incidents.find((i) => i.id === inc.id)) entry.incidents.push(inc);
                        }
                      }
                    }
                    const entries = Array.from(byHospital.values()).sort((a, b) => a.hospital.name.localeCompare(b.hospital.name));
                    if (entries.length === 0) {
                      return (
                        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                          <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: 48, color: theme.palette.text.disabled, marginBottom: 8 }} />
                          <Typography color="text.secondary">No disaster incidents with assigned hospitals</Typography>
                          {onRefreshIncidents && (
                            <Button size="small" sx={{ mt: 2 }} onClick={onRefreshIncidents}>
                              Refresh
                            </Button>
                          )}
                        </Paper>
                      );
                    }
                    return (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {entries.map(({ hospital, incidents: incs }) => (
                          <Box key={hospital.id}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                              {hospital.name}
                            </Typography>
                            <Grid container spacing={2}>
                              {incs.map((inc) => (
                                <Grid item xs={12} sm={6} md={4} key={inc.id}>
                                  <Card sx={{ borderLeft: `4px solid ${COLOR_MAP[inc.colorCode || 'YELLOW'] || '#D97706'}`, cursor: 'pointer' }} onClick={onViewDisasterManagement}>
                                    <CardContent>
                                      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                                        <Chip label={inc.disasterScope ? `[${inc.disasterScope}] ${getIncidentTypeLabel(inc.incidentType)}` : getIncidentTypeLabel(inc.incidentType)} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                                        {inc.colorCode && (
                                          <Chip label={inc.colorCode} size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: COLOR_MAP[inc.colorCode], color: '#fff' }} />
                                        )}
                                      </Box>
                                      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                        {inc.locationAddress || `${inc.locationLat?.toFixed(4)}, ${inc.locationLng?.toFixed(4)}`}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        {inc.createdAt ? format(new Date(inc.createdAt), 'dd/MM/yyyy HH:mm') : '—'}
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                        {[
                                          { key: 'G', cat: 'GREEN', count: inc.estimatedGreen ?? 0 },
                                          { key: 'Y', cat: 'YELLOW', count: inc.estimatedYellow ?? 0 },
                                          { key: 'R', cat: 'RED', count: inc.estimatedRed ?? 0 },
                                          { key: 'B', cat: 'BLACK', count: inc.estimatedBlack ?? 0 },
                                        ].map(({ key, cat, count }) => (
                                          <Typography key={cat} variant="caption" component="span" sx={{ color: COLOR_MAP[cat], fontWeight: 600 }}>
                                            {key}:{count}
                                          </Typography>
                                        ))}
                                      </Box>
                                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                        {(inc.ambulanceAssignments || []).filter((a) => a.destinationHospital?.id === hospital.id).length} ambulance(s) → this hospital
                                      </Typography>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        ))}
                      </Box>
                    );
                  })()}
                </Box>
              ),
            },
          ]}
          value={tabValue}
          onChange={onTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        />
      </Box>

      {/* Side Drawer */}
      <HospitalDetailDrawer
        hospital={selectedHospitalForDrawer}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateCapacity={onUpdateCapacity}
        onViewDashboard={onViewDashboard}
      />

      {/* Dialogs */}
      <CreateHospitalDialog
        open={dialogStates.createDialogOpen}
        onClose={() => onDialogClose('create')}
        onSubmit={onCreateHospital}
      />

      <UpdateCapacityDialog
        open={dialogStates.updateCapacityDialogOpen}
        hospital={selectedHospital}
        onClose={() => onDialogClose('updateCapacity')}
        onSubmit={onUpdateCapacitySubmit}
      />



      <FilterDialog
        open={dialogStates.filterDialogOpen}
        filters={filters}
        onClose={() => onDialogClose('filter')}
        onApply={onApplyFilters}
        onReset={onResetFilters}
      />
    </>
  );
};

export default HospitalsPage;
