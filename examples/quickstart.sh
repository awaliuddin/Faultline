#!/usr/bin/env bash
# Faultline Quick Start — 3 commands from zero to compliance report

set -euo pipefail

echo "=== Step 1: Install ==="
npm install

echo ""
echo "=== Step 2: Scan (using mock provider — no API key needed) ==="
npx tsx cli/index.ts scan --input examples/sample.txt --provider mock > examples/results.json
echo "Scan complete. Results saved to examples/results.json"

echo ""
echo "=== Step 3: Read Report ==="
npx tsx cli/index.ts report --input examples/results.json
