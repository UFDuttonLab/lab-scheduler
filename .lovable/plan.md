

## Plan: Fix Dashboard to Include Usage Records

### Problem

The Dashboard (Index.tsx) only fetches data from the `bookings` table, but the Schedule page fetches from BOTH `bookings` AND `usage_records` tables and combines them. This means:

- **Schedule page**: Shows all records correctly (combining both tables)
- **Dashboard**: Missing all `usage_records` data, showing only `bookings`

Your current/active sessions are in the `usage_records` table:
- One record: 2026-01-30 to 2026-02-02 (currently in progress, ends in 3 days)
- Another: 2026-01-27 to 2026-01-30 (recently ended)

But the `bookings` table only has records up to 2026-01-29.

### Solution

Update `src/pages/Index.tsx` to fetch and combine data from both `bookings` and `usage_records` tables, exactly like the Schedule page does.

### Technical Changes

**File: `src/pages/Index.tsx`**

**Lines 37-89** - Update `fetchData` function to also fetch `usage_records`:

```typescript
const fetchData = async () => {
  try {
    setLoading(true);
    
    // Fetch all data including usage_records (like Schedule page does)
    const [equipmentRes, bookingsRes, usageRecordsRes, profilesRes, projectsRes] = await Promise.all([
      supabase.from('equipment').select('*'),
      supabase.from('bookings').select('*').order('start_time', { ascending: true }),
      supabase.from('usage_records').select('*').order('start_time', { ascending: true }),
      supabase.from('profiles').select('id, full_name, email, spirit_animal'),
      supabase.from('projects').select('id, name')
    ]);
    
    if (equipmentRes.error) throw equipmentRes.error;
    if (bookingsRes.error) throw bookingsRes.error;
    
    const equipmentData = equipmentRes.data;
    const bookingsData = bookingsRes.data || [];
    const usageRecordsData = usageRecordsRes.data || [];
    const profilesData = profilesRes.data;
    const projectsData = projectsRes.data;
    
    // Transform equipment data
    const transformedEquipment = equipmentData.map(eq => ({
      id: eq.id,
      name: eq.name,
      type: eq.type,
      status: eq.status,
      location: eq.location,
      description: eq.description || undefined,
      icon: eq.icon || undefined,
    }));
    
    // Transform bookings data
    const transformedBookings = bookingsData.map(booking => {
      const equipment = equipmentData.find(eq => eq.id === booking.equipment_id);
      const profile = profilesData?.find(p => p.id === booking.user_id);
      const project = projectsData?.find(p => p.id === booking.project_id);
      
      return {
        id: booking.id,
        equipmentId: booking.equipment_id,
        equipmentName: equipment?.name || "Unknown Equipment",
        studentName: profile?.full_name || "Unknown Student",
        studentEmail: profile?.email || "",
        studentSpiritAnimal: profile?.spirit_animal || undefined,
        startTime: new Date(booking.start_time),
        endTime: new Date(booking.end_time),
        duration: Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 60000),
        projectId: booking.project_id || undefined,
        projectName: project?.name || undefined,
        purpose: booking.purpose || undefined,
        status: booking.status,
        source: 'booking' as const,
      };
    });
    
    // Transform usage records to booking format (same approach as Schedule page)
    const transformedUsageRecords = usageRecordsData.map(record => {
      const equipment = equipmentData.find(eq => eq.id === record.equipment_id);
      const profile = profilesData?.find(p => p.id === record.user_id);
      const project = projectsData?.find(p => p.id === record.project_id);
      
      return {
        id: record.id,
        equipmentId: record.equipment_id,
        equipmentName: equipment?.name || "Unknown Equipment",
        studentName: profile?.full_name || "Unknown Student",
        studentEmail: profile?.email || "",
        studentSpiritAnimal: profile?.spirit_animal || undefined,
        startTime: new Date(record.start_time),
        endTime: new Date(record.end_time),
        duration: Math.round((new Date(record.end_time).getTime() - new Date(record.start_time).getTime()) / 60000),
        projectId: record.project_id || undefined,
        projectName: project?.name || undefined,
        purpose: record.notes || undefined,
        status: 'completed' as const, // Usage records are always completed
        source: 'usage_record' as const,
      };
    });
    
    // Combine both sources
    const allBookings = [...transformedBookings, ...transformedUsageRecords];
    
    setEquipment(transformedEquipment);
    setBookings(allBookings);
  } catch (error) {
    // ... existing error handling
  }
};
```

**Lines 145-160** - Also update the upcomingBookings filter to handle usage_records properly:

Usage records default to 'completed' status, but if their end_time is in the future, they should be treated as "in-progress". Update the filter:

```typescript
const upcomingBookings = bookings
  .filter(b => {
    // Exclude cancelled bookings
    if (b.status === "cancelled") return false;
    
    // For usage_records, check if end time is in the future (still ongoing)
    if (b.source === 'usage_record') {
      return b.endTime >= now;
    }
    
    // For regular bookings, exclude completed
    if (b.status === "completed") return false;
    
    // Include in-progress bookings
    if (b.status === "in-progress") return true;
    
    // Include scheduled bookings that haven't ended yet
    if (b.status === "scheduled" && b.endTime >= now) return true;
    
    return false;
  })
  .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  .slice(0, 5);
```

### Stats Cards Fixes

The same issue affects these calculations that will now work correctly with combined data:

1. **Today's Bookings** - Will include usage_records happening today
2. **Active Sessions** - Will include usage_records currently in progress
3. **Hours Booked This Week** - Will include usage_records this week

### Result

After this change:
- Dashboard will show the usage_record running from 2026-01-30 to 2026-02-02 in "Current & Upcoming"
- "Active Sessions" will show 1 (the ongoing usage record)
- "Hours Booked This Week" will correctly include usage_records
- "Today's Bookings" will correctly count records from both tables

