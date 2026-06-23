#!/bin/bash
# set_package_prices.sh — view + set OPOS packages in adminConfig/general.packages.
#
# Architecture: pricing lives as a `packages` array on the adminConfig/general
# doc (admin-managed, like yemame-pos). Prices are priceMinor (pesewas): ₵1 = 100.
# A package with priceMinor 0 is "not sellable" — the store hides/blocks it.
#
# Auth: uses your gcloud access token (no service-account file needed).
#
#   ./scripts/set_package_prices.sh            # READ ONLY — show current packages
#   ./scripts/set_package_prices.sh --apply    # write the tiers below
#
# Adjust the TIERS array to change names / activations / prices.

set -euo pipefail

PROJECT="yemame-opos"
DOC="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/adminConfig/general"

# id | name | activations | priceMinor(pesewas) | sortOrder
# Testing ladder: 1..5 activations at ₵1..₵5. Adjust later anytime.
TIERS=(
  "act1|Solo|1|100|1"
  "act2|Duo|2|200|2"
  "act3|Trio|3|300|3"
  "act4|Squad|4|400|4"
  "act5|Crew|5|500|5"
)

TOKEN="$(gcloud auth print-access-token 2>/dev/null)"
if [ -z "$TOKEN" ]; then
  echo "❌ No gcloud access token. Run: gcloud auth login" >&2
  exit 1
fi

echo "📦 Current adminConfig/general.packages (${PROJECT}):"
echo "------------------------------------------------------------"
curl -s "${DOC}" -H "Authorization: Bearer ${TOKEN}" \
  | python3 -c '
import sys, json
d = json.load(sys.stdin)
if "error" in d:
    print("  (adminConfig/general not found yet)"); sys.exit(0)
arr = d.get("fields", {}).get("packages", {}).get("arrayValue", {}).get("values", [])
if not arr:
    print("  (no packages array yet)")
def g(m, k):
    v = m.get(k, {})
    return v.get("integerValue") or v.get("stringValue") or v.get("booleanValue")
rows = [it.get("mapValue", {}).get("fields", {}) for it in arr]
for m in sorted(rows, key=lambda x: int(g(x, "sortOrder") or 0)):
    price = int(g(m, "priceMinor") or 0)
    cedis = ("₵%.2f" % (price/100)) if price > 0 else "₵0 (hidden)"
    pid = str(g(m, "id")); name = str(g(m, "name"))
    acts = str(g(m, "activations")); active = g(m, "active")
    print("  %-7s %-8s %3s acts  %-14s active=%s" % (pid, name, acts, cedis, active))
'
echo "------------------------------------------------------------"

if [ "${1:-}" != "--apply" ]; then
  echo
  echo "ℹ️  Read-only. Re-run with --apply to write these tiers:"
  for t in "${TIERS[@]}"; do
    IFS='|' read -r id name acts price sort <<< "$t"
    printf "     %-7s %-8s %3s acts  ₵%.2f\n" "$id" "$name" "$acts" "$(echo "scale=2; $price/100" | bc)"
  done
  exit 0
fi

# Build the Firestore arrayValue JSON for the packages field.
build_array() {
  python3 - "$@" <<'PY'
import sys, json
vals = []
for t in sys.argv[1:]:
    pid, name, acts, price, sort = t.split("|")
    vals.append({"mapValue": {"fields": {
        "id": {"stringValue": pid},
        "name": {"stringValue": name},
        "activations": {"integerValue": acts},
        "priceMinor": {"integerValue": price},
        "currency": {"stringValue": "GHS"},
        "active": {"booleanValue": True},
        "sortOrder": {"integerValue": sort},
    }}})
print(json.dumps({"fields": {"packages": {"arrayValue": {"values": vals}}}}))
PY
}

echo
echo "✍️  Writing adminConfig/general.packages…"
BODY="$(build_array "${TIERS[@]}")"
# updateMask=packages so we only touch the packages field (keep other config).
curl -s -X PATCH "${DOC}?updateMask.fieldPaths=packages" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
  -d "${BODY}" \
  -o /dev/null -w "  adminConfig/general.packages -> %{http_code}\n"
echo "✅ Done. Re-run without --apply to verify."
