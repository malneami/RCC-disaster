
import {
    Visibility,
    Edit,
    Warning,
    Download,
    Search,
} from '@mui/icons-material';

export const getAccessTypeIcon = (accessType: string) => {
    switch (accessType) {
        case 'VIEW':
            return <Visibility fontSize="small" />;
        case 'CREATE':
        case 'UPDATE':
            return <Edit fontSize="small" />;
        case 'DELETE':
            return <Warning fontSize="small" />;
        case 'EXPORT':
            return <Download fontSize="small" />;
        case 'SEARCH':
            return <Search fontSize="small" />;
        default:
            return <Visibility fontSize="small" />;
    }
};
