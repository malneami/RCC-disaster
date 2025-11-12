#!/bin/bash

# Master Test Script - Runs all access logs tests
# Usage: ./run-all-access-logs-tests.sh

set -e

echo "============================================================"
echo "PATIENT ACCESS LOGS - MASTER TEST SUITE"
echo "============================================================"
echo ""

cd "$(dirname "$0")/.."

# Check if backend is running
echo "Checking backend status..."
if ! curl -s http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    echo "❌ Backend is not running!"
    echo "Please start the backend first: npm run dev"
    exit 1
fi

echo "✅ Backend is running"
echo ""

# Run comprehensive tests
echo "============================================================"
echo "Running Comprehensive Test Suite..."
echo "============================================================"
node scripts/test-access-logs-comprehensive.js
COMPREHENSIVE_EXIT=$?

echo ""
echo "============================================================"
echo "Running Production-Ready Test Suite..."
echo "============================================================"
node scripts/test-access-logs-production-ready.js
PRODUCTION_EXIT=$?

echo ""
echo "============================================================"
echo "FINAL RESULTS"
echo "============================================================"

if [ $COMPREHENSIVE_EXIT -eq 0 ] && [ $PRODUCTION_EXIT -eq 0 ]; then
    echo "✅ ALL TESTS PASSED!"
    echo ""
    echo "Comprehensive Tests: ✅ PASSED"
    echo "Production Tests: ✅ PASSED"
    echo ""
    echo "Status: PRODUCTION READY 🚀"
    exit 0
else
    echo "❌ SOME TESTS FAILED"
    echo ""
    [ $COMPREHENSIVE_EXIT -ne 0 ] && echo "Comprehensive Tests: ❌ FAILED"
    [ $PRODUCTION_EXIT -ne 0 ] && echo "Production Tests: ❌ FAILED"
    echo ""
    exit 1
fi

