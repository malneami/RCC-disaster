# Live Ambulance Tracking - Testing Guide

This guide provides comprehensive instructions for testing the Live Ambulance Tracking system.

## 🧪 Pre-Testing Checklist

### 1. Environment Setup
- [ ] Backend server is running (`cd apps/backend && npm run start:dev`)
- [ ] Frontend server is running (`cd apps/frontend && npm run dev`)
- [ ] Database is accessible and seeded with ambulance data
- [ ] GPS API endpoint is configured and accessible

### 2. Required Data
The system requires ambulances with valid GPS coordinates. Ensure your database has:
- Ambulances with `currentLocationLat` and `currentLocationLng` values
- Or access to the external GPS API endpoint `/ambulances/gps`

## 🎯 Testing Scenarios

### Test 1: Initial Load and Map Display

**Objective**: Verify the map loads correctly with ambulance markers

**Steps**:
1. Navigate to the application: `http://localhost:5173` (or your configured port)
2. Log in with valid credentials
3. Navigate to **EMS Portal** → **Live Tracking** tab
4. Wait for the map to load

**Expected Results**:
- ✅ OpenStreetMap tiles load successfully
- ✅ Ambulance markers appear on the map with correct positions
- ✅ Markers are color-coded based on status:
  - Green: Available
  - Blue: In Use
  - Orange: Maintenance
  - Red: Out of Service
- ✅ Map legend appears in bottom-left corner
- ✅ Map controls appear in top-right corner
- ✅ Statistics show correct ambulance counts

### Test 2: Auto-Refresh Functionality

**Objective**: Verify the 2-minute auto-refresh works correctly

**Steps**:
1. Open Live Tracking map
2. Note the countdown timer in the map controls (top-right)
3. Wait for 2 minutes or observe the countdown

**Expected Results**:
- ✅ Countdown timer displays time until next refresh (format: MM:SS)
- ✅ Timer counts down from 2:00 to 0:00
- ✅ At 0:00, a "Updating locations..." indicator appears
- ✅ Ambulance positions refresh automatically
- ✅ Countdown resets to 2:00 after refresh
- ✅ No page reload or disruption to user experience

### Test 3: Manual Refresh

**Objective**: Test manual refresh functionality

**Steps**:
1. Open Live Tracking map
2. Click the refresh button (circular arrow icon) in top-right controls
3. Observe the loading indicator

**Expected Results**:
- ✅ Loading indicator appears immediately
- ✅ "Updating locations..." message displays at top of map
- ✅ Data refreshes without page reload
- ✅ Countdown timer resets to 2:00
- ✅ Last update time updates to current time

### Test 4: Marker Interactions

**Objective**: Test ambulance marker click and hover interactions

**Steps**:
1. Hover over an ambulance marker
2. Click on an ambulance marker
3. Click on a different ambulance marker
4. Click on the same marker again to deselect

**Expected Results**:
- ✅ **On Hover**: Tooltip shows call sign, plate number, and status
- ✅ **On Click**: 
  - Marker enlarges and highlights
  - Popup opens with detailed information:
    - Call sign and plate number
    - Status chip with color coding
    - Driver information (if assigned)
    - Speed and direction
    - Location address
    - Last update time
- ✅ **Multiple Clicks**: Only one marker is selected at a time
- ✅ **Deselect**: Clicking same marker closes popup and returns to normal size

### Test 5: Search Functionality

**Objective**: Test ambulance search feature

**Steps**:
1. Type an ambulance call sign in the search box (e.g., "A-001")
2. Try searching by plate number
3. Try searching by driver name
4. Clear the search

**Expected Results**:
- ✅ Matching ambulances remain visible on map
- ✅ Non-matching ambulances are filtered out
- ✅ Legend statistics update to show filtered results
- ✅ Search is case-insensitive
- ✅ Partial matches work (e.g., "A-0" matches "A-001", "A-002")
- ✅ Clearing search restores all ambulances

### Test 6: Status Filters

**Objective**: Test status filtering functionality

