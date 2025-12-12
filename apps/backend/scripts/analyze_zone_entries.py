#!/usr/bin/env python3
"""
Zone Entry/Exit Data Analysis Script
Analyzes ambulance zone entry/exit patterns to identify issues and improve architecture
"""

import os
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import statistics

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    import pandas as pd
    import matplotlib.pyplot as plt
    import seaborn as sns
except ImportError as e:
    print(f"Missing required package: {e}")
    print("Please install: pip install psycopg2-binary pandas matplotlib seaborn")
    sys.exit(1)

# Database connection configuration
# Supports both DATABASE_URL (PostgreSQL format) and individual env vars
def get_db_config():
    """Parse database configuration from environment variables"""
    # Try DATABASE_URL first (standard format: postgresql://user:password@host:port/database)
    database_url = os.getenv('DATABASE_URL', '')
    if database_url:
        try:
            from urllib.parse import urlparse
            parsed = urlparse(database_url)
            return {
                'host': parsed.hostname or 'localhost',
                'port': parsed.port or 5432,
                'database': parsed.path.lstrip('/') or 'rcc_healthcare',
                'user': parsed.username or 'postgres',
                'password': parsed.password or '',
            }
        except Exception as e:
            print(f"Warning: Failed to parse DATABASE_URL: {e}")
    
    # Fall back to individual environment variables
    return {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', '5432')),
        'database': os.getenv('DB_NAME', 'rcc_healthcare'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', ''),
    }

# Will be initialized in main()
DB_CONFIG = {}

class ZoneEntryAnalyzer:
    def __init__(self, db_config: Dict):
        self.db_config = db_config
        self.conn = None
        self.analysis_results = {}
        
    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            print("✓ Connected to database")
            return True
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("✓ Database connection closed")
    
    def analyze_suspicious_short_durations(self, min_minutes: int = 1, max_minutes: int = 10) -> pd.DataFrame:
        """
        Find zone entries with suspiciously short durations (likely GPS noise)
        """
        query = """
        SELECT 
            azl.id,
            azl.ambulance_id,
            a.call_sign,
            h.name as hospital_name,
            azl.zone_type,
            azl.entry_time,
            azl.exit_time,
            azl.duration_minutes,
            CASE 
                WHEN azl.duration_minutes IS NULL THEN 'ACTIVE'
                ELSE 'CLOSED'
            END as status
        FROM ambulance_zone_logs azl
        JOIN ambulances a ON azl.ambulance_id = a.id
        JOIN hospitals h ON azl.hospital_id = h.id
        WHERE azl.exit_time IS NOT NULL
          AND azl.duration_minutes >= %s
          AND azl.duration_minutes <= %s
        ORDER BY azl.duration_minutes ASC, azl.entry_time DESC
        LIMIT 1000;
        """
        
        df = pd.read_sql_query(query, self.conn, params=(min_minutes, max_minutes))
        return df
    
    def analyze_gps_quality_during_entries(self, zone_log_ids: List[str]) -> pd.DataFrame:
        """
        Analyze GPS data quality during suspicious zone entries
        """
        if not zone_log_ids:
            return pd.DataFrame()
        
        placeholders = ','.join(['%s'] * len(zone_log_ids))
        query = f"""
        SELECT 
            azl.id as zone_log_id,
            azl.ambulance_id,
            azl.entry_time,
            azl.exit_time,
            COUNT(gps.id) as gps_points_count,
            COUNT(CASE WHEN gps.latitude = 0 AND gps.longitude = 0 THEN 1 END) as invalid_coords_count,
            COUNT(CASE WHEN gps.latitude < 16 OR gps.latitude > 32 OR 
                         gps.longitude < 34 OR gps.longitude > 55 THEN 1 END) as out_of_bounds_count,
            AVG(gps.speed) as avg_speed,
            MIN(gps.timestamp) as first_gps_time,
            MAX(gps.timestamp) as last_gps_time,
            EXTRACT(EPOCH FROM (MAX(gps.timestamp) - MIN(gps.timestamp))) / 60 as gps_time_span_minutes
        FROM ambulance_zone_logs azl
        LEFT JOIN gps_tracking_logs gps ON 
            gps.ambulance_id = azl.ambulance_id
            AND gps.timestamp >= azl.entry_time - INTERVAL '5 minutes'
            AND gps.timestamp <= COALESCE(azl.exit_time, NOW()) + INTERVAL '5 minutes'
        WHERE azl.id IN ({placeholders})
        GROUP BY azl.id, azl.ambulance_id, azl.entry_time, azl.exit_time
        ORDER BY azl.entry_time DESC;
        """
        
        df = pd.read_sql_query(query, self.conn, params=zone_log_ids)
        return df
    
    def analyze_rapid_entry_exit_patterns(self, time_window_minutes: int = 5) -> pd.DataFrame:
        """
        Find patterns where ambulance enters and exits zones rapidly (within time window)
        """
        query = """
        WITH zone_sequences AS (
            SELECT 
                azl1.ambulance_id,
                a.call_sign,
                azl1.hospital_id as hospital1_id,
                h1.name as hospital1_name,
                azl1.entry_time as entry1_time,
                azl1.exit_time as exit1_time,
                azl1.duration_minutes as duration1_minutes,
                azl2.hospital_id as hospital2_id,
                h2.name as hospital2_name,
                azl2.entry_time as entry2_time,
                azl2.exit_time as exit2_time,
                azl2.duration_minutes as duration2_minutes,
                EXTRACT(EPOCH FROM (azl2.entry_time - azl1.exit_time)) / 60 as time_between_minutes
            FROM ambulance_zone_logs azl1
            JOIN ambulances a ON azl1.ambulance_id = a.id
            JOIN hospitals h1 ON azl1.hospital_id = h1.id
            LEFT JOIN ambulance_zone_logs azl2 ON 
                azl2.ambulance_id = azl1.ambulance_id
                AND azl2.entry_time > azl1.exit_time
                AND azl2.entry_time <= azl1.exit_time + INTERVAL '%s minutes'
            LEFT JOIN hospitals h2 ON azl2.hospital_id = h2.id
            WHERE azl1.exit_time IS NOT NULL
              AND azl1.duration_minutes IS NOT NULL
              AND azl1.duration_minutes <= 10
        )
        SELECT * FROM zone_sequences
        WHERE hospital2_id IS NOT NULL
        ORDER BY time_between_minutes ASC, entry1_time DESC
        LIMIT 500;
        """
        
        df = pd.read_sql_query(query, self.conn, params=(time_window_minutes,))
        return df
    
    def analyze_gps_gaps_during_zones(self) -> pd.DataFrame:
        """
        Find GPS data gaps during zone entries (missing GPS data)
        """
        query = """
        WITH zone_periods AS (
            SELECT 
                azl.id,
                azl.ambulance_id,
                a.call_sign,
                h.name as hospital_name,
                azl.entry_time,
                COALESCE(azl.exit_time, NOW()) as exit_time,
                EXTRACT(EPOCH FROM (COALESCE(azl.exit_time, NOW()) - azl.entry_time)) / 60 as zone_duration_minutes
            FROM ambulance_zone_logs azl
            JOIN ambulances a ON azl.ambulance_id = a.id
            JOIN hospitals h ON azl.hospital_id = h.id
            WHERE azl.entry_time >= NOW() - INTERVAL '7 days'
        ),
        gps_coverage AS (
            SELECT 
                zp.id,
                zp.ambulance_id,
                zp.call_sign,
                zp.hospital_name,
                zp.entry_time,
                zp.exit_time,
                zp.zone_duration_minutes,
                COUNT(gps.id) as gps_points_count,
                CASE 
                    WHEN zp.zone_duration_minutes > 0 
                    THEN COUNT(gps.id) / zp.zone_duration_minutes
                    ELSE 0
                END as gps_points_per_minute,
                EXTRACT(EPOCH FROM (MAX(gps.timestamp) - MIN(gps.timestamp))) / 60 as gps_span_minutes,
                zp.zone_duration_minutes - EXTRACT(EPOCH FROM (MAX(gps.timestamp) - MIN(gps.timestamp))) / 60 as gap_minutes
            FROM zone_periods zp
            LEFT JOIN gps_tracking_logs gps ON 
                gps.ambulance_id = zp.ambulance_id
                AND gps.timestamp >= zp.entry_time
                AND gps.timestamp <= zp.exit_time
            GROUP BY zp.id, zp.ambulance_id, zp.call_sign, zp.hospital_name, 
                     zp.entry_time, zp.exit_time, zp.zone_duration_minutes
        )
        SELECT * FROM gps_coverage
        WHERE gap_minutes > 10 OR gps_points_per_minute < 0.5
        ORDER BY gap_minutes DESC, zone_duration_minutes DESC
        LIMIT 500;
        """
        
        df = pd.read_sql_query(query, self.conn)
        return df
    
    def analyze_zone_statistics(self) -> Dict:
        """
        Overall statistics about zone entries
        """
        query = """
        SELECT 
            COUNT(*) as total_entries,
            COUNT(CASE WHEN exit_time IS NULL THEN 1 END) as active_entries,
            COUNT(CASE WHEN exit_time IS NOT NULL THEN 1 END) as closed_entries,
            AVG(duration_minutes) as avg_duration_minutes,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_minutes) as median_duration_minutes,
            MIN(duration_minutes) as min_duration_minutes,
            MAX(duration_minutes) as max_duration_minutes,
            COUNT(CASE WHEN duration_minutes <= 2 THEN 1 END) as entries_under_2min,
            COUNT(CASE WHEN duration_minutes <= 5 THEN 1 END) as entries_under_5min,
            COUNT(CASE WHEN duration_minutes <= 10 THEN 1 END) as entries_under_10min
        FROM ambulance_zone_logs
        WHERE exit_time IS NOT NULL;
        """
        
        df = pd.read_sql_query(query, self.conn)
        return df.iloc[0].to_dict()
    
    def generate_report(self):
        """Generate comprehensive analysis report"""
        print("\n" + "="*80)
        print("ZONE ENTRY/EXIT DATA ANALYSIS REPORT")
        print("="*80 + "\n")
        
        # 1. Overall Statistics
        print("1. OVERALL STATISTICS")
        print("-" * 80)
        stats = self.analyze_zone_statistics()
        print(f"Total Zone Entries (closed): {stats['closed_entries']:,}")
        print(f"Active Zone Entries: {stats['active_entries']:,}")
        print(f"Average Duration: {stats['avg_duration_minutes']:.2f} minutes")
        print(f"Median Duration: {stats['median_duration_minutes']:.2f} minutes")
        print(f"Min Duration: {stats['min_duration_minutes']:.2f} minutes")
        print(f"Max Duration: {stats['max_duration_minutes']:.2f} minutes")
        print(f"\nSuspicious Patterns:")
        print(f"  - Entries ≤ 2 minutes: {stats['entries_under_2min']:,} ({stats['entries_under_2min']/stats['closed_entries']*100:.1f}%)")
        print(f"  - Entries ≤ 5 minutes: {stats['entries_under_5min']:,} ({stats['entries_under_5min']/stats['closed_entries']*100:.1f}%)")
        print(f"  - Entries ≤ 10 minutes: {stats['entries_under_10min']:,} ({stats['entries_under_10min']/stats['closed_entries']*100:.1f}%)")
        
        # 2. Suspicious Short Durations
        print("\n\n2. SUSPICIOUS SHORT DURATIONS (1-10 minutes)")
        print("-" * 80)
        short_durations = self.analyze_suspicious_short_durations(1, 10)
        if not short_durations.empty:
            print(f"Found {len(short_durations)} suspicious entries")
            print("\nTop 20 Shortest Durations:")
            print(short_durations[['call_sign', 'hospital_name', 'entry_time', 'exit_time', 'duration_minutes']].head(20).to_string(index=False))
            
            # Analyze GPS quality for these entries
            zone_ids = short_durations['id'].head(50).tolist()
            gps_quality = self.analyze_gps_quality_during_entries(zone_ids)
            if not gps_quality.empty:
                print("\nGPS Quality Analysis for Suspicious Entries:")
                print(f"  - Average GPS points per entry: {gps_quality['gps_points_count'].mean():.1f}")
                print(f"  - Entries with invalid coordinates (0,0): {gps_quality['invalid_coords_count'].sum()}")
                print(f"  - Entries with out-of-bounds coordinates: {gps_quality['out_of_bounds_count'].sum()}")
                print(f"  - Average speed during entries: {gps_quality['avg_speed'].mean():.1f} km/h")
        else:
            print("No suspicious short duration entries found")
        
        # 3. Rapid Entry/Exit Patterns
        print("\n\n3. RAPID ENTRY/EXIT PATTERNS")
        print("-" * 80)
        rapid_patterns = self.analyze_rapid_entry_exit_patterns(5)
        if not rapid_patterns.empty:
            print(f"Found {len(rapid_patterns)} rapid transitions")
            print("\nTop 20 Most Rapid Transitions:")
            display_cols = ['call_sign', 'hospital1_name', 'duration1_minutes', 
                          'hospital2_name', 'time_between_minutes']
            print(rapid_patterns[display_cols].head(20).to_string(index=False))
        else:
            print("No rapid entry/exit patterns found")
        
        # 4. GPS Gaps During Zones
        print("\n\n4. GPS DATA GAPS DURING ZONE ENTRIES")
        print("-" * 80)
        gps_gaps = self.analyze_gps_gaps_during_zones()
        if not gps_gaps.empty:
            print(f"Found {len(gps_gaps)} zone entries with GPS data issues")
            print("\nTop 20 Entries with Largest GPS Gaps:")
            display_cols = ['call_sign', 'hospital_name', 'zone_duration_minutes', 
                          'gps_points_count', 'gps_points_per_minute', 'gap_minutes']
            print(gps_gaps[display_cols].head(20).to_string(index=False))
        else:
            print("No significant GPS gaps found")
        
        # 5. Recommendations
        print("\n\n5. ARCHITECTURE IMPROVEMENT RECOMMENDATIONS")
        print("-" * 80)
        self.generate_recommendations(stats, short_durations, rapid_patterns, gps_gaps)
        
        print("\n" + "="*80)
        print("Analysis Complete")
        print("="*80 + "\n")
    
    def generate_recommendations(self, stats: Dict, short_durations: pd.DataFrame, 
                                 rapid_patterns: pd.DataFrame, gps_gaps: pd.DataFrame):
        """Generate architecture improvement recommendations"""
        recommendations = []
        
        # Check short duration percentage
        if stats['entries_under_2min'] > 0:
            pct = stats['entries_under_2min'] / stats['closed_entries'] * 100
            if pct > 5:
                recommendations.append({
                    'priority': 'HIGH',
                    'issue': f'{pct:.1f}% of zone entries last ≤ 2 minutes (likely GPS noise)',
                    'recommendation': 'Increase minimum zone duration threshold from 2 minutes to 3-5 minutes',
                    'impact': 'Will reduce false zone entries from GPS noise'
                })
        
        # Check GPS quality
        if not short_durations.empty:
            zone_ids = short_durations['id'].head(50).tolist()
            gps_quality = self.analyze_gps_quality_during_entries(zone_ids)
            if not gps_quality.empty:
                invalid_pct = (gps_quality['invalid_coords_count'] > 0).sum() / len(gps_quality) * 100
                if invalid_pct > 10:
                    recommendations.append({
                        'priority': 'HIGH',
                        'issue': f'{invalid_pct:.1f}% of suspicious entries have invalid GPS coordinates',
                        'recommendation': 'Add GPS coordinate validation before zone processing (already implemented)',
                        'impact': 'Prevents zone entries from invalid GPS data'
                    })
        
        # Check rapid patterns
        if not rapid_patterns.empty:
            very_rapid = rapid_patterns[rapid_patterns['time_between_minutes'] < 3]
            if len(very_rapid) > 0:
                recommendations.append({
                    'priority': 'MEDIUM',
                    'issue': f'{len(very_rapid)} zone transitions occur within 3 minutes',
                    'recommendation': 'Implement zone transition cooldown period (3-5 minutes)',
                    'impact': 'Prevents false zone transitions from GPS noise'
                })
        
        # Check GPS gaps
        if not gps_gaps.empty:
            large_gaps = gps_gaps[gps_gaps['gap_minutes'] > 30]
            if len(large_gaps) > 0:
                recommendations.append({
                    'priority': 'MEDIUM',
                    'issue': f'{len(large_gaps)} zone entries have GPS gaps > 30 minutes',
                    'recommendation': 'Investigate GPS device connectivity issues for affected ambulances',
                    'impact': 'Improves data quality and zone detection accuracy'
                })
        
        # Default recommendations
        recommendations.extend([
            {
                'priority': 'LOW',
                'issue': 'Zone entry confirmation mechanism',
                'recommendation': 'Require multiple GPS points in zone before logging entry (already implemented)',
                'impact': 'Reduces false positives from single GPS spikes'
            },
            {
                'priority': 'LOW',
                'issue': 'Zone radius optimization',
                'recommendation': 'Current 2.5km radius is appropriate - monitor for edge cases',
                'impact': 'Balances coverage with accuracy'
            }
        ])
        
        for i, rec in enumerate(recommendations, 1):
            print(f"\n{i}. [{rec['priority']}] {rec['issue']}")
            print(f"   Recommendation: {rec['recommendation']}")
            print(f"   Impact: {rec['impact']}")


def main():
    """Main execution function"""
    print("Zone Entry/Exit Data Analysis")
    print("=" * 80)
    
    # Try loading from .env file first
    try:
        from dotenv import load_dotenv
        # Load from backend directory
        env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
        if os.path.exists(env_path):
            load_dotenv(env_path)
            print("✓ Loaded .env file")
    except ImportError:
        print("⚠ python-dotenv not installed. Install with: pip install python-dotenv")
    except Exception as e:
        print(f"⚠ Could not load .env file: {e}")
    
    # Get database configuration
    db_config = get_db_config()
    
    if not db_config.get('password'):
        print("\n⚠ Warning: Database password not found!")
        print("Please set one of:")
        print("  - DATABASE_URL environment variable (postgresql://user:password@host:port/database)")
        print("  - DB_PASSWORD environment variable")
        print("  - Add credentials to .env file")
        print("\nExample DATABASE_URL:")
        print("  postgresql://postgres:password@localhost:5432/rcc_healthcare")
        return 1
    
    analyzer = ZoneEntryAnalyzer(db_config)
    
    if not analyzer.connect():
        print("\nPlease set database credentials:")
        print("  export DB_HOST=localhost")
        print("  export DB_PORT=5432")
        print("  export DB_NAME=rcc_healthcare")
        print("  export DB_USER=postgres")
        print("  export DB_PASSWORD=your_password")
        return 1
    
    try:
        analyzer.generate_report()
        return 0
    except Exception as e:
        print(f"\n✗ Analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        analyzer.disconnect()


if __name__ == '__main__':
    sys.exit(main())
