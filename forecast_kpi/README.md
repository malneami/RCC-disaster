# KPI Forecasting System

This project provides tools to forecast Key Performance Indicators (KPIs) for Emergency Department pathways (STEMI, STROKE, TRAUMA) using historical data.

It contains two main approaches:
1. **Statistical Forecasting** (`forecast_kpi.py`) - Recommended for current use.
2. **Machine Learning Forecasting** (`forecast_kpi_ml.py`) - Experimental, for future use with more data.

---

## 1. Statistical Forecasting (`forecast_kpi.py`)

### The Idea
This script uses robust statistical methods suitable for shorter time series (common in medical data). It aggregates daily case-level data into monthly metrics (median, 90th percentile) and forecasts the next month.

**Methods used:**
*   **Baseline**: Median of the last 3 months. This is very robust to noise and works well when you have < 12 months of data.
*   **ETS (Exponential Smoothing)**: A standard time-series model that weights recent observations more heavily. Used when >= 6 months of data are available.

### Usage
Run this script to generate reliable short-term forecasts.

```bash
# Basic usage
python forecast_kpi.py --dataset STEMI --input "data.csv" --kpi door_to_ecg

# Specify a target value (e.g., 10 minutes) for % compliance
python forecast_kpi.py --dataset STEMI --input "data.csv" --kpi door_to_ecg --target 10
```

---

## 2. ML Forecasting (`forecast_kpi_ml.py`)

### The Idea
This script treats forecasting as a supervised machine learning problem. It creates "lag features" (e.g., *what was the KPI 1 month ago? 2 months ago?*) and trains models like Random Forest, Gradient Boosting, and Ridge Regression to predict the next month.

**Why use this?**
*   Can capture complex, non-linear patterns.
*   Can learn relationships between volume (`n_cases`) and performance.
*   More powerful when extensive history (> 24 months) is available.

### Usage
The arguments are identical to the statistical script, making it easy to switch.

```bash
python forecast_kpi_ml.py --dataset STROKE --input "data.csv" --kpi door_to_ct
```

---

## Comparision & Future Roadmap

| Feature | `forecast_kpi.py` | `forecast_kpi_ml.py` |
|---------|-------------------|----------------------|
| **Best for...** | Short history (< 18 months) | Long history (> 24 months) |
| **Complexity** | Low (Robust) | High (Flexible) |
| **Risk of Overfitting** | Very Low | High (with small data) |
| **Current Recommendation** | **✅ Primary Tool** | ⚠️ Experimental |

### Future Recommendations (Data Sufficiency)
As detailed in the `data_sufficiency_report.md`, current datasets (~9 months) are **insufficient** for reliable Machine Learning.

**When sufficient data IS available (18+ months):**
1.  **Switch to ML**: You can transition to using `forecast_kpi_ml.py` as your primary tool.
2.  **Seasonality**: The ML models will begin to detect annual patterns (e.g., winter surges).
3.  **New Features**:
    *   Add **Holiday flags** (e.g., `is_holiday` column).
    *   Add **Staffing levels** if available.
    *   Explore **LSTM (Deep Learning)** models if you reach > 3-4 years of data.

---

## Installation

Dependencies for both scripts:

```bash
pip install pandas numpy openpyxl statsmodels matplotlib scikit-learn xgboost
```
*(Note: `xgboost` is optional for the ML script but recommended)*

## Supported Datasets & KPIs

**STEMI**:
*   `door_to_ecg`
*   `door_to_needle`
*   `door_to_balloon`

**STROKE**:
*   `door_to_ct`
*   `door_to_needle`
*   `door_to_physician`

**TRAUMA**:
*   `transfer_req_to_arrival`
*   `transfer_duration_reported`
