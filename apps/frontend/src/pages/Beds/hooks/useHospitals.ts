import { useState, useEffect } from 'react';
import { hospitalService } from '../../../services/hospitalService';

export const useHospitals = (enabled: boolean = true) => {
  const [hospitals, setHospitals] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchHospitals = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await hospitalService.getAllHospitals();
        setHospitals(data.map(h => ({ id: h.id, name: h.name })));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch hospitals');
        setHospitals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, [enabled]);

  return { hospitals, loading, error };
};

