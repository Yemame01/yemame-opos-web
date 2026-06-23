#!/bin/bash
# set_package_prices.sh — view + set OPOS package prices in yemame-opos Firestore.
#
# Reads every package's current priceMinor, then (with --apply) upserts the tier
# set below. Prices are stored as priceMinor (pesewas): ₵1 = 100.
# A package with priceMinor 0 is "not sellable" — the store hides/blocks it.
#
# Auth: uses your gcloud access token (no service-account file needed).
#
#   ./scripts/set_package_prices.sh            # READ ONLY — show current prices
#   ./scripts/set_package_prices.sh --apply    # write the tiers below
#
# Adjust the TIERS array to change names / activations / prices.

set -euo pipefail

PROJECT="yemame-opos"
BASE="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents"

# id | name | activations | priceMinor(pesewas) | sortOrder
# Testing ladder: 1..5 activations at ₵1..₵5. Adjust counts/prices later (Hub).
TIERS=(
  "act1|Solo|1|100|1"
  "act2|Duo|2|200|2"
  "act3|Trio|3|300|3"
  "act4|Squad|4|400|4"
  "act5|Crew|5|500|5"
)

# Older packages to retire (hidden from the store, not deleted — keeps history).
RETIRE=("act10")

TOKEN="$(gcloud auth print-access-token 2>/dev/null)"
if [ -z "$TOKEN" ]; then
  echo "❌ No gcloud access token. Run: gcloud auth login" >&2
  exit 1
fi

echo "📦 Current OPOS packages (${PROJECT}):"
echo "------------------------------------------------------------"
curl -s "${BASE}/packages" -H "Authorization: Bearer ${TOKEN}" \
  | python3 -c '
import sys, json
docs = json.load(sys.stdin).get("documents", [])
if not docs:
    print("  (no packages found)")
for d in sorted(docs, key=lambda x: int(x.get("fields",{}).get("sortOrder",{}).get("integerValue",0))):
    f = d.get("fields", {})
    pid = d["name"].split("/")[-1]
    price = int(f.get("priceMinor",{}).get("integerValue", 0))
    acts  = f.get("activations",{}).get("integerValue", "?")
    name  = f.get("name",{}).get("stringValue", "")
    active= f.get("active",{}).get("booleanValue", False)
    cedis = "₵%.2f" % (price/100) if price>0 else "₵0 (hidden)"
    print(f"  {pid:<7} {name:<8} {acts:>3} activations  {cedis:<14} active={active}")
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

echo
echo "✍️  Applying tiers…"
for t in "${TIERS[@]}"; do
  IFS='|' read -r id name acts price sort <<< "$t"
  # Update only these fields (updateMask) so we never clobber currency/other data.
  curl -s -X PATCH \
    "${BASE}/packages/${id}?updateMask.fieldPaths=name&updateMask.fieldPaths=activations&updateMask.fieldPaths=priceMinor&updateMask.fieldPaths=currency&updateMask.fieldPaths=active&updateMask.fieldPaths=sortOrder" \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
    -d "{\"fields\":{\"name\":{\"stringValue\":\"${name}\"},\"activations\":{\"integerValue\":\"${acts}\"},\"priceMinor\":{\"integerValue\":\"${price}\"},\"currency\":{\"stringValue\":\"GHS\"},\"active\":{\"booleanValue\":true},\"sortOrder\":{\"integerValue\":\"${sort}\"}}}" \
    -o /dev/null -w "  ${id} (${name}, ₵$(echo "scale=2; $price/100" | bc)) -> %{http_code}\n"
done

# Retire old packages: set active=false so they vanish from the store (kept for history).
for id in "${RETIRE[@]:-}"; do
  [ -z "$id" ] && continue
  curl -s -X PATCH \
    "${BASE}/packages/${id}?updateMask.fieldPaths=active" \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
    -d "{\"fields\":{\"active\":{\"booleanValue\":false}}}" \
    -o /dev/null -w "  retire ${id} (hidden) -> %{http_code}\n"
done
echo "✅ Done. Re-run without --apply to verify."
