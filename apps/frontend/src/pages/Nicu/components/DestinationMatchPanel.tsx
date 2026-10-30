import React, { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
} from '@mui/material';
import type { NicuLevel, NicuCotType } from '../../../services/neonatalTransferService';
import {
  nicuCapacityService,
  type NicuMatchCandidate,
} from '../../../services/nicuCapacityService';
import { NICU_LEVEL_LABELS, COT_TYPE_LABELS } from '../constants/nicuConstants';

interface Props {
  defaultLevel?: NicuLevel;
  defaultCotType?: NicuCotType;
  cluster?: string;
  onPick?: (c: NicuMatchCandidate) => void;
}

const LEVELS: NicuLevel[] = ['LEVEL_I', 'LEVEL_II', 'LEVEL_III'];
const COT_TYPES: NicuCotType[] = ['INCUBATOR', 'OPEN_WARMER', 'VENTILATED'];

const DestinationMatchPanel: React.FC<Props> = ({
  defaultLevel = 'LEVEL_II',
  defaultCotType = 'INCUBATOR',
  cluster,
  onPick,
}) => {
  const [level, setLevel] = useState<NicuLevel>(defaultLevel);
  const [cotType, setCotType] = useState<NicuCotType>(defaultCotType);
  const [matches, setMatches] = useState<NicuMatchCandidate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runMatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await nicuCapacityService.match({
        requiredNicuLevel: level,
        requiredCotType: cotType,
        cluster,
      });
      setMatches(res.matches);
    } catch (e) {
      setError('Failed to fetch matches.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Destination Match
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Required Level</InputLabel>
            <Select
              value={level}
              label="Required Level"
              onChange={(e) => setLevel(e.target.value as NicuLevel)}
            >
              {LEVELS.map((l) => (
                <MenuItem key={l} value={l}>
                  {NICU_LEVEL_LABELS[l].en}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Required Cot</InputLabel>
            <Select
              value={cotType}
              label="Required Cot"
              onChange={(e) => setCotType(e.target.value as NicuCotType)}
            >
              {COT_TYPES.map((c) => (
                <MenuItem key={c} value={c}>
                  {COT_TYPE_LABELS[c].en}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={runMatch} disabled={loading}>
            Find Destinations
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {matches && matches.length === 0 && (
          <Alert severity="warning">No facility currently has a matching vacant cot.</Alert>
        )}

        {matches && matches.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Facility</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell align="center">Fit</TableCell>
                  <TableCell align="right">Matching Cots</TableCell>
                  <TableCell align="right">Total Vacant</TableCell>
                  {onPick && <TableCell />}
                </TableRow>
              </TableHead>
              <TableBody>
                {matches.map((m) => (
                  <TableRow key={m.hospitalId}>
                    <TableCell>{m.hospitalName}</TableCell>
                    <TableCell>{m.nicuLevel ? NICU_LEVEL_LABELS[m.nicuLevel].en : '—'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        color={m.levelFit === 0 ? 'success' : 'info'}
                        label={m.levelFit === 0 ? 'Exact' : `+${m.levelFit}`}
                      />
                    </TableCell>
                    <TableCell align="right">{m.vacantOfRequiredCot}</TableCell>
                    <TableCell align="right">{m.totalVacant}</TableCell>
                    {onPick && (
                      <TableCell>
                        <Button size="small" onClick={() => onPick(m)}>
                          Select
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default DestinationMatchPanel;
