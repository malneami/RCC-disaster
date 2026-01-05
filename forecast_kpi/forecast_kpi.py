"""
Forecast next-month KPI from ED pathway datasets (STEMI / STROKE / TRAUMA).

What this script does:
1) Load case-level data (CSV or Excel).
2) Parse timestamps and compute KPI minutes.
3) Aggregate to MONTHLY series (median, p90, % within target, volume).
4) Clean outliers (winsorize) + remove impossible values.
5) Forecast next month using:
   - Baseline (last-3-month median), AND
   - ETS (Exponential Smoothing) if enough history
6) Backtest (rolling-origin) and export results + plots.

Dependencies:
  pip install pandas numpy openpyxl statsmodels matplotlib
"""

from __future__ import annotations

import argparse
import math
from dataclasses import dataclass
from typing import Dict, Optional, Tuple, List

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from statsmodels.tsa.holtwinters import ExponentialSmoothing


# ----------------------------
# Utilities
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
    """
    Parse hh:mm (or Excel-like fraction of day) into Timedelta.
    """
    if pd.isna(x):
        return pd.NaT

    # Excel fraction-of-day support
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
    """
    Build full datetime by combining admission date + hh:mm time.
    """
    td = time_series.apply(parse_time_to_timedelta)
    out = admit_date + td
    out = out.where(td.notna() & admit_date.notna(), pd.NaT)
    return out

def rollover_if_before(ref_dt: pd.Series, event_dt: pd.Series) -> pd.Series:
    """
    If event time occurs "before" ref time (cross-midnight), assume next day.
    """
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

@dataclass
class KPIConfig:
    name: str
    date_col: str
    kpi_defs: Dict[str, str]  # key -> human label


def compute_kpis_stemi(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
    # Column names (adjust if your sheet changes)
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

    # Many columns are hh:mm but some rows include date+time. We'll parse robustly:
    def parse_event_dt(series: pd.Series, admit_date: pd.Series) -> pd.Series:
        s = series.astype(str).str.strip().replace({"": np.nan, "nan": np.nan, "NaN": np.nan})
        mask_has_date = s.notna() & s.str.contains(r"[/\-]")
        out = pd.Series(pd.NaT, index=series.index, dtype="datetime64[ns]")

        if mask_has_date.any():
            out.loc[mask_has_date] = pd.to_datetime(s.loc[mask_has_date], errors="coerce", dayfirst=False)

        rem = ~mask_has_date
        # try excel-fractions + hh:mm
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

    # swallow is already full datetime string
    d["swallow_dt"] = pd.to_datetime(d[swallow_col], errors="coerce")

    # cross-midnight rollover relative to triage
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

    # Parse transfer datetimes
    d["transfer_request_dt"] = pd.to_datetime(d[req_col], errors="coerce", dayfirst=False)
    d["transfer_arrival_dt"] = pd.to_datetime(d[arr_col], errors="coerce", dayfirst=False)

    # KPI from datetimes (preferred)
    kpi = (d["transfer_arrival_dt"] - d["transfer_request_dt"]).dt.total_seconds() / 60
    # rollover midnight
    mask = d["transfer_request_dt"].notna() & d["transfer_arrival_dt"].notna() & (d["transfer_arrival_dt"] < d["transfer_request_dt"])
    kpi.loc[mask] = (d.loc[mask, "transfer_arrival_dt"] + pd.Timedelta(days=1) - d.loc[mask, "transfer_request_dt"]).dt.total_seconds() / 60
    d["transfer_req_to_arrival"] = kpi

    # reported duration fallback
    d["transfer_duration_reported"] = d[dur_col].apply(parse_hhmm_duration_minutes)

    # if you want transferred-only:
    d["is_transferred"] = d[mode_col].astype(str).str.strip().str.lower().eq("transferred from another hospital")

    label_map = {
        "transfer_req_to_arrival": "Transfer request→arrival (min)",
        "transfer_duration_reported": "Transfer duration (reported) (min)",
    }
    return d, label_map


# ----------------------------
# Aggregation + Forecasting
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
    """
    Create monthly time series features:
      - n_cases
      - median_kpi
      - p90_kpi
      - pct_within_target (if target_minutes provided)
    """
    d = df.copy()
    d["_date"] = pd.to_datetime(date_series, errors="coerce")
    d["_kpi"] = pd.to_numeric(d[kpi_col], errors="coerce")

    # remove impossible
    d.loc[d["_kpi"] < min_kpi, "_kpi"] = np.nan
    if max_kpi is not None:
        d.loc[d["_kpi"] > max_kpi, "_kpi"] = np.nan

    # winsorize (helps outliers)
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
    })
    out["month_start"] = out["month"].apply(period_to_timestamp)

    if target_minutes is not None:
        out["pct_within_target"] = d.groupby("month")["_kpi"].apply(lambda x: float(np.mean(x <= target_minutes))).values * 100.0
    else:
        out["pct_within_target"] = np.nan

    out = out.sort_values("month_start").reset_index(drop=True)
    return out


