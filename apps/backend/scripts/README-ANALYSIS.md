# Zone Entry/Exit Data Analysis

This script performs comprehensive data analysis on ambulance zone entry/exit logs to identify issues and provide architecture improvement recommendations.

## Installation

```bash
pip install -r requirements-analysis.txt
```

## Usage

### Option 1: Using Environment Variables

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=rcc_healthcare
export DB_USER=postgres
export DB_PASSWORD=your_password

python scripts/analyze_zone_entries.py
```

### Option 2: Using .env File

Create a `.env` file in the backend directory with:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rcc_healthcare
DB_USER=postgres
DB_PASSWORD=your_password
```

Then run:

```bash
python scripts/analyze_zone_entries.py
```

## What It Analyzes

1. **Overall Statistics**
   - Total zone entries
   - Average/median/min/max durations
   - Percentage of suspicious short-duration entries

2. **Suspicious Short Durations (1-10 minutes)**
   - Identifies entries that are likely GPS noise
   - Analyzes GPS data quality during these entries
   - Checks for invalid coordinates (0,0) or out-of-bounds data

3. **Rapid Entry/Exit Patterns**
   - Finds ambulances that enter and exit zones within short time windows
   - Identifies potential GPS noise causing false transitions

4. **GPS Data Gaps**
   - Finds zone entries with missing GPS data
   - Identifies connectivity issues with GPS devices

5. **Architecture Recommendations**
   - Provides prioritized recommendations based on findings
   - Suggests improvements to zone detection logic
   - Identifies data quality issues

## Output

The script generates a comprehensive text report with:
- Statistical summaries
- Top suspicious patterns
- GPS quality metrics
- Prioritized recommendations

## Example Output

```
================================================================================
ZONE ENTRY/EXIT DATA ANALYSIS REPORT
================================================================================

1. OVERALL STATISTICS
--------------------------------------------------------------------------------
Total Zone Entries (closed): 1,234
Active Zone Entries: 45
Average Duration: 127.5 minutes
Median Duration: 45.2 minutes
Min Duration: 0.5 minutes
Max Duration: 1,440.0 minutes

Suspicious Patterns:
  - Entries ≤ 2 minutes: 23 (1.9%)
  - Entries ≤ 5 minutes: 67 (5.4%)
  - Entries ≤ 10 minutes: 145 (11.8%)

2. SUSPICIOUS SHORT DURATIONS (1-10 minutes)
...
```

## Integration with Architecture

The analysis helps identify:
- Whether the 2-minute minimum duration threshold is appropriate
- If GPS validation is working correctly
- If zone confirmation mechanisms are effective
- GPS device connectivity issues
- Data quality problems

Use the recommendations to:
- Adjust zone detection thresholds
- Improve GPS data validation
- Fix connectivity issues
- Optimize zone radius settings