**Steps**:
1. Click the filter button (funnel icon) in map controls
2. Check "Available" status
3. Check "In Use" status
4. Uncheck "Available"
5. Click "Clear All Filters"

**Expected Results**:
- ✅ Filter panel opens on left side
- ✅ Checking a status shows only ambulances with that status
- ✅ Multiple statuses can be selected (OR logic)
- ✅ Legend updates to show filtered counts
- ✅ "Clear All Filters" chip appears when filters are active
- ✅ Clearing filters restores all ambulances

### Test 7: Type Filters

**Objective**: Test ambulance type filtering

**Steps**:
1. Open filter panel
2. Check "Basic" ambulance type
3. Check "Advanced" type as well
4. Uncheck all types

**Expected Results**:
- ✅ Only selected types are visible on map
- ✅ Multiple types can be selected
- ✅ Legend statistics update correctly
- ✅ Unchecking all types shows all ambulances

### Test 8: Driver Availability Filter

**Objective**: Test driver availability filtering

**Steps**:
1. Open filter panel
2. Check "With Driver"
3. Uncheck and check "Without Driver"
4. Uncheck both

**Expected Results**:
- ✅ "With Driver" shows only ambulances with assigned drivers
- ✅ "Without Driver" shows only ambulances without drivers
- ✅ Only one can be selected at a time
- ✅ Statistics update correctly

### Test 9: Fit Bounds

**Objective**: Test the fit bounds functionality

**Steps**:
1. Zoom in on a specific area of the map
2. Pan to a location away from ambulances
3. Click the "Fit all ambulances" button (expand icon)

**Expected Results**:
- ✅ Map automatically zooms out if needed
- ✅ Map centers to show all visible ambulances
- ✅ All ambulances are visible within the viewport
- ✅ Appropriate padding around markers

### Test 10: Combined Filters

**Objective**: Test multiple filters working together

**Steps**:
1. Apply a status filter ("Available")
2. Apply a type filter ("Advanced")
3. Apply a search term
4. Observe results

**Expected Results**:
- ✅ Only ambulances matching ALL criteria are shown
- ✅ Statistics reflect combined filtering
- ✅ Performance remains smooth with multiple filters
- ✅ Clearing any filter updates results immediately

### Test 11: Empty States

**Objective**: Test behavior when no data is available

**Steps**:
1. Apply filters that result in no matches
2. Test with no ambulances in database
3. Test with ambulances but no GPS coordinates

**Expected Results**:
- ✅ Friendly empty state message appears
- ✅ Message explains why no ambulances are shown
- ✅ Suggestion to adjust filters (when applicable)
- ✅ No errors in console
- ✅ Map remains interactive

### Test 12: GPS vs Database Mode

**Objective**: Test both data sources

**Steps**:
1. Test with `useGPSAPI={true}` (default)
2. Test with `useGPSAPI={false}`
3. Compare data quality and update frequency

**Expected Results**:
- ✅ **GPS API Mode**:
  - More accurate real-time data
  - Speed and direction available
  - Movement indicators visible
- ✅ **Database Mode**:
  - Falls back gracefully
  - Shows last known positions
  - No speed/direction data

### Test 13: Responsive Design

**Objective**: Test on different screen sizes

**Steps**:
1. Test on desktop (1920x1080)
2. Test on tablet (768px width)
3. Test on mobile (375px width)
4. Rotate device/change orientation

**Expected Results**:
- ✅ Map scales appropriately
- ✅ Controls remain accessible
- ✅ Legend doesn't obscure important content
- ✅ Filter panel adapts to screen size
- ✅ Touch interactions work on mobile
- ✅ No horizontal scrolling

### Test 14: Performance

**Objective**: Test system performance with many ambulances

**Steps**:
1. Load map with 50+ ambulances
2. Interact with markers
3. Apply filters
4. Observe refresh performance

**Expected Results**:
- ✅ Initial load completes within 3 seconds
- ✅ Marker interactions are instant
- ✅ Filtering is smooth without lag
- ✅ Auto-refresh doesn't freeze UI
- ✅ Memory usage remains stable
- ✅ No console errors or warnings

