
// Color scheme - vibrant but professional
export const GRADIENT_COLORS = {
  view: 'linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)', // Vibrant blue
  create: 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)', // Vibrant green
  update: 'linear-gradient(135deg, #ffa726 0%, #ffb74d 100%)', // Vibrant orange
  delete: 'linear-gradient(135deg, #ef5350 0%, #e57373 100%)', // Vibrant red
  export: 'linear-gradient(135deg, #26a69a 0%, #4db6ac 100%)', // Vibrant teal
  search: 'linear-gradient(135deg, #29b6f6 0%, #4fc3f7 100%)', // Vibrant cyan
  primary: 'linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)', // Primary blue
};

export const getAccessTypeGradient = (accessType: string) => {
  switch (accessType) {
    case 'VIEW':
      return GRADIENT_COLORS.view;
    case 'CREATE':
      return GRADIENT_COLORS.create;
    case 'UPDATE':
      return GRADIENT_COLORS.update;
    case 'DELETE':
      return GRADIENT_COLORS.delete;
    case 'EXPORT':
      return GRADIENT_COLORS.export;
    case 'SEARCH':
      return GRADIENT_COLORS.search;
    default:
      return GRADIENT_COLORS.view;
  }
};

export const getAccessTypeColor = (accessType: string) => {
  switch (accessType) {
    case 'VIEW':
      return '#42a5f5';
    case 'CREATE':
      return '#66bb6a';
    case 'UPDATE':
      return '#ffa726';
    case 'DELETE':
      return '#ef5350';
    case 'EXPORT':
      return '#26a69a';
    case 'SEARCH':
      return '#29b6f6';
    default:
      return '#42a5f5';
  }
};
