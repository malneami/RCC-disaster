# Quick Start: Zone Entry Analysis

## Install Dependencies

```bash
cd apps/backend
pip3 install -r scripts/requirements-analysis.txt
```

## Run Analysis

The script will automatically try to read database credentials from:
1. `DATABASE_URL` environment variable
2. Individual `DB_*` environment variables  
3. `.env` file in the backend directory

### Option 1: Using npm script (recommended)

```bash
cd apps/backend
npm run analyze:zones
```

### Option 2: Direct Python execution

```bash
cd apps/backend
python3 scripts/analyze_zone_entries.py
```

### Option 3: With explicit credentials

```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/rcc_healthcare"
python3 scripts/analyze_zone_entries.py
```

## What the Analysis Does

1. **Identifies suspicious patterns:**
   - Zone entries lasting ≤ 2 minutes (nearly impossible)
   - Rapid entry/exit transitions
   - GPS data gaps during zone entries

2. **Analyzes GPS quality:**
   - Invalid coordinates (0,0)
   - Out-of-bounds coordinates
   - Missing GPS data during zone periods

3. **Provides recommendations:**
   - Architecture improvements
   - Threshold adjustments
   - Data quality fixes

## Example Issues It Finds

- **"Entries ≤ 2 minutes: 23 (1.9%)"** → These are likely GPS noise
- **"GPS gaps > 30 minutes"** → GPS device connectivity issues
- **"Invalid coordinates during entries"** → GPS validation not working

## Using Results

The analysis helps you:
- ✅ Verify that zone detection improvements are working
- ✅ Identify ambulances with GPS device issues
- ✅ Adjust thresholds based on real data patterns
- ✅ Validate that invalid GPS data is being filtered
