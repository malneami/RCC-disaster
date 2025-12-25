/**
 * Format Utility Functions
 * User-friendly formatting for database values
 */

// ===== Status Formatting =====

/**
 * Formats STEMI status codes to user-friendly labels
 */
export const formatStemiStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
        'SUSPECTED': 'Suspected',
        'ECG_PENDING': 'ECG Pending',
        'STEMI_CONFIRMED': 'STEMI Confirmed',
        'NSTEMI_CONFIRMED': 'NSTEMI Confirmed',
        'UNSTABLE_ANGINA': 'Unstable Angina',
        'RCC_ACTIVATED': 'RCC Activated',
        'IN_TRANSIT': 'In Transit',
        'PCI_READY': 'PCI Ready',
        'BALLOON_INFLATED': 'Balloon Inflated',
        'CCU_ADMITTED': 'CCU Admitted',
        'DISCHARGED': 'Discharged',
        'EXPIRED': 'Expired',
    };
    return statusMap[status] || status?.replace(/_/g, ' ') || 'Unknown';
};

/**
 * Formats stroke status codes to user-friendly labels
 */
export const formatStrokeStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
        'SUSPECTED': 'Suspected Stroke',
        'CONFIRMED_ISCHEMIC': 'Ischemic Stroke',
        'CONFIRMED_HEMORRHAGIC': 'Hemorrhagic Stroke',
        'TIA': 'Transient Ischemic Attack',
        'IN_TREATMENT': 'In Treatment',
        'DISCHARGED': 'Discharged',
        'TRANSFERRED': 'Transferred',
    };
    return statusMap[status] || status?.replace(/_/g, ' ') || 'Unknown';
};

// ===== Mode of Arrival Formatting =====

/**
 * Formats mode of arrival codes to user-friendly labels
 */
export const formatModeOfArrival = (mode?: string): string => {
    if (!mode) return 'Not specified';

    const modeMap: Record<string, string> = {
        'AMBULANCE_RED_CRESCENT': 'Red Crescent Ambulance',
        'PRIVATE_CAR': 'Private Vehicle',
        'TRANSFERRED_FROM_ANOTHER_HOSPITAL': 'Hospital Transfer',
        'WALK_IN': 'Walk-in',
        'POLICE': 'Police Transport',
        'HELICOPTER': 'Air Ambulance',
        'AMBULANCE': 'Ambulance',
    };
    return modeMap[mode] || mode?.replace(/_/g, ' ') || 'Not specified';
};

// ===== ECG Result Formatting =====

/**
 * Formats ECG result codes to user-friendly labels
 */
export const formatEcgResult = (result?: string): string => {
    if (!result) return 'Pending';

    const resultMap: Record<string, string> = {
        'NORMAL': 'Normal',
        'STEMI_ANTERIOR': 'STEMI - Anterior',
        'STEMI_INFERIOR': 'STEMI - Inferior',
        'STEMI_LATERAL': 'STEMI - Lateral',
        'STEMI_POSTERIOR': 'STEMI - Posterior',
        'NSTEMI_CHANGES': 'NSTEMI Changes',
        'UNSTABLE_PATTERN': 'Unstable Pattern',
        'PENDING': 'Pending',
        'OTHER_ABNORMALITY': 'Other Abnormality',
    };
    return resultMap[result] || result?.replace(/_/g, ' ') || 'Pending';
};

// ===== Treatment Formatting =====

/**
 * Formats treatment codes to user-friendly labels
 */
export const formatTreatment = (treatment?: string): string => {
    if (!treatment) return 'Not specified';

    const treatmentMap: Record<string, string> = {
        'PRIMARY_PCI': 'Primary PCI',
        'RESCUE_PCI': 'Rescue PCI',
        'NON_PRIMARY_PCI': 'Non-Primary PCI',
        'FIBRINOLYSIS': 'Fibrinolysis',
        'TRANSFER_FOR_PRIMARY_PCI': 'Transfer for PCI',
        'MEDICAL_MANAGEMENT': 'Medical Management',
        'CONSERVATIVE': 'Conservative Treatment',
    };
    return treatmentMap[treatment] || treatment?.replace(/_/g, ' ') || 'Not specified';
};

// ===== PCI Type Formatting =====

/**
 * Formats PCI type codes to user-friendly labels
 */
export const formatPciType = (pciType?: string): string => {
    if (!pciType) return 'Not specified';

    const pciMap: Record<string, string> = {
        'PRIMARY': 'Primary PCI',
        'NON_PRIMARY': 'Non-Primary PCI',
        'RESCUE_PCI': 'Rescue PCI',
        'ELECTIVE': 'Elective PCI',
    };
    return pciMap[pciType] || pciType?.replace(/_/g, ' ') || 'Not specified';
};

