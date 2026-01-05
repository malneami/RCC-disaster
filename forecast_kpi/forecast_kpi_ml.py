"""
ML-based Forecast next-month KPI from ED pathway datasets (STEMI / STROKE / TRAUMA).

Uses machine learning models for time series forecasting:
  - Random Forest Regressor
  - XGBoost Regressor
  - LSTM Neural Network (optional)

What this script does:
1) Load case-level data (CSV or Excel).
2) Parse timestamps and compute KPI minutes.
3) Aggregate to MONTHLY series (median, p90, % within target, volume).
4) Create lag features for ML models.
5) Train and evaluate multiple ML models.
6) Forecast next month using the best performing model.
7) Export results + plots.

Dependencies:
  pip install pandas numpy openpyxl scikit-learn xgboost matplotlib

Usage examples:
  python forecast_kpi_ml.py --dataset STEMI --input "Urgent care 2 copy 2.xlsx - STEMI.csv" --kpi door_to_ecg
  python forecast_kpi_ml.py --dataset STROKE --input "Urgent care 2 copy 2.xlsx - STROKE.csv" --kpi door_to_ct
  python forecast_kpi_ml.py --dataset TRAUMA --input "Urgent care 2 copy 2.xlsx - Trauma.csv" --kpi transfer_duration_reported
"""

from __future__ import annotations

import argparse
import warnings
from dataclasses import dataclass
from typing import Dict, Optional, Tuple, List

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge, Lasso
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error

warnings.filterwarnings('ignore')

# Try to import XGBoost (optional)
try:
    import xgboost as xgb
    HAS_XGBOOST = True
except (ImportError, Exception) as e:
    HAS_XGBOOST = False
    # Don't print warning unless running as main to keep output clean


# ----------------------------
# Utilities (same as original)
# ----------------------------

def read_table(path: str) -> pd.DataFrame:
    if path.lower().endswith((".xlsx", ".xlsm", ".xls")):
        return pd.read_excel(path)
    return pd.read_csv(path)

def to_datetime_safe(s: pd.Series, *, dayfirst: bool = False) -> pd.Series:
    return pd.to_datetime(s, errors="coerce", dayfirst=dayfirst)

def parse_hhmm_duration_minutes(x) -> float:
    """Parse durations like '1:40' -> 100 minutes. Returns np.nan if not parseable."""
    if pd.isna(x):
        return np.nan
    s = str(x).strip()
    if not s or s.lower() in {"nan", "none"}:
        return np.nan
    parts = s.split(":")
    if len(parts) < 2:
        return np.nan
    try:
        h = int(parts[0])
        m = int(parts[1])
        return float(h * 60 + m)
    except Exception:
        return np.nan

def parse_time_to_timedelta(x) -> pd.Timedelta | pd.NaT:
    if pd.isna(x):
        return pd.NaT

    if isinstance(x, (int, float)) and not np.isnan(x) and 0 <= x < 1:
        mins = int(round(x * 24 * 60))
        return pd.Timedelta(minutes=mins)

    s = str(x).strip()
    if not s or s.lower() in {"nan", "none"}:
        return pd.NaT

    parts = s.split(":")
    if len(parts) < 2:
        return pd.NaT

    try:
        h = int(parts[0])
        m = int(parts[1])
        sec = int(parts[2]) if len(parts) >= 3 else 0
        return pd.Timedelta(hours=h, minutes=m, seconds=sec)
    except Exception:
        return pd.NaT

def make_event_datetime(admit_date: pd.Series, time_series: pd.Series) -> pd.Series:
    td = time_series.apply(parse_time_to_timedelta)
    out = admit_date + td
    out = out.where(td.notna() & admit_date.notna(), pd.NaT)
    return out

def rollover_if_before(ref_dt: pd.Series, event_dt: pd.Series) -> pd.Series:
    mask = ref_dt.notna() & event_dt.notna() & (event_dt < ref_dt)
    out = event_dt.copy()
    out.loc[mask] = out.loc[mask] + pd.Timedelta(days=1)
    return out

def winsorize_series(s: pd.Series, lower_q=0.01, upper_q=0.99) -> pd.Series:
    s2 = s.copy()
    if s2.dropna().empty:
        return s2
    lo = float(np.nanquantile(s2, lower_q))
    hi = float(np.nanquantile(s2, upper_q))
    return s2.clip(lower=lo, upper=hi)

