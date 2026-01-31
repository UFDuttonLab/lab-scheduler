

## Plan: Fix Zombie Game Unlock for Both Desktop and iPhone

### Problem

The iPhone fix I just implemented broke desktop functionality. Here's what's happening:

**Before the fix:**
- Card body click → registers for sequence ✓
- Edit/Delete buttons → `stopPropagation()` prevents sequence registration ✓
- iPhone issue: touch targets on buttons are larger, intercepting taps meant for the card

**After the fix:**
- Card body click → registers for sequence ✓
- Edit/Delete buttons → NOW ALSO register for sequence ✗
- This pollutes the sequence on desktop (clicking Edit on any equipment adds to the sequence)

### Solution

Create a **dedicated clickable area** at the top of the card (the icon and equipment name section) that explicitly handles the secret sequence. This area will:
1. Have its own `onClick` handler that calls `onClick?.(equipment.name)`
2. Be large enough to tap easily on mobile
3. Not interfere with the Edit/Delete buttons

The buttons will **only** do their specific actions without affecting the sequence.

### Technical Changes

**File: `src/components/EquipmentCard.tsx`**

1. **Remove** `onClick?.(equipment.name)` from Edit and Delete button handlers (revert my previous change)

2. **Add a dedicated clickable area** for the equipment name/icon section:

```typescript
<Card 
  className={cn(
    "p-4 sm:p-6 hover:shadow-md transition-all animate-fade-in",
    onSelect && "hover:border-primary cursor-pointer"
  )}
  onClick={() => onSelect?.(equipment)}  // Only for selection, not secret sequence
>
  {/* Dedicated clickable area for secret sequence */}
  <div 
    className="flex items-start justify-between gap-2 sm:gap-3 mb-4 cursor-pointer"
    onClick={(e) => {
      e.stopPropagation();  // Prevent double-firing with card onClick
      onClick?.(equipment.name);  // Register for secret sequence
      onSelect?.(equipment);
    }}
  >
    {/* Icon and name content... */}
  </div>
  
  {/* Rest of card content... */}
  
  {(onEdit || onDelete) && (
    <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
      {onEdit && (
        <Button
          onClick={(e) => {
            e.stopPropagation();  // Just stop propagation
            onEdit(equipment);    // Just do the edit action
          }}
        >
          Edit
        </Button>
      )}
      {onDelete && (
        <Button
          onClick={(e) => {
            e.stopPropagation();  // Just stop propagation
            onDelete(equipment);  // Just do the delete action
          }}
        >
          Delete
        </Button>
      )}
    </div>
  )}
</Card>
```

### Result

- **Desktop**: Click the equipment name/icon area to register for the secret sequence. Edit/Delete buttons work normally without affecting the sequence
- **iPhone**: Tap the equipment name/icon area (which is now a large, dedicated touch target) to register. Buttons don't interfere
- Both platforms work correctly because the clickable area for the sequence is explicit and separate from the action buttons

