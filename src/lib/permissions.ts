export type AppRole = 'pi' | 'pi_external' | 'postdoc' | 'grad_student' | 'undergrad_student' | 'manager' | 'user';

export interface RolePermissions {
  canManageUsers: boolean;
  canManageProjects: boolean;
  canManageEquipment: boolean;
  canManageBookings: boolean;
  canViewAnalytics: boolean;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  pi: 'Principal Investigator',
  pi_external: 'External PI',
  postdoc: 'Post-Doc',
  grad_student: 'Graduate Student',
  undergrad_student: 'Undergraduate Student',
  manager: 'Manager',
  user: 'User'
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  pi: 'Full access to all features including user management',
  pi_external: 'External professor - can manage projects, equipment, and bookings',
  postdoc: 'Can manage projects, equipment, and bookings',
  grad_student: 'Can manage projects, equipment, and bookings',
  undergrad_student: 'Can create and manage their own bookings',
  manager: 'Legacy role with full access',
  user: 'Basic access to create bookings'
};

export const getRolePermissions = (role: AppRole | null): RolePermissions => {
  switch (role) {
    case 'pi':
    case 'manager':
      return {
        canManageUsers: true,
        canManageProjects: true,
        canManageEquipment: true,
        canManageBookings: true,
        canViewAnalytics: true,
      };
    case 'pi_external':
    case 'postdoc':
    case 'grad_student':
      return {
        canManageUsers: false,
        canManageProjects: true,
        canManageEquipment: true,
        canManageBookings: true,
        canViewAnalytics: true,
      };
    case 'undergrad_student':
    case 'user':
      return {
        canManageUsers: false,
        canManageProjects: false,
        canManageEquipment: false,
        canManageBookings: true,
        canViewAnalytics: false,
      };
    default:
      return {
        canManageUsers: false,
        canManageProjects: false,
        canManageEquipment: false,
        canManageBookings: true,
        canViewAnalytics: false,
      };
  }
};
