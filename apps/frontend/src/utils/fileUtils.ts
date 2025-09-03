export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const isPdfFile = (blob: Blob): boolean => {
  return blob.type === 'application/pdf';
};

export const validatePdfContent = async (blob: Blob): Promise<boolean> => {
  try {
    // Check if the blob starts with PDF magic number
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // PDF files start with "%PDF-"
    const pdfHeader = [0x25, 0x50, 0x44, 0x46, 0x2D]; // "%PDF-"
    
    for (let i = 0; i < pdfHeader.length; i++) {
      if (uint8Array[i] !== pdfHeader[i]) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating PDF content:', error);
    return false;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};