### Test 15: Error Handling

**Objective**: Test error scenarios

**Steps**:
1. Stop the backend server temporarily
2. Simulate network error
3. Provide invalid GPS coordinates
4. Test with expired authentication

**Expected Results**:
- ✅ Graceful error message appears
- ✅ User is informed of the issue
- ✅ Retry mechanism works (via react-query)
- ✅ Previous data remains visible during error
- ✅ System recovers when connection restored

## 🔍 Testing with Browser Developer Tools

### Network Tab
1. Open DevTools → Network
2. Filter by XHR/Fetch
3. Observe API calls

**Verify**:
- ✅ `/ambulances/gps` or `/ambulances` endpoint is called
- ✅ Calls happen every 2 minutes
- ✅ Response status is 200
- ✅ Response contains valid ambulance data

### Console Tab
**Verify**:
- ✅ No errors or warnings
- ✅ React Query logs (if dev mode enabled)
- ✅ No memory leaks over time

### Performance Tab
1. Record a session while map is running
2. Observe memory usage
3. Check for memory leaks

**Verify**:
- ✅ Memory usage is stable
- ✅ No excessive re-renders
- ✅ Smooth 60fps performance

## 📊 Test Data Requirements

### Minimum Test Data
```sql
-- At least 5 ambulances with different statuses
INSERT INTO ambulances (status, currentLocationLat, currentLocationLng) VALUES
  ('AVAILABLE', 24.7136, 46.6753),
  ('IN_USE', 24.7236, 46.6853),
  ('MAINTENANCE', 24.7336, 46.6953),
  ('OUT_OF_SERVICE', 24.7436, 46.7053),
  ('AVAILABLE', 24.7536, 46.7153);
```

### Optimal Test Data
- 20-30 ambulances with various statuses
- Different ambulance types (BASIC, ADVANCED, CRITICAL_CARE)
- Some with drivers assigned, some without
- Varied GPS coordinates covering a reasonable area
- Some ambulances with speed > 0 (moving)

## ✅ Acceptance Criteria

The Live Ambulance Tracking system is ready for production when:

- [ ] All 15 test scenarios pass successfully
- [ ] No console errors or warnings
- [ ] Performance is acceptable (< 3s initial load)
- [ ] Auto-refresh works reliably every 2 minutes
- [ ] All filters and search work correctly
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Error states are handled gracefully
- [ ] Documentation is complete and accurate

## 🐛 Common Issues and Solutions

### Issue: Map tiles not loading
**Solution**: Check internet connection, verify OpenStreetMap is accessible

### Issue: No ambulances showing
**Solution**: 
- Verify database has ambulances with valid coordinates
- Check API endpoint is accessible
- Ensure user has proper permissions

### Issue: Auto-refresh not working
**Solution**: Check browser console for errors, verify react-query is configured

### Issue: Markers showing in wrong locations
**Solution**: Verify coordinate format (lat/lng not lng/lat)

### Issue: Slow performance
**Solution**: 
- Limit number of ambulances displayed
- Check for memory leaks
- Optimize marker rendering

## 📝 Test Report Template

```markdown
# Live Tracking Test Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Dev/Staging/Prod]
**Browser**: [Chrome/Firefox/Safari/Edge]
**Version**: [Browser Version]

## Test Results

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Initial Load | ✅ PASS | |
| 2 | Auto-Refresh | ✅ PASS | |
| 3 | Manual Refresh | ✅ PASS | |
| ... | ... | ... | ... |

## Issues Found

1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce:
   - Expected vs Actual:

## Overall Assessment

[Summary of test results and readiness for deployment]
```

## 🚀 Automated Testing (Future Enhancement)

Consider adding:
- Unit tests for utility functions
- Integration tests for API calls
- E2E tests with Playwright/Cypress
- Visual regression tests

## 📞 Support

If tests fail:
1. Check this guide for solutions
2. Review console errors
3. Verify API responses
4. Check component props configuration
5. Contact development team if issue persists