def baseline_forecast_last3(series: pd.Series) -> float:
    """Baseline: median of last 3 available points (or fewer if not available)."""
    s = series.dropna()
    if s.empty:
        return np.nan
    tail = s.iloc[-3:]
    return float(np.median(tail))

def ets_forecast(series: pd.Series, seasonal: Optional[str] = None) -> Tuple[float, object]:
    """
    ETS forecast (Exponential Smoothing).
    For monthly KPI medians with short history, prefer no seasonality.
    """
    s = series.dropna()
    if len(s) < 6:
        return np.nan, None

    model = ExponentialSmoothing(
        s,
        trend="add",
        seasonal=seasonal,           # None for short history; "add" if you have >=24 months
        seasonal_periods=12 if seasonal else None,
        initialization_method="estimated",
    ).fit(optimized=True)

    fc = float(model.forecast(1).iloc[0])
    return fc, model

def rolling_backtest(
    y: pd.Series,
    *,
    min_train: int = 6,
    use_ets: bool = True,
) -> pd.DataFrame:
    """
    Rolling-origin backtest predicting t+1 from data up to t.
    Returns errors for baseline and ETS.
    """
    y = y.dropna()
    if len(y) < (min_train + 2):
        return pd.DataFrame()

    rows = []
    for end in range(min_train, len(y) - 1):
        train = y.iloc[:end]
        actual = float(y.iloc[end])

        b = baseline_forecast_last3(train)

        ets_fc = np.nan
        if use_ets:
            try:
                ets_fc, _ = ets_forecast(train, seasonal=None)
            except Exception:
                ets_fc = np.nan

        rows.append({
            "train_end_index": end - 1,
            "actual": actual,
            "baseline_fc": b,
            "ets_fc": ets_fc,
            "baseline_abs_err": abs(actual - b) if not np.isnan(b) else np.nan,
            "ets_abs_err": abs(actual - ets_fc) if not np.isnan(ets_fc) else np.nan,
        })

    return pd.DataFrame(rows)

def bootstrap_interval_from_residuals(model, steps=1, n_boot=2000, alpha=0.10) -> Tuple[float, float]:
    """
    Simple bootstrap interval for ETS forecast using in-sample residuals.
    """
    if model is None:
        return (np.nan, np.nan)

    resid = np.asarray(model.resid)
    resid = resid[np.isfinite(resid)]
    if resid.size < 5:
        return (np.nan, np.nan)

    base_fc = float(model.forecast(steps).iloc[-1])
    sim = base_fc + np.random.choice(resid, size=n_boot, replace=True)
    lo = float(np.quantile(sim, alpha / 2))
    hi = float(np.quantile(sim, 1 - alpha / 2))
    return lo, hi


# ----------------------------
# Plotting + Export
# ----------------------------

def plot_series_with_forecast(ts: pd.DataFrame, label: str, out_png: str, fc_value: float, fc_label: str,
                             fc_lo: Optional[float] = None, fc_hi: Optional[float] = None) -> None:
    plt.figure(figsize=(12, 6))
    plt.plot(ts["month_start"], ts["median_kpi"], marker="o", linewidth=2)
    plt.title(f"{label} — Monthly median KPI")
    plt.xlabel("Month")
    plt.ylabel("Minutes")

    # Forecast point at next month start
    if not ts["month_start"].empty and not np.isnan(fc_value):
        last = ts["month_start"].max()
        next_m = next_month_start(pd.Timestamp(last))
        plt.scatter([next_m], [fc_value], s=80)
        plt.annotate(fc_label, (next_m, fc_value), textcoords="offset points", xytext=(10, 10))

        if fc_lo is not None and fc_hi is not None and np.isfinite(fc_lo) and np.isfinite(fc_hi):
            plt.vlines(next_m, fc_lo, fc_hi, linewidth=3)
            plt.annotate(f"{int(fc_lo)}–{int(fc_hi)}", (next_m, fc_hi), textcoords="offset points", xytext=(10, 0))

    plt.tight_layout()
    plt.savefig(out_png, dpi=200, bbox_inches="tight")
    plt.close()


