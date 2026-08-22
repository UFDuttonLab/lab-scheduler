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
  /**
   * Purely a UI affordance - Analytics reads bookings (SELECT is open to every
   * authenticated user) and usage_records (own rows, or all rows for elevated roles).
   * There is no single policy this mirrors, so an undergrad_student sees the page but its
   * usage_records figures cover only their own sessions.
   */
  canViewAnalytics: boolean;
  /**
   * Can read OTHER people's usage records. Mirrors usage_records SELECT:
   *   USING (user_id = auth.uid()
   *          OR has_any_role(pi, postdoc, grad_student, manager, pi_external))
   * Note undergrad_student is absent from that array while it IS present in the equipment
   * ALL policy - so an undergrad can delete a machine but cannot see most of the usage
   * records the delete will cascade away. Anything that counts usage records before a
   * destructive action must say so rather than imply the figure is complete.
   */
  canViewAllUsageRecords: boolean;
  /**
   * Can create and edit the skill CATALOG - categories, skills, checklist items, tracks.
   * Mirrors the skills / skill_categories / skill_checklist_items / skill_tracks ALL
   * policies: has_any_role(pi, postdoc, grad_student, manager, pi_external).
   * Note this is the canonical 5-role elevated set, NOT the 6-role set used by equipment -
   * undergrad_student is deliberately excluded so a trainee cannot edit the definition of
   * the skill they are being assessed on.
   */
  canManageSkillCatalog: boolean;
  /**
   * Purely a UI affordance: whether to offer the "Sign someone off" button at all. The real
   * authority is PER SKILL and lives in can_sign_off_skill(auth.uid(), skill_id) - a grad
   * student who is a trainer on FLX-21 can sign FLX-21 and nothing else. This flag must NOT
   * be used as a blanket "can sign anything" check; the page computes the actual signable
   * list from the user's own trainer rows.
   */
  canSignOffSomeSkills: boolean;
  /**
   * Can mint new trainers, and can flip the Skills module from hidden to lab-wide.
   * Mirrors can_grant_trainer() and the skill_module_settings UPDATE policy, both
   * has_any_role(pi, manager).
   */
  canAdminSkillsModule: boolean;
  /**
   * Can create and own an undergraduate position listing. Mirrors the
   * recruiting_positions INSERT policy:
   *   WITH CHECK (mentor_id = auth.uid()
   *               AND has_any_role(pi, postdoc, grad_student, manager, pi_external))
   * This is the canonical 5-role elevated set. undergrad_student is deliberately absent -
   * setting a listing to 'open' publishes it on the public internet under the lab's name,
   * and an undergraduate being mentored should not be able to do that.
   */
  canManageRecruitingPositions: boolean;
  /**
   * Purely a UI affordance: whether to offer the #/review queue at all. The real authority
   * is PER APPLICATION and lives in recruiting_can_review(auth.uid(), application_id) - a
   * mentor sees exactly the applications that ranked one of their own listings. This flag
   * must NOT be read as "can see all applications"; the page shows whatever RLS returns,
   * which for someone who owns no listing is an empty queue.
   *
   * It tracks canManageRecruitingPositions because owning a listing is what puts
   * applications in front of you. The one gap: if a PI reassigns a listing's mentor_id to
   * an undergrad_student, the database would let that person review it but this flag hides
   * the page. Widen this and the position INSERT policy together if that ever happens.
   */
  canReviewApplications: boolean;
  /**
   * Can open and close recruiting cycles, edit the recruiting project list, edit ANY
   * mentor's listing, and archive-and-delete a closed cycle's applications.
   * Mirrors has_role(auth.uid(), 'pi') in the recruiting_cycles / recruiting_projects
   * "PI can manage" policies and in the applications DELETE policy.
   *
   * NOTE this is PI ONLY, where the rest of this file pairs pi with manager. That is
   * deliberate and is the one place this module departs from the repo's convention:
   * applications hold applicants' personal statements and contact details, `manager` is
   * described in ROLE_DESCRIPTIONS as a legacy full-access role, and no account currently
   * holds it. If a manager is ever appointed and needs this, change the policies and this
   * flag in the same commit.
   */
  canAdminRecruiting: boolean;
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
        canViewAllUsageRecords: true,
        canManageSkillCatalog: true,
        canSignOffSomeSkills: true,
        canAdminSkillsModule: true,
        canManageRecruitingPositions: true,
        canReviewApplications: true,
        canAdminRecruiting: true,
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
        canViewAllUsageRecords: true,
        canManageSkillCatalog: true,
        canSignOffSomeSkills: true,
        canAdminSkillsModule: true,
        canManageRecruitingPositions: true,
        canReviewApplications: true,
        // Not the PI. `manager` is in the recruiting_positions INSERT policy but not in
        // the PI-only policies on cycles, projects and the archive delete.
        canAdminRecruiting: false,
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
        canViewAllUsageRecords: true,
        canManageSkillCatalog: true,
        canSignOffSomeSkills: true,
        // Only pi and manager appear in can_grant_trainer().
        canAdminSkillsModule: false,
        canManageRecruitingPositions: true,
        canReviewApplications: true,
        canAdminRecruiting: false,
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
        canViewAllUsageRecords: true,
        canManageSkillCatalog: true,
        canSignOffSomeSkills: true,
        canAdminSkillsModule: false,
        canManageRecruitingPositions: true,
        canReviewApplications: true,
        canAdminRecruiting: false,
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
        canViewAllUsageRecords: false,
        // undergrad_student is in the equipment ALL policy but deliberately NOT in the
        // skills one - a trainee must not edit the skill they are assessed on.
        canManageSkillCatalog: false,
        // true only means "show the button"; it is empty unless they hold a trainer row.
        canSignOffSomeSkills: true,
        canAdminSkillsModule: false,
        // Absent from the recruiting_positions INSERT policy - see the flag's comment.
        canManageRecruitingPositions: false,
        canReviewApplications: false,
        canAdminRecruiting: false,
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
        canViewAllUsageRecords: false,
        canManageSkillCatalog: false,
        canSignOffSomeSkills: false,
        canAdminSkillsModule: false,
        canManageRecruitingPositions: false,
        canReviewApplications: false,
        canAdminRecruiting: false,
      };
  }
};
