
## Plan: Fix iPhone Compatibility for Zombie Game Unlock

### Root Cause

The issue is that on iPhone/mobile, the Edit and Delete buttons cover a significant portion of the card. When tapping the card:

1. The buttons have `stopPropagation()` on their click handlers (lines 68-69, 82-83)
2. On mobile, touch targets are larger than on desktop
3. When a user taps near the buttons (which takes up the bottom portion of the card), the tap is captured by the button's touch area, `stopPropagation()` fires, and the card's `onClick` (which tracks the secret sequence) never executes

This means on iPhone, users must tap very precisely on the upper portion of the card to register clicks for the secret sequence.

### Solution

Modify the click tracking to use the entire card area for the secret sequence, regardless of where the tap lands. This can be done by calling `onClick?.(equipment.name)` **before** the button's `stopPropagation()`, or by using a dedicated touch area at the top of the card.

### Technical Changes

**File: `src/components/EquipmentCard.tsx`**

Update the Edit and Delete button handlers to also call the `onClick` handler before stopping propagation:

```typescript
{onEdit && (
  <Button
    variant="outline"
    size="sm"
    onClick={(e) => {
      e.stopPropagation();
      onClick?.(equipment.name); // Track click for secret sequence
      onEdit(equipment);
    }}
    className="flex-1 min-h-[44px]"
  >
```

And similarly for the Delete button:

```typescript
{onDelete && (
  <Button
    variant="destructive"
    size="sm"
    onClick={(e) => {
      e.stopPropagation();
      onClick?.(equipment.name); // Track click for secret sequence
      onDelete(equipment);
    }}
    className="flex-1 min-h-[44px]"
  >
```

### Alternative Approach (Cleaner)

Instead of modifying button handlers, add a dedicated invisible touch layer at the top of the card that captures clicks for the secret sequence. But the simpler fix is to ensure button clicks also register for the sequence.

### Result

- Tapping anywhere on the equipment card (including Edit/Delete buttons) will register the click for the secret sequence
- The Edit/Delete buttons will still work normally
- The zombie game unlock will work consistently on all devices including iPhone
