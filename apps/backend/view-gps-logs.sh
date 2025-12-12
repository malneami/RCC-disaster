#!/bin/bash

# GPS Tracking Log Viewer
# Usage: ./view-gps-logs.sh [options]
# Options:
#   -t, --tail N    Show last N lines (default: 50)
#   -f, --follow    Follow log file (like tail -f)
#   -e, --errors    Show error log only
#   -s, --search   Search for specific term

LOGS_DIR="logs"
MAIN_LOG="$LOGS_DIR/gps-tracking.log"
ERROR_LOG="$LOGS_DIR/gps-tracking-error.log"

# Default to showing last 50 lines
LINES=50
FOLLOW=false
SHOW_ERRORS=false
SEARCH_TERM=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--tail)
      LINES="$2"
      shift 2
      ;;
    -f|--follow)
      FOLLOW=true
      shift
      ;;
    -e|--errors)
      SHOW_ERRORS=true
      shift
      ;;
    -s|--search)
      SEARCH_TERM="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [-t N] [-f] [-e] [-s term]"
      exit 1
      ;;
  esac
done

# Check if log files exist
if [ ! -f "$MAIN_LOG" ] && [ ! -f "$ERROR_LOG" ]; then
  echo "❌ Log files not found in $LOGS_DIR/"
  echo "Make sure the application is running and generating logs."
  exit 1
fi

# Show file info
echo "📁 Log files location: $(pwd)/$LOGS_DIR/"
echo ""

if [ "$SHOW_ERRORS" = true ]; then
  if [ -f "$ERROR_LOG" ]; then
    echo "📋 Error Log ($ERROR_LOG):"
    if [ "$FOLLOW" = true ]; then
      tail -f "$ERROR_LOG"
    elif [ -n "$SEARCH_TERM" ]; then
      grep -i "$SEARCH_TERM" "$ERROR_LOG" | tail -n "$LINES"
    else
      tail -n "$LINES" "$ERROR_LOG"
    fi
  else
    echo "No errors logged yet."
  fi
else
  if [ -f "$MAIN_LOG" ]; then
    echo "📋 Main Log ($MAIN_LOG):"
    if [ "$FOLLOW" = true ]; then
      tail -f "$MAIN_LOG"
    elif [ -n "$SEARCH_TERM" ]; then
      grep -i "$SEARCH_TERM" "$MAIN_LOG" | tail -n "$LINES"
    else
      tail -n "$LINES" "$MAIN_LOG"
    fi
  fi
fi

