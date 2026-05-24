# Fleet Dashboard Filter Fix

## Issue
The "Active", "Watching", "Passed" filter buttons do nothing - all vehicles show regardless of filter state.

## Solution
Hook up the filter buttons to toggle status values in display logic.

## Code Changes Needed

In `src/app/fleet/page.tsx`, add filter state and toggle logic:

```typescript
const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'watching' | 'passed'>('all');

const filteredVehicles = fleet.filter(v => {
  if (filterStatus === 'all') return true;
  return v.status?.toLowerCase() === filterStatus;
});
```

Then update button onClick handlers to toggle filter.
