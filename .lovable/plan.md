

## Plan: Add Debug Logging and Minor Fix

### What I'll Do

Add a small console log statement to help debug the data loading and verify the combined bookings are working correctly. This is a minimal change that will trigger a GitHub push.

### Technical Change

**File: `src/pages/Index.tsx`**

Add a debug log after combining the bookings data (around line 108):

```typescript
// Combine both sources
const allBookings = [...transformedBookings, ...transformedUsageRecords];

// Debug: log combined data to verify both sources are loading
console.log('Dashboard data loaded:', {
  bookings: transformedBookings.length,
  usageRecords: transformedUsageRecords.length,
  total: allBookings.length
});
```

This will:
1. Trigger a new commit for GitHub sync
2. Help verify that both data sources are being loaded correctly
3. Show in the browser console how many records come from each source