def next_month_start(d: pd.Timestamp) -> pd.Timestamp:
    p = d.to_period("M")
    return (p + 1).to_timestamp(how="start")

def period_to_timestamp(p: pd.Period) -> pd.Timestamp:
    return p.to_timestamp(how="start")


# ----------------------------
# Dataset-specific KPI builders
# ----------------------------

def compute_kpis_stemi(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
    date_col = "Date of admissionDD-MONTH-YY"
    triage_col = "Triage Time (Door In) (hh:mm)"
    ecg_col = "Time of first ECG (hh:mm)"
    thrombo_col = "Time of thrombolytic administration(hh:mm)"
    out_col = "Door out time(hh:mm)"
    pci_col = "Time of  1ry PCI began(hh:mm)"

    d = df.copy()
    d["admit_date"] = to_datetime_safe(d[date_col], dayfirst=False)

    d["triage_dt"] = make_event_datetime(d["admit_date"], d[triage_col])
    d["ecg_dt"] = make_event_datetime(d["admit_date"], d[ecg_col])
    d["thrombo_dt"] = make_event_datetime(d["admit_date"], d[thrombo_col])
    d["out_dt"] = make_event_datetime(d["admit_date"], d[out_col])
    d["pci_dt"] = make_event_datetime(d["admit_date"], d[pci_col])

    for col in ["ecg_dt", "thrombo_dt", "out_dt", "pci_dt"]:
        d[col] = rollover_if_before(d["triage_dt"], d[col])

    d["door_to_ecg"] = (d["ecg_dt"] - d["triage_dt"]).dt.total_seconds() / 60
    d["door_to_balloon"] = (d["pci_dt"] - d["triage_dt"]).dt.total_seconds() / 60
    d["door_to_out"] = (d["out_dt"] - d["triage_dt"]).dt.total_seconds() / 60
    d["door_to_needle"] = (d["thrombo_dt"] - d["triage_dt"]).dt.total_seconds() / 60

    label_map = {
        "door_to_ecg": "Door→ECG (min)",
        "door_to_balloon": "Door→Balloon/PCI (min)",
        "door_to_out": "Door→Out (min)",
        "door_to_needle": "Door→Needle (min)",
    }
    return d, label_map


def compute_kpis_stroke(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
    date_col = "Date of admission"
    triage_col = "Triage Time"
    phys_col = "Time of Physician assessment"
    ct_col = "Time of Non contrast CAT brain performance (scan)"
    order_col = "Time of ordering IV thrombolysis"
    needle_col = "Time of administering IV thrombolysis"
    mt_col = "Time of MT"
    swallow_col = "Time of Swallowing Screening (mm/dd/yyyy hh:mm)"

    d = df.copy()
    d["admit_date"] = to_datetime_safe(d[date_col], dayfirst=False)

    def parse_event_dt(series: pd.Series, admit_date: pd.Series) -> pd.Series:
        s = series.astype(str).str.strip().replace({"": np.nan, "nan": np.nan, "NaN": np.nan})
        mask_has_date = s.notna() & s.str.contains(r"[/\-]")
        out = pd.Series(pd.NaT, index=series.index, dtype="datetime64[ns]")

        if mask_has_date.any():
            out.loc[mask_has_date] = pd.to_datetime(s.loc[mask_has_date], errors="coerce", dayfirst=False)

        rem = ~mask_has_date
        num = pd.to_numeric(series, errors="coerce")
        mask_excel = rem & num.notna() & (num >= 0) & (num < 1)
        if mask_excel.any():
            mins = (num.loc[mask_excel] * 24 * 60).round().astype(int)
            out.loc[mask_excel] = admit_date.loc[mask_excel] + pd.to_timedelta(mins, unit="m")

        mask_hhmm = rem & ~mask_excel & s.notna()
        if mask_hhmm.any():
            td = series.loc[mask_hhmm].apply(parse_time_to_timedelta)
            out.loc[mask_hhmm] = admit_date.loc[mask_hhmm] + td

        return out

    d["triage_dt"] = parse_event_dt(d[triage_col], d["admit_date"])
    d["phys_dt"] = parse_event_dt(d[phys_col], d["admit_date"])
    d["ct_dt"] = parse_event_dt(d[ct_col], d["admit_date"])
    d["order_dt"] = parse_event_dt(d[order_col], d["admit_date"])
    d["needle_dt"] = parse_event_dt(d[needle_col], d["admit_date"])
    d["mt_dt"] = parse_event_dt(d[mt_col], d["admit_date"])
    d["swallow_dt"] = pd.to_datetime(d[swallow_col], errors="coerce")

    for col in ["phys_dt", "ct_dt", "order_dt", "needle_dt", "mt_dt", "swallow_dt"]:
        d[col] = rollover_if_before(d["triage_dt"], d[col])

    d["door_to_physician"] = (d["phys_dt"] - d["triage_dt"]).dt.total_seconds() / 60
    d["door_to_ct"] = (d["ct_dt"] - d["triage_dt"]).dt.total_seconds() / 60
    d["door_to_order"] = (d["order_dt"] - d["triage_dt"]).dt.total_seconds() / 60
    d["door_to_needle"] = (d["needle_dt"] - d["triage_dt"]).dt.total_seconds() / 60
    d["door_to_mt"] = (d["mt_dt"] - d["triage_dt"]).dt.total_seconds() / 60
    d["door_to_swallow"] = (d["swallow_dt"] - d["triage_dt"]).dt.total_seconds() / 60

    label_map = {
        "door_to_physician": "Door→Physician (min)",
        "door_to_ct": "Door→CT (min)",
        "door_to_order": "Door→Thrombolysis order (min)",
        "door_to_needle": "Door→Needle (min)",
        "door_to_mt": "Door→MT (min)",
        "door_to_swallow": "Door→Swallow screening (min)",
    }
    return d, label_map


def compute_kpis_trauma(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
    date_col = "Date of arrival"
    req_col = "if Transferred from another hospital, what is the date & time of request for transfer?"
    arr_col = "if Transferred from another hospital, what is the date & time of arrival?"
    dur_col = "Transfer to Arrival Time"
    mode_col = "Mode of arrival"

    d = df.copy()
    d["arrival_date"] = to_datetime_safe(d[date_col], dayfirst=False)

    d["transfer_request_dt"] = pd.to_datetime(d[req_col], errors="coerce", dayfirst=False)
    d["transfer_arrival_dt"] = pd.to_datetime(d[arr_col], errors="coerce", dayfirst=False)

    kpi = (d["transfer_arrival_dt"] - d["transfer_request_dt"]).dt.total_seconds() / 60
    mask = d["transfer_request_dt"].notna() & d["transfer_arrival_dt"].notna() & (d["transfer_arrival_dt"] < d["transfer_request_dt"])
    kpi.loc[mask] = (d.loc[mask, "transfer_arrival_dt"] + pd.Timedelta(days=1) - d.loc[mask, "transfer_request_dt"]).dt.total_seconds() / 60
    d["transfer_req_to_arrival"] = kpi

    d["transfer_duration_reported"] = d[dur_col].apply(parse_hhmm_duration_minutes)
    d["is_transferred"] = d[mode_col].astype(str).str.strip().str.lower().eq("transferred from another hospital")

    label_map = {
        "transfer_req_to_arrival": "Transfer request→arrival (min)",
        "transfer_duration_reported": "Transfer duration (reported) (min)",
    }
    return d, label_map


# ----------------------------
# Aggregation
# ----------------------------

def build_monthly_series(
    df: pd.DataFrame,
    date_series: pd.Series,
    kpi_col: str,
    *,
    target_minutes: Optional[float] = None,
    min_kpi: float = 0.0,
    max_kpi: Optional[float] = None,
    winsorize: bool = True,
) -> pd.DataFrame:
    d = df.copy()
    d["_date"] = pd.to_datetime(date_series, errors="coerce")
    d["_kpi"] = pd.to_numeric(d[kpi_col], errors="coerce")

    d.loc[d["_kpi"] < min_kpi, "_kpi"] = np.nan
    if max_kpi is not None:
        d.loc[d["_kpi"] > max_kpi, "_kpi"] = np.nan

    if winsorize:
        d["_kpi"] = winsorize_series(d["_kpi"], 0.01, 0.99)

    d = d.dropna(subset=["_date", "_kpi"])
    d["month"] = d["_date"].dt.to_period("M")

    def p90(x):
        return float(np.nanpercentile(x, 90)) if len(x) else np.nan

    g = d.groupby("month")["_kpi"]
    out = pd.DataFrame({
        "month": g.size().index,
        "n_cases": g.size().values.astype(int),
        "median_kpi": g.median().values,
        "p90_kpi": g.apply(p90).values,
        "mean_kpi": g.mean().values,
        "std_kpi": g.std().values,
    })
    out["month_start"] = out["month"].apply(period_to_timestamp)

    if target_minutes is not None:
        out["pct_within_target"] = d.groupby("month")["_kpi"].apply(lambda x: float(np.mean(x <= target_minutes))).values * 100.0
    else:
        out["pct_within_target"] = np.nan

    out = out.sort_values("month_start").reset_index(drop=True)
    return out


# ----------------------------
# ML Feature Engineering
# ----------------------------

def create_lag_features(df: pd.DataFrame, target_col: str, n_lags: int = 6) -> pd.DataFrame:
    """Create lag features for time series ML."""
    df = df.copy()
    
    # Lag features
    for lag in range(1, n_lags + 1):
        df[f"lag_{lag}"] = df[target_col].shift(lag)
    
    # Rolling statistics
    for window in [3, 6]:
        if len(df) >= window:
            df[f"rolling_mean_{window}"] = df[target_col].shift(1).rolling(window=window).mean()
            df[f"rolling_std_{window}"] = df[target_col].shift(1).rolling(window=window).std()
            df[f"rolling_min_{window}"] = df[target_col].shift(1).rolling(window=window).min()
            df[f"rolling_max_{window}"] = df[target_col].shift(1).rolling(window=window).max()
    
    # Trend features
    df["diff_1"] = df[target_col].diff(1).shift(1)
    df["diff_2"] = df[target_col].diff(2).shift(1)
    
    # Month of year (seasonality)
    df["month_of_year"] = df["month_start"].dt.month
    
    # Add volume and std as additional features if available
    if "n_cases" in df.columns:
        df["n_cases_lag1"] = df["n_cases"].shift(1)
    if "std_kpi" in df.columns:
        df["std_kpi_lag1"] = df["std_kpi"].shift(1)
    
    return df


def prepare_ml_data(df: pd.DataFrame, target_col: str = "median_kpi", n_lags: int = 6):
    """Prepare data for ML training."""
    df_features = create_lag_features(df, target_col, n_lags)
    
    # Drop rows with NaN values (due to lags)
    feature_cols = [c for c in df_features.columns if c not in 
                   ["month", "month_start", target_col, "pct_within_target"]]
    
    df_clean = df_features.dropna(subset=feature_cols + [target_col])
    
    X = df_clean[feature_cols].values
    y = df_clean[target_col].values
    
    return X, y, feature_cols, df_clean


# ----------------------------
# ML Models
# ----------------------------

class MLForecaster:
    """Machine Learning Forecaster with multiple model options."""
    
    def __init__(self):
        self.models = {}
        self.scaler = StandardScaler()
        self.best_model_name = None
        self.feature_cols = None
        
    def _get_models(self) -> Dict:
        """Get dictionary of models to train."""
        models = {
            "RandomForest": RandomForestRegressor(
                n_estimators=100,
                max_depth=5,
                min_samples_split=3,
                random_state=42
            ),
            "GradientBoosting": GradientBoostingRegressor(
                n_estimators=100,
                max_depth=3,
                learning_rate=0.1,
                random_state=42
            ),
            "Ridge": Ridge(alpha=1.0),
            "Lasso": Lasso(alpha=0.1),
        }
        
        if HAS_XGBOOST:
            models["XGBoost"] = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=3,
                learning_rate=0.1,
                random_state=42,
                verbosity=0
            )
        
        return models
    
    def train_and_evaluate(self, X: np.ndarray, y: np.ndarray, 
                          feature_cols: List[str]) -> pd.DataFrame:
        """Train all models and evaluate with time-series cross-validation."""
        self.feature_cols = feature_cols
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        models = self._get_models()
        results = []
        
        # For small datasets, adjust minimum training size
        min_train_size = min(3, max(1, len(X) - 2))
        
        for name, model in models.items():
            errors = []
            
            # Time series cross-validation
            for split_idx in range(min_train_size, len(X)):
                X_train, X_test = X_scaled[:split_idx], X_scaled[split_idx:split_idx+1]
                y_train, y_test = y[:split_idx], y[split_idx:split_idx+1]
                
                try:
                    model_copy = model.__class__(**model.get_params())
                    model_copy.fit(X_train, y_train)
                    pred = model_copy.predict(X_test)
                    errors.append(abs(pred[0] - y_test[0]))
                except Exception as e:
                    continue
            
            if errors:
                mae = np.mean(errors)
                rmse = np.sqrt(np.mean(np.array(errors) ** 2))
                results.append({
                    "model": name,
                    "mae": mae,
                    "rmse": rmse,
                    "n_folds": len(errors)
                })
                
                # Train final model on all data
                try:
                    model.fit(X_scaled, y)
                    self.models[name] = model
                except Exception:
                    pass
        
        if results:
            results_df = pd.DataFrame(results).sort_values("mae")
            self.best_model_name = results_df.iloc[0]["model"]
        else:
            results_df = pd.DataFrame()
            # Fallback: train models even without CV
            for name, model in models.items():
                try:
                    model.fit(X_scaled, y)
                    self.models[name] = model
                    if not self.best_model_name:
                        self.best_model_name = name
                except Exception:
                    pass
        
        return results_df
    
    def forecast_next(self, df: pd.DataFrame, target_col: str = "median_kpi", 
                       n_lags: int = 3) -> Tuple[Dict, pd.DataFrame]:
        """Forecast next period using all trained models."""
        if not self.models:
            raise ValueError("No models trained. Call train_and_evaluate first.")
        
        # Create features for the last row to predict next period
        df_features = create_lag_features(df, target_col, n_lags)
        
        # Use the same feature columns as training
        if self.feature_cols:
            # Ensure we only use the features that were used in training
            available_cols = [c for c in self.feature_cols if c in df_features.columns]
            missing_cols = [c for c in self.feature_cols if c not in df_features.columns]
            
            last_features = df_features[available_cols].iloc[-1:].copy()
            
            # Add missing columns with 0
            for col in missing_cols:
                last_features[col] = 0
            
            # Reorder to match training order
            last_features = last_features[self.feature_cols]
        else:
            feature_cols = [c for c in df_features.columns if c not in 
                           ["month", "month_start", target_col, "pct_within_target"]]
            last_features = df_features[feature_cols].iloc[-1:].copy()
        
        # Handle any NaN values
        for col in last_features.columns:
            if last_features[col].isna().any():
                # Use the column mean from the full dataframe
                mean_val = df_features[col].mean() if col in df_features.columns else 0
                last_features[col] = last_features[col].fillna(mean_val if not np.isnan(mean_val) else 0)
        
        X_next = last_features.values
        X_next_scaled = self.scaler.transform(X_next)
        
        forecasts = {}
        for name, model in self.models.items():
            try:
                pred = model.predict(X_next_scaled)[0]
                forecasts[name] = max(0, pred)  # KPI can't be negative
            except Exception as e:
                print(f"Warning: {name} prediction failed: {e}")
        
        # Get feature importance for tree-based models
        importance_df = pd.DataFrame()
        if self.best_model_name in ["RandomForest", "GradientBoosting", "XGBoost"]:
            best_model = self.models[self.best_model_name]
            if hasattr(best_model, 'feature_importances_'):
                importance_df = pd.DataFrame({
                    "feature": self.feature_cols if self.feature_cols else feature_cols,
                    "importance": best_model.feature_importances_
                }).sort_values("importance", ascending=False)
        
        return forecasts, importance_df


# ----------------------------
# Baseline Methods (for comparison)
# ----------------------------

def baseline_forecast_last3(series: pd.Series) -> float:
    """Baseline: median of last 3 available points."""
    s = series.dropna()
    if s.empty:
        return np.nan
    tail = s.iloc[-3:]
    return float(np.median(tail))


def baseline_naive(series: pd.Series) -> float:
    """Naive baseline: last observed value."""
    s = series.dropna()
    if s.empty:
        return np.nan
    return float(s.iloc[-1])


# ----------------------------
# Plotting
# ----------------------------

def plot_forecast_comparison(ts: pd.DataFrame, forecasts: Dict, label: str, 
                            out_png: str, best_model: str) -> None:
    """Plot historical data with all model forecasts."""
    fig, ax = plt.subplots(figsize=(14, 7))
    
    # Historical data
    ax.plot(ts["month_start"], ts["median_kpi"], 'b-o', linewidth=2, 
            markersize=8, label='Historical Median KPI')
    
    # Forecast point at next month
    if not ts["month_start"].empty and forecasts:
        last = ts["month_start"].max()
        next_m = next_month_start(pd.Timestamp(last))
        
        colors = plt.cm.Set2(np.linspace(0, 1, len(forecasts)))
        for (name, value), color in zip(forecasts.items(), colors):
            marker = '*' if name == best_model else 'o'
            size = 200 if name == best_model else 100
            ax.scatter([next_m], [value], s=size, c=[color], marker=marker, 
                      label=f'{name}: {value:.1f}', zorder=5)
    
    ax.set_xlabel('Month', fontsize=12)
    ax.set_ylabel('Minutes', fontsize=12)
    ax.set_title(f'{label}\nMonthly Median KPI with ML Forecasts', fontsize=14)
    ax.legend(loc='best', fontsize=10)
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(out_png, dpi=200, bbox_inches='tight')
    plt.close()


def plot_model_comparison(results_df: pd.DataFrame, out_png: str) -> None:
    """Plot model comparison bar chart."""
    if results_df.empty:
        return
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    x = np.arange(len(results_df))
    width = 0.35
    
    ax.bar(x - width/2, results_df['mae'], width, label='MAE', color='steelblue')
    ax.bar(x + width/2, results_df['rmse'], width, label='RMSE', color='coral')
    
    ax.set_xlabel('Model', fontsize=12)
    ax.set_ylabel('Error (minutes)', fontsize=12)
    ax.set_title('Model Comparison (Cross-Validation)', fontsize=14)
    ax.set_xticks(x)
    ax.set_xticklabels(results_df['model'], rotation=45, ha='right')
    ax.legend()
    ax.grid(True, alpha=0.3, axis='y')
    
    plt.tight_layout()
    plt.savefig(out_png, dpi=200, bbox_inches='tight')
    plt.close()


# ----------------------------
# Main
# ----------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", required=True, choices=["STEMI", "STROKE", "TRAUMA"])
    ap.add_argument("--input", required=True, help="Path to CSV/XLSX file")
    ap.add_argument("--kpi", required=True, help="KPI key (see printed options)")
    ap.add_argument("--target", type=float, default=None, help="Optional target minutes")
    ap.add_argument("--max_kpi", type=float, default=None, help="Optional hard max for KPI")
    ap.add_argument("--transferred_only", action="store_true", help="TRAUMA only: keep transferred rows only")
    ap.add_argument("--out_prefix", default="kpi_ml_forecast", help="Prefix for output files")
    ap.add_argument("--n_lags", type=int, default=3, help="Number of lag features (default: 3)")
    args = ap.parse_args()

    print(f"\n{'='*60}")
    print(f"ML-based KPI Forecasting")
    print(f"{'='*60}\n")

    df = read_table(args.input)
    print(f"Loaded {len(df)} rows from {args.input}")

    if args.dataset == "STEMI":
        df_kpi, label_map = compute_kpis_stemi(df)
        date_series = df_kpi["admit_date"]

    elif args.dataset == "STROKE":
        df_kpi, label_map = compute_kpis_stroke(df)
        date_series = df_kpi["admit_date"]

    else:  # TRAUMA
        # Logic same as original
        df_kpi, label_map = compute_kpis_trauma(df)
        date_series = df_kpi["arrival_date"]
        if args.transferred_only:
            df_kpi = df_kpi[df_kpi["is_transferred"]].copy()

    if args.kpi not in label_map:
        print("\nAvailable KPI keys for this dataset:")
        for k, v in label_map.items():
            print(f"  - {k}: {v}")
        raise SystemExit(f"\nUnknown KPI key: {args.kpi}")

    # Build monthly series
    ts = build_monthly_series(
        df_kpi,
        date_series=date_series,
        kpi_col=args.kpi,
        target_minutes=args.target,
        min_kpi=0.0,
        max_kpi=args.max_kpi,
        winsorize=True,
    )

    if ts.empty:
        raise SystemExit("No data points available after cleaning for this KPI.")

    print(f"\nMonthly time series: {len(ts)} months")
    print(f"Date range: {ts['month_start'].min()} to {ts['month_start'].max()}")
    print(f"Median KPI range: {ts['median_kpi'].min():.1f} to {ts['median_kpi'].max():.1f} minutes")

    # Check if enough data for ML
    min_required = args.n_lags + 3  # Need at least n_lags + a few for training
    if len(ts) < min_required:
        print(f"\nWarning: Only {len(ts)} months available. ML models need at least {min_required}.")
        print("Falling back to baseline methods only.\n")
        
        baseline_fc = baseline_forecast_last3(ts["median_kpi"])
        naive_fc = baseline_naive(ts["median_kpi"])
        
        forecasts = {
            "Baseline (Last-3 Median)": baseline_fc,
            "Naive (Last Value)": naive_fc
        }
        results_df = pd.DataFrame()
        importance_df = pd.DataFrame()
        best_model = "Baseline (Last-3 Median)"
    else:
        # Prepare ML data
        X, y, feature_cols, df_clean = prepare_ml_data(ts, "median_kpi", args.n_lags)
        print(f"\nML training data: {len(X)} samples, {len(feature_cols)} features")

        # Train and evaluate models
        forecaster = MLForecaster()
        results_df = forecaster.train_and_evaluate(X, y, feature_cols)
        
        print("\nModel Cross-Validation Results:")
        print(results_df.to_string(index=False))
        
        # Get forecasts
        forecasts, importance_df = forecaster.forecast_next(ts, "median_kpi", args.n_lags)
        best_model = forecaster.best_model_name
        
        # Add baseline for comparison
        forecasts["Baseline (Last-3)"] = baseline_forecast_last3(ts["median_kpi"])
        
        if not importance_df.empty:
            print(f"\nTop Feature Importances ({best_model}):")
            print(importance_df.head(10).to_string(index=False))

    # Output files
    out_xlsx = f"{args.out_prefix}_{args.dataset}_{args.kpi}.xlsx"
    out_png = f"{args.out_prefix}_{args.dataset}_{args.kpi}.png"
    out_comparison_png = f"{args.out_prefix}_{args.dataset}_{args.kpi}_models.png"

    # Plot
    plot_forecast_comparison(
        ts,
        forecasts,
        label=f"{args.dataset} — {label_map[args.kpi]}",
        out_png=out_png,
        best_model=best_model
    )

    if not results_df.empty:
        plot_model_comparison(results_df, out_comparison_png)

    # Summary
    last_month = ts["month_start"].max()
    forecast_month = next_month_start(pd.Timestamp(last_month))

    summary = pd.DataFrame([{
        "dataset": args.dataset,
        "kpi_key": args.kpi,
        "kpi_label": label_map[args.kpi],
        "n_months": int(ts.shape[0]),
        "last_month_start": str(pd.Timestamp(last_month).date()),
        "forecast_month_start": str(pd.Timestamp(forecast_month).date()),
        "best_model": best_model,
        **{f"forecast_{k}": v for k, v in forecasts.items()}
    }])

    # Save Excel
    with pd.ExcelWriter(out_xlsx, engine="openpyxl") as writer:
        df_kpi.to_excel(writer, index=False, sheet_name="case_level_with_kpi")
        ts.to_excel(writer, index=False, sheet_name="monthly_series")
        summary.to_excel(writer, index=False, sheet_name="forecast_summary")
        if not results_df.empty:
            results_df.to_excel(writer, index=False, sheet_name="model_evaluation")
        if not importance_df.empty:
            importance_df.to_excel(writer, index=False, sheet_name="feature_importance")

    print(f"\n{'='*60}")
    print("FORECAST SUMMARY")
    print(f"{'='*60}")
    print(f"Best Model: {best_model}")
    print(f"\nForecasts for {forecast_month.strftime('%B %Y')}:")
    for name, value in sorted(forecasts.items(), key=lambda x: x[1]):
        marker = "→" if name == best_model else " "
        print(f"  {marker} {name}: {value:.1f} minutes")
    
    print(f"\nSaved Excel: {out_xlsx}")
    print(f"Saved chart: {out_png}")
    if not results_df.empty:
        print(f"Saved model comparison: {out_comparison_png}")


if __name__ == "__main__":
    main()
