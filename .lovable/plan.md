

## Plan: Allow Past Start Times for Schedule Bookings

### Problem

The Schedule page prevents booking equipment with a start time in the past, even if the end time extends into the future. This blocks legitimate use cases like:
- Extending an ongoing session for several more days
- Booking equipment you just started using
- Correcting/adding a booking you forgot to make earlier

### Solution Options

**Option A: Remove the past-time restriction entirely (Simple)**
- Remove the validation at lines 360-368 in Schedule.tsx
- Allow any start time (past or future) as long as other validations pass
- Quick Add remains available for past-only usage records

**Option B: Allow past start times if end time is in the future (Recommended)**
- Modify the validation to check if the *end time* is in the future
- This allows "started in the past, continuing into the future" bookings
- Keeps strict validation for completely-past bookings (use Quick Add for those)

**Option C: Add a "Log Current Session" mode to Schedule**
- Add a toggle or option to indicate you're logging an ongoing session
- When enabled, skip the past-time validation
- More complex but most explicit about intent

### Recommended Solution: Option B

This is the most balanced approach - it allows your use case (continuing a process for several days) while still directing purely historical entries to Quick Add.

### Technical Changes

#### File: `src/pages/Schedule.tsx`

**Lines 360-368** - Replace current validation:

```typescript
// Current code:
if (startTime < new Date()) {
  toast.error("Cannot book equipment in the past");
  return;
}
```

**With:**

```typescript
// Allow past start times if the booking extends into the future
const endTime = addMinutes(startTime, parseInt(duration));
if (endTime < new Date()) {
  toast.error("Cannot create a booking that ends in the past. Use Quick Add for past usage.");
  return;
}
```

This change:
- Allows booking if start time is a few hours/days ago but end time is in the future
- Still prevents creating entirely-past bookings (redirects to Quick Add)
- No changes needed to edit flow (already allows editing past bookings)
- No changes to Quick Add (still handles past-only usage records)

### Testing Scenarios

After implementation, verify:
1. Can book equipment starting "yesterday" ending "tomorrow" - should work
2. Can book equipment starting "2 hours ago" ending "in 6 hours" - should work  
3. Can book equipment starting "yesterday" ending "yesterday" - should fail with message pointing to Quick Add
4. Future bookings continue to work normally
5. Quick Add still works for purely historical entries

