

## Plan: Show Current and Upcoming Bookings on Dashboard

### Problem

The "Upcoming Bookings" section on the dashboard currently only shows bookings that start in the future. It excludes bookings that are currently in progress (started earlier but still ongoing), which means users can't see what's happening right now.

### Current Code (lines 145-148)

```typescript
const upcomingBookings = bookings
  .filter(b => b.status === "scheduled" && b.startTime >= new Date())
  .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  .slice(0, 3);
```

### Solution

Update the filter to include:
1. **In-progress bookings** - status is "in-progress"
2. **Currently active scheduled bookings** - status is "scheduled", started in the past, but end time is still in the future
3. **Future scheduled bookings** - status is "scheduled" and start time is in the future

Also rename the section header to "Current & Upcoming Bookings" to better reflect what it shows.

### Technical Changes

**File: `src/pages/Index.tsx`**

**Lines 145-148** - Update the filter logic:

```typescript
const now = new Date(); // Already defined on line 113
const upcomingBookings = bookings
  .filter(b => {
    // Exclude cancelled and completed bookings
    if (b.status === "cancelled" || b.status === "completed") return false;
    
    // Include in-progress bookings
    if (b.status === "in-progress") return true;
    
    // Include scheduled bookings that haven't ended yet
    if (b.status === "scheduled" && b.endTime >= now) return true;
    
    return false;
  })
  .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  .slice(0, 5); // Increase to 5 to show more relevant bookings
```

**Line 210** - Update section header:

```typescript
<h2 className="text-xl sm:text-2xl font-bold">Current & Upcoming</h2>
```

### Result

After this change, the dashboard will show:
- Any booking currently in progress
- Any scheduled booking that hasn't ended yet (even if it started earlier)
- Sorted by start time so current sessions appear first
- Up to 5 bookings for better visibility