# ----------------------------
# Main
# ----------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", required=True, choices=["STEMI", "STROKE", "TRAUMA"])
    ap.add_argument("--input", required=True, help="Path to CSV/XLSX file")
    ap.add_argument("--kpi", required=True, help="KPI key (see printed options)")
    ap.add_argument("--target", type=float, default=None, help="Optional target minutes for % within target")
    ap.add_argument("--max_kpi", type=float, default=None, help="Optional hard max for KPI minutes (filter above)")
    ap.add_argument("--transferred_only", action="store_true", help="TRAUMA only: keep transferred rows only")
    ap.add_argument("--out_prefix", default="kpi_forecast", help="Prefix for output files")
    args = ap.parse_args()

    df = read_table(args.input)

    if args.dataset == "STEMI":
        df_kpi, label_map = compute_kpis_stemi(df)
        date_series = df_kpi["admit_date"]

    elif args.dataset == "STROKE":
        df_kpi, label_map = compute_kpis_stroke(df)
        date_series = df_kpi["admit_date"]

    else:  # TRAUMA
        # Note: Trauma logic is same
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

    # Forecast
    y = ts["median_kpi"]
    baseline_fc = baseline_forecast_last3(y)
    ets_fc, ets_model = (np.nan, None)
    if len(y.dropna()) >= 6:
        try:
            ets_fc, ets_model = ets_forecast(y, seasonal=None)
        except Exception:
            ets_fc, ets_model = (np.nan, None)

    # Choose best by backtest (if possible)
    bt = rolling_backtest(y, min_train=6, use_ets=True)
    choice = "baseline"
    if not bt.empty:
        b_mae = float(np.nanmean(bt["baseline_abs_err"]))
        e_mae = float(np.nanmean(bt["ets_abs_err"]))
        # prefer lower MAE when available
        if np.isfinite(e_mae) and (not np.isfinite(b_mae) or e_mae < b_mae):
            choice = "ets"

    final_fc = ets_fc if choice == "ets" else baseline_fc
    final_method = "ETS (Exp. Smoothing)" if choice == "ets" else "Baseline (last-3 median)"

    # Interval (ETS bootstrap if ETS selected)
    lo, hi = (np.nan, np.nan)
    if choice == "ets" and ets_model is not None:
        lo, hi = bootstrap_interval_from_residuals(ets_model, n_boot=2000, alpha=0.10)

    # Export
    out_xlsx = f"{args.out_prefix}_{args.dataset}_{args.kpi}.xlsx"
    out_png = f"{args.out_prefix}_{args.dataset}_{args.kpi}.png"

    # Plot
    plot_series_with_forecast(
        ts,
        label=f"{args.dataset} — {label_map[args.kpi]}",
        out_png=out_png,
        fc_value=final_fc,
        fc_label=f"{final_method}: {final_fc:.1f}",
        fc_lo=lo,
        fc_hi=hi,
    )

    # Summary table
    last_month = ts["month_start"].max()
    forecast_month = next_month_start(pd.Timestamp(last_month))

    summary = pd.DataFrame([{
        "dataset": args.dataset,
        "kpi_key": args.kpi,
        "kpi_label": label_map[args.kpi],
        "n_months": int(ts.shape[0]),
        "last_month_start": str(pd.Timestamp(last_month).date()),
        "forecast_month_start": str(pd.Timestamp(forecast_month).date()),
        "baseline_forecast": baseline_fc,
        "ets_forecast": ets_fc,
        "chosen_method": final_method,
        "chosen_forecast": final_fc,
        "ets_interval_90_lo": lo,
        "ets_interval_90_hi": hi,
    }])

    with pd.ExcelWriter(out_xlsx, engine="openpyxl") as writer:
        df_kpi.to_excel(writer, index=False, sheet_name="case_level_with_kpi")
        ts.to_excel(writer, index=False, sheet_name="monthly_series")
        summary.to_excel(writer, index=False, sheet_name="forecast_summary")
        if not bt.empty:
            bt.to_excel(writer, index=False, sheet_name="backtest")

    print("\n=== Forecast summary ===")
    print(summary.to_string(index=False))
    print(f"\nSaved Excel: {out_xlsx}")
    print(f"Saved chart: {out_png}")


if __name__ == "__main__":
    main()