// ===== Outcome Formatting =====

/**
 * Formats outcome codes to user-friendly labels
 */
export const formatOutcome = (outcome?: string): string => {
    if (!outcome) return 'Pending';

    const outcomeMap: Record<string, string> = {
        'TRANSFERRED_TO_PCI_CAPABLE_HOSPITAL': 'Transferred for PCI',
        'DAMA_FROM_ED': 'Left Against Medical Advice (ED)',
        'DISCHARGED_ALIVE': 'Discharged Alive',
        'DAMA': 'Left Against Medical Advice',
        'STILL_ADMITTED': 'Still Admitted',
        'DIED': 'Deceased',
    };
    return outcomeMap[outcome] || outcome?.replace(/_/g, ' ') || 'Pending';
};

// ===== Case Type Formatting =====

/**
 * Formats case type codes to user-friendly labels
 */
export const formatCaseType = (caseType?: string): string => {
    if (!caseType) return 'Not specified';

    const typeMap: Record<string, string> = {
        'DIRECT': 'Direct Admission',
        'TRANSFER': 'Transfer Case',
    };
    return typeMap[caseType] || caseType?.replace(/_/g, ' ') || 'Not specified';
};

// ===== Gender Formatting =====

/**
 * Formats gender codes to user-friendly labels
 */
export const formatGender = (gender?: string): string => {
    if (!gender) return 'Not specified';

    const genderMap: Record<string, string> = {
        'MALE': 'Male',
        'FEMALE': 'Female',
    };
    return genderMap[gender] || gender || 'Not specified';
};

// ===== Timestamp Formatting =====

/**
 * Formats ISO timestamp to user-friendly format
 * Format: DD MMM YYYY, HH:mm (e.g., 28 Jan 2026, 10:24)
 * @param timestamp - ISO date string
 * @param options - Formatting options
 * @returns Formatted date string
 */
export const formatTimestamp = (
    timestamp?: string | null,
    options: {
        includeTime?: boolean;
        dateOnly?: boolean;
    } = {}
): string => {
    if (!timestamp) return '—';

    const { includeTime = true, dateOnly = false } = options;

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '—';

    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    const dateStr = `${day} ${month} ${year}`;

    if (dateOnly || !includeTime) {
        return dateStr;
    }

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${dateStr}, ${hours}:${minutes}`;
};

/**
 * Formats timestamp to time only
 */
export const formatTimeOnly = (timestamp?: string | null): string => {
    if (!timestamp) return 'Not recorded';

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid time';

    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Calculates and formats time ago from timestamp
 */
export const formatTimeAgo = (timestamp?: string | null): string => {
    if (!timestamp) return 'Unknown';

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatTimestamp(timestamp, { includeTime: false, dateOnly: true });
};

// ===== Duration Formatting =====

/**
 * Formats duration in minutes to user-friendly format
 */
export const formatDuration = (minutes?: number | null): string => {
    if (minutes === null || minutes === undefined) return 'Not recorded';

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;

    if (remainingMins === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMins}m`;
};

// ===== Boolean Formatting =====

/**
 * Formats boolean to Yes/No
 */
export const formatBoolean = (value?: boolean | null): string => {
    if (value === null || value === undefined) return 'Not specified';
    return value ? 'Yes' : 'No';
};

// ===== National ID Formatting =====

/**
 * Formats national ID with dashes for readability
 */
export const formatNationalId = (nationalId?: string | null): string => {
    if (!nationalId) return 'Not provided';

    // Format as XXX-XXXX-XXXX
    if (nationalId.length === 10) {
        return nationalId.replace(/(\d{3})(\d{4})(\d{3})/, '$1-$2-$3');
    }
    // Format as XXX-XXXX-XXXX for 11 digits
    if (nationalId.length === 11) {
        return nationalId.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }

    return nationalId;
};

// ===== Phone Formatting =====

/**
 * Formats phone number for display
 */
export const formatPhoneNumber = (phone?: string | null): string => {
    if (!phone) return 'Not provided';

    // Clean the phone number
    const cleaned = phone.replace(/\D/g, '');

    // Saudi phone format: +966 XX XXX XXXX
    if (cleaned.length === 12 && cleaned.startsWith('966')) {
        return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }

    // 10 digit format: 05X XXX XXXX
    if (cleaned.length === 10 && cleaned.startsWith('05')) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }

    return phone;
};

// ===== General Formatting =====

/**
 * Converts SNAKE_CASE to Title Case
 */
export const snakeCaseToTitleCase = (str?: string | null): string => {
    if (!str) return 'Not specified';
    return str
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Formats a value with a fallback for empty/null values
 */
export const formatValue = (value: any, fallback = 'Not specified'): string => {
    if (value === null || value === undefined || value === '') {
        return fallback;
    }
    return String(value);
};
