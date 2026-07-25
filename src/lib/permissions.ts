export type AppRole = 'pi' | 'pi_external' | 'postdoc' | 'grad_student' | 'undergrad_student' | 'manager' | 'user';

/**
 * IMPORTANT: every flag here mirrors a specific Postgres RLS policy. Postgres is the
 * authority; this file only decides what the UI offers. If you change a flag, change the
 * matching policy in the same commit - otherwise the UI offers an action the database
 * silently refuses, and (because Supabase returns error:null for a zero-row write) the
 * user gets a success message for something that never happened.
 */
export interface RolePermissions {
  /** Mirrors: the manage-users edge function, which requires role pi or manager. */
  canManageUsers: boolean;
  /** Mirrors projects RLS: has_any_role(pi, postdoc, grad_student, manager, pi_external). */
  canManageProjects: boolean;
  /** Mirrors equipment RLS: the above plus undergrad_student. */
  canManageEquipment: boolean;
  /**
   * Can edit OTHER people's bookings. Mirrors bookings UPDATE:
   *   USING (user_id = auth.uid() OR has_any_role(pi, postdoc, grad_student, manager))
   * Everyone can always edit their own booking regardless of this flag, so this must NOT
   * be used as a blanket "can edit any booking" check.
   */
  canManageBookings: boolean;
  /**
   * Can hard-delete a booking. Mirrors bookings DELETE: USING (has_role(auth.uid(), 'pi')).
   * PI only - `manager` deliberately cannot delete bookings. Everyone else cancels instead.
   */
  canDeleteBookings: boolean;
  /**
   * Can read every activity_logs row. Mirrors activity_logs SELECT:
   *   has_any_role(pi, postdoc, grad_student, manager, pi_external)
   * Deliberately excludes undergrad_student, which canViewAnalytics does not.
   */
  canViewAllActivityLogs: boolean;
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
  undergrad_student: 'Can manage equipment, projects, and create bookings',
  manager: 'Legacy role with full access',
  user: 'Basic access to create bookings'
};

export const getRolePermissions = (role: AppRole | null): RolePermissions => {
  switch (role) {
    case 'pi':
      return {
        canManageUsers: true,
        canManageProjects: true,
        canManageEquipment: true,
        canManageBookings: true,
        canDeleteBookings: true,
        canViewAllActivityLogs: true,
        canViewAnalytics: true,
      };
    case 'manager':
      return {
        canManageUsers: true,
        canManageProjects: true,
        canManageEquipment: true,
        canManageBookings: true,
        // The bookings DELETE policy is has_role(auth.uid(), 'pi') - manager is not included.
        canDeleteBookings: false,
        canViewAllActivityLogs: true,
        canViewAnalytics: true,
      };
    case 'pi_external':
      return {
        canManageUsers: false,
        canManageProjects: true,
        canManageEquipment: true,
        // pi_external is absent from the bookings UPDATE policy.
        canManageBookings: false,
        canDeleteBookings: false,
        canViewAllActivityLogs: true,
        canViewAnalytics: true,
      };
    case 'postdoc':
    case 'grad_student':
      return {
        canManageUsers: false,
        canManageProjects: true,
        canManageEquipment: true,
        canManageBookings: true,
        canDeleteBookings: false,
        canViewAllActivityLogs: true,
        canViewAnalytics: true,
      };
    case 'undergrad_student':
      return {
        canManageUsers: false,
        // undergrad_student is in the equipment policy but NOT the projects policy
        // (migration 20260202204759 added it to equipment/equipment_projects only).
        canManageProjects: false,
        canManageEquipment: true,
        // undergrad_student is absent from the bookings UPDATE policy.
        canManageBookings: false,
        canDeleteBookings: false,
        // undergrad_student is absent from the activity_logs "view all" policy.
        canViewAllActivityLogs: false,
        canViewAnalytics: true,
      };
    case 'user':
    default:
      return {
        canManageUsers: false,
        canManageProjects: false,
        canManageEquipment: false,
        canManageBookings: false,
        canDeleteBookings: false,
        canViewAllActivityLogs: false,
        canViewAnalytics: false,
      };
  }
};
