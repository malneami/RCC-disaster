export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export const getUserDisplayName = (user: User | null | undefined): string => {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
};

export const getUserInitials = (user: User | null | undefined): string => {
  if (!user) return '?';
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  return user.email[0].toUpperCase();
};
