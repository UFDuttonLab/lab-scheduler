

## Plan: Apply Dynamic Status Calculation to Schedule Page

### Problem

The Schedule page (`src/pages/Schedule.tsx`) has the same issue that was just fixed on the Dashboard:

1. **Line 255**: Regular bookings use the static database `status` value instead of calculating based on current time
2. **Line 292**: Usage records are hardcoded as `'completed'` even when currently in progress

Your Nanopore MK1D booking shows "Completed" because it's a `usage_record` that is hardcoded as completed, even though its time range indicates it's currently in progress.

### Solution

Apply the same dynamic time-based status calculation that was added to `Index.tsx`.

### Technical Changes

**File: `src/pages/Schedule.tsx`**

**Lines 230-264** - Update booking transformation to calculate status based on time:

Add dynamic status calculation before the return statement in the bookings map function:

```typescript
const transformedBookings: Booking[] = (bookingsRes.data || []).map((booking: any) => {
  const equipment = equipmentMap.get(booking.equipment_id);
  const project = booking.project_id ? projectMap.get(booking.project_id) : null;
  const profile = profileMap.get(booking.user_id);
  
  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  const now = new Date();
  
  // Calculate actual status based on time
  let calculatedStatus: "scheduled" | "in-progress" | "completed" | "cancelled" = booking.status;
  if (booking.status !== "cancelled") {
    if (endTime < now) {
      calculatedStatus = "completed";
    } else if (startTime <= now && endTime >= now) {
      calculatedStatus = "in-progress";
    } else {
      calculatedStatus = "scheduled";
    }
  }
  
  // ... rest of the transformation
  return {
    // ... other fields
    status: calculatedStatus,  // Use calculated status instead of booking.status
    // ...
  };
});
```

**Lines 267-299** - Update usage record transformation to calculate status based on time:

```typescript
const transformedUsageRecords: Booking[] = (usageRecordsRes.data || []).map((record: any) => {
  const equipment = equipmentMap.get(record.equipment_id);
  const project = record.project_id ? projectMap.get(record.project_id) : null;
  const profile = profileMap.get(record.user_id);
  
  const startTime = new Date(record.start_time);
  const endTime = new Date(record.end_time);
  const now = new Date();
  
  // Calculate actual status based on time
  let calculatedStatus: "scheduled" | "in-progress" | "completed" | "cancelled";
  if (endTime < now) {
    calculatedStatus = "completed";
  } else if (startTime <= now && endTime >= now) {
    calculatedStatus = "in-progress";
  } else {
    calculatedStatus = "scheduled";
  }
  
  // ... rest of the transformation
  return {
    // ... other fields
    status: calculatedStatus,  // Use calculated status instead of hardcoded 'completed'
    // ...
  };
});
```

### Result

After this change, the Schedule page will show:
- Your Nanopore MK1D booking as **"In Progress"** (yellow badge) since it's currently running
- Past sessions as **"Completed"** (green badge)
- Future sessions as **"Scheduled"** (blue badge)
- Cancelled bookings remain **"Cancelled"** (red badge)

Both the Dashboard and Schedule pages will now have consistent, dynamic status badges.

