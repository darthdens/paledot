#!/usr/bin/env bash
# Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
set -euo pipefail
here="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
destination="${1:-$here}"
mkdir -p "$destination"
for body in moon mars mercury; do
  lovable-assets get --file "$here/$body-height.webp.asset.json" --output "$destination/$body-height.webp"
done
