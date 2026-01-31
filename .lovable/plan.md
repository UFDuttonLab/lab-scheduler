

## Plan: Fix Status Badges with Dynamic Time-Based Calculation

### Problem

Status badges show incorrect information:
- Usage records hardcoded as "completed" even when currently in progress
- Regular bookings use static database values that don't reflect actual time

### Solution

Calculate status dynamically when transforming data based on current time.

### Technical Changes

**File: `src/pages/Index.tsx`**

**Update booking transformation (lines 59-81):**

Add time-based status calculation for bookings:

```typescript
const startTime = new Date(booking.start_time);
const endTime = new Date(booking.end_time);
const now = new Date();

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

// Use calculatedStatus instead of booking.status
```

**Update usage record transformation (lines 83-105):**

Same logic for usage records:

```typescript
const startTime = new Date(record.start_time);
const endTime = new Date(record.end_time);
const now = new Date();

let calculatedStatus: "scheduled" | "in-progress" | "completed" | "cancelled";
if (endTime < now) {
  calculatedStatus = "completed";
} else if (startTime <= now && endTime >= now) {
  calculatedStatus = "in-progress";
} else {
  calculatedStatus = "scheduled";
}

// Use calculatedStatus instead of hardcoded 'completed'
```

### Result

- Currently running sessions show **"In Progress"** (yellow badge)
- Past sessions show **"Completed"** (green badge)
- Future sessions show **"Scheduled"** (blue badge)
- Cancelled bookings remain **"Cancelled"** (red badge)

