-- Fix logical inconsistency: Hospitals with STEMI service should have PCI capability
-- This script updates hospitals that have STEMI service but don't have PCI capability

-- Update hospitals with STEMI service to have PCI capability
UPDATE hospitals 
SET has_primary_pci = true,
    pci_lab_count = CASE 
        WHEN pci_lab_count = 0 THEN 1 
        ELSE pci_lab_count 
    END,
    pci_lab_24x7 = CASE 
        WHEN pci_lab_24x7 = false THEN true 
        ELSE pci_lab_24x7 
    END,
    has_pci_specialist = CASE 
        WHEN has_pci_specialist = false THEN true 
        ELSE has_pci_specialist 
    END
WHERE has_stemi_service = true AND has_primary_pci = false;

-- Add a check constraint to prevent this inconsistency in the future
-- Note: This constraint will be enforced at the application level since Prisma doesn't support complex constraints
