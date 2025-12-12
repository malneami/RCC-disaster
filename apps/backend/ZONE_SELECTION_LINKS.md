# Hospital Zone Selection - Google Maps Links

This document contains Google Maps links for all hospitals to help you select rectangular zone boundaries for ambulance tracking.

## Instructions

1. Click each Google Maps link below to open the hospital location
2. Use Google Maps tools to identify the rectangular boundaries you want for each hospital zone
3. Note the coordinates of the 4 corners (or min/max lat/lng) of your rectangle
4. Send back the coordinates for each hospital in the format specified below

## Coordinate Format Needed

For each hospital, please provide rectangular zone coordinates in one of these formats:

### Format 1 (Min/Max - Recommended):
```json
{
  "hospitalId": "uuid",
  "minLat": 16.8900,
  "maxLat": 16.9000,
  "minLng": 42.5500,
  "maxLng": 42.5600
}
```

### Format 2 (Corners):
```json
{
  "hospitalId": "uuid",
  "corners": [
    { "lat": 16.8900, "lng": 42.5500 }, // Southwest corner
    { "lat": 16.9000, "lng": 42.5500 }, // Northwest corner
    { "lat": 16.9000, "lng": 42.5600 }, // Northeast corner
    { "lat": 16.8900, "lng": 42.5600 }  // Southeast corner
  ]
}
```

---

## Hospital Zone Links

### 1. Abu Arish General Hospital (AAGH)
- **Hospital ID**: `39f71609-2906-433e-8a39-6472a25c8d7b`
- **Current Coordinates**: 16.9770664, 42.8732559
- **Address**: Abu Arish, Jazan, Saudi Arabia
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=16.9770664,42.8732559

### 2. Ahad Al-Masarhah General Hospital
- **Hospital ID**: `48c2d907-020f-425c-ab2b-906ec066fa85`
- **Current Coordinates**: 16.733231, 42.937143
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=16.733231,42.937143

### 3. Al-Aidabi General Hospital
- **Hospital ID**: `e06f9335-e34f-40fd-ace5-1b66e8ae87b0`
- **Current Coordinates**: 17.2388064, 42.9098925
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=17.2388064,42.9098925

### 4. Al-Aridha General Hospital
- **Hospital ID**: `a3cde00b-df9c-4a5e-bce4-c646f24bc381`
- **Current Coordinates**: 17.0446963, 43.0445554
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=17.0446963,43.0445554

### 5. Al-Darb General Hospital
- **Hospital ID**: `7d4ae8fc-b005-41d5-a6a0-3c10e0c313ef`
- **Current Coordinates**: 17.7077154, 42.2166516
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=17.7077154,42.2166516

### 6. Al-Hurrath General Hospital
- **Hospital ID**: `13640da2-19a5-4866-a7e7-03e9d3359219`
- **Current Coordinates**: 17.10979, 42.7693838
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=17.10979,42.7693838

### 7. Al-Rayth General Hospital
- **Hospital ID**: `4d890d0f-1c29-486a-9124-ecc47c130888`
- **Current Coordinates**: 17.6167942, 42.8273415
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=17.6167942,42.8273415

### 8. Al-Tuwal General Hospital
- **Hospital ID**: `b446fce2-bb71-4cc1-8277-a08e25900c6d`
- **Current Coordinates**: 16.5345717, 42.9476277
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=16.5345717,42.9476277

### 9. Bani Malik General Hospital
- **Hospital ID**: `2e6f1369-8acb-4eed-984a-07b4ec20e63f`
- **Current Coordinates**: 17.3306284, 43.1159548
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=17.3306284,43.1159548

### 10. Baysh General Hospital
- **Hospital ID**: `30962a30-0034-4033-bd2d-bef92ffd5cf1`
- **Current Coordinates**: 17.4397852, 42.5274381
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=17.4397852,42.5274381

### 11. Farasan General Hospital
- **Hospital ID**: `aebc781b-0a7e-4e20-a5d4-21eb275d0082`
- **Current Coordinates**: 16.6954553, 42.1188235
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=16.6954553,42.1188235

### 12. Fayfa General Hospital
- **Hospital ID**: `7a85245e-3a19-46a3-8776-9c0e6c127ff1`
- **Current Coordinates**: 17.2682963, 43.1134234
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=17.2682963,43.1134234

### 13. Jazan General Hospital (JGH)
- **Hospital ID**: `b5c3e694-26f5-4d78-b399-4d04fbe5e660`
- **Current Coordinates**: 16.8957234, 42.5557874
- **Address**: Jazan, Saudi Arabia
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=16.8957234,42.5557874

### 14. Jazan Specialized Hospital
- **Hospital ID**: `c239c223-5380-4f37-9466-82f22b80e676`
- **Current Coordinates**: 16.806384, 42.6555153
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=16.806384,42.6555153

### 15. King Fahad Central Hospital (KFCH)
- **Hospital ID**: `102ad4ac-654b-44b9-a7a2-77f9d588013d`
- **Current Coordinates**: 16.9220163, 42.7355263
- **Address**: Jazan, Saudi Arabia
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=16.9220163,42.7355263

### 16. Prince Mohammed Bin Nasser Hospital (PMNH)
- **Hospital ID**: `34470413-f3dc-42f9-b418-320483fdf115`
- **Current Coordinates**: 16.9951348, 42.6183107
- **Address**: Jazan, Saudi Arabia
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=16.9951348,42.6183107

### 17. Sabya General Hospital
- **Hospital ID**: `a4bfde37-f401-45cb-9b42-15ae53ae1150`
- **Current Coordinates**: 17.1525193, 42.6473855
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=17.1525193,42.6473855

### 18. Samtah General Hospital
- **Hospital ID**: `fa77b26a-f337-4add-9c75-5a0b4dae3b1e`
- **Current Coordinates**: 16.606612, 42.941007
- **Address**: Samtah, Jazan, Saudi Arabia
- **📍 Google Maps**: https://www.google.com/maps/search/?api=1&query=16.606612,42.941007

---

## Quick Reference

All hospital data is also available in JSON format at: `hospital-zones-reference.json`

You can regenerate this list by running:
```bash
cd apps/backend
npx ts-node generate-zone-links.ts
```

