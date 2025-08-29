import { Typography, Box, Card, CardContent } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAmbulance } from '@fortawesome/free-solid-svg-icons';
import { Helmet } from 'react-helmet-async';

const TraumaPortal: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Trauma Portal - RCC Healthcare Platform</title>
      </Helmet>
      
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FontAwesomeIcon icon={faAmbulance} style={{ marginRight: '16px', color: '#0288d1', fontSize: '32px' }} />
          <Box>
            <Typography variant="h4" component="h1">
              Trauma Portal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Critical trauma case management and emergency response coordination
            </Typography>
          </Box>
        </Box>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Trauma Network Coordination
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Advanced trauma care coordination portal for managing critical cases,
              trauma center capabilities, and multi-disciplinary response teams.
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Features in development:
              </Typography>
              <ul>
                <li>Trauma severity scoring</li>
                <li>Surgical team availability</li>
                <li>Blood bank coordination</li>
                <li>Inter-facility trauma transfers</li>
              </ul>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default TraumaPortal;