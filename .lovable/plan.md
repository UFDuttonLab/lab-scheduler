

## Plan: Allow Undergrad Students to Manage Equipment

### Overview
This change will give undergraduate students the ability to add, edit, and delete equipment, matching the permissions that graduate students currently have.

### Changes Required

**1. Frontend Permissions (`src/lib/permissions.ts`)**

Move `undergrad_student` from the restricted group to have equipment management access:

- Change `canManageEquipment` from `false` to `true` for undergrad students
- Also grant `canViewAnalytics` so they can see usage data for equipment they manage
- Update the role description to reflect the new capabilities

**2. Database Security Policies**

Update two RLS policies to include `undergrad_student`:

- **equipment table**: Add `undergrad_student` to the "manage" policy
- **equipment_projects table**: Add `undergrad_student` to the "manage" policy

---

### Technical Details

**File: `src/lib/permissions.ts`**

```typescript
// Update ROLE_DESCRIPTIONS
undergrad_student: 'Can manage equipment and create bookings',

// Update getRolePermissions - move undergrad_student to the elevated group
case 'pi_external':
case 'postdoc':
case 'grad_student':
case 'undergrad_student':  // ← Add here
  return {
    canManageUsers: false,
    canManageProjects: true,
    canManageEquipment: true,
    canManageBookings: true,
    canViewAnalytics: true,
  };
```

**Database Migration**

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Only PI, Post-Docs, Grad Students, and External PIs can manage " ON public.equipment;
DROP POLICY IF EXISTS "Only PI, Post-Docs, Grad Students, and External PIs can manage " ON public.equipment_projects;

-- Create updated policies including undergrad_student
CREATE POLICY "Elevated roles can manage equipment" ON public.equipment
FOR ALL TO authenticated
USING (has_any_role(auth.uid(), ARRAY[
  'pi'::app_role, 
  'postdoc'::app_role, 
  'grad_student'::app_role, 
  'manager'::app_role, 
  'pi_external'::app_role,
  'undergrad_student'::app_role
]));

CREATE POLICY "Elevated roles can manage equipment projects" ON public.equipment_projects
FOR ALL TO authenticated
USING (has_any_role(auth.uid(), ARRAY[
  'pi'::app_role, 
  'postdoc'::app_role, 
  'grad_student'::app_role, 
  'manager'::app_role, 
  'pi_external'::app_role,
  'undergrad_student'::app_role
]));
```

### Result

After this change, undergraduate students will be able to:
- Access the Equipment page
- Add new equipment
- Edit existing equipment
- Delete equipment
- View analytics

