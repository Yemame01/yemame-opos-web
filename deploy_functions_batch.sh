#!/bin/bash

# Yemame OPOS — Firebase Functions Batch Deployment Script
# Mirrors yemame-pos/deploy_functions_batch.sh, adapted for the yemame-opos project.
# Deploys Cloud Functions in batches to avoid timeouts/quota errors.

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; MAGENTA='\033[0;35m'; NC='\033[0m'

# Configuration
BATCH_SIZE=5
PROJECT="yemame-opos"
FUNCTIONS_DIR="functions"

# All deployable functions (keep updated when adding/removing functions).
ALL_FUNCTIONS=(
  # Licensing (app-facing)
  "activateLicense"
  "activateLicenseHttp"

  # Payment webhook (Paystack → gateway → here)
  "paystackWebhook"

  # Fallback fulfillment by reference (missed-webhook safety net)
  "fulfillPaymentByReference"
  "adminReissueByReference"

  # Admin (Hub-facing, admin-claim gated)
  "adminListLicenses"
  "adminRevokeLicense"
  "adminRestoreLicense"
  "adminAdjustActivations"
  "adminIssueLicense"
)

display_header() {
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}   Yemame OPOS - Firebase Functions Batch Deployment${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}   Project: ${PROJECT}${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo ""
}

deploy_batch() {
  local batch_number=$1
  local start_idx=$(( (batch_number - 1) * BATCH_SIZE ))
  local end_idx=$(( start_idx + BATCH_SIZE - 1 ))
  local total=${#ALL_FUNCTIONS[@]}
  if [ $end_idx -ge $total ]; then end_idx=$(( total - 1 )); fi
  if [ $start_idx -ge $total ]; then
    echo -e "${RED}Error: Batch $batch_number does not exist${NC}"; exit 1
  fi
  local fns=()
  for ((i=start_idx; i<=end_idx; i++)); do fns+=("functions:${ALL_FUNCTIONS[$i]}"); done
  echo -e "${GREEN}Deploying Batch $batch_number...${NC}"
  for f in "${fns[@]}"; do echo "  ${CYAN}•${NC} ${f#functions:}"; done
  local list=$(IFS=,; echo "${fns[*]}")
  cd "$FUNCTIONS_DIR" || exit 1
  firebase deploy --only "$list" --project "$PROJECT"
  cd ..
}

deploy_all_batches() {
  local total=${#ALL_FUNCTIONS[@]}
  local batches=$(( (total + BATCH_SIZE - 1) / BATCH_SIZE ))
  echo -e "${YELLOW}Deploying all $batches batch(es) sequentially...${NC}\n"
  for ((b=1; b<=batches; b++)); do
    echo -e "${CYAN}━━━ Batch $b of $batches ━━━${NC}"
    deploy_batch $b
    if [ $b -lt $batches ]; then echo -e "${YELLOW}Waiting 10s…${NC}"; sleep 10; fi
  done
  echo -e "\n${GREEN}✅ All batches deployed successfully!${NC}"
}

deploy_specific_functions() {
  local fns=()
  for name in "$@"; do
    if [[ " ${ALL_FUNCTIONS[@]} " =~ " ${name} " ]]; then
      fns+=("functions:${name}")
    else
      echo -e "${RED}Warning: '${name}' not in list. Skipping.${NC}"
    fi
  done
  [ ${#fns[@]} -eq 0 ] && { echo -e "${RED}No valid functions.${NC}"; exit 1; }
  local list=$(IFS=,; echo "${fns[*]}")
  cd "$FUNCTIONS_DIR" || exit 1
  firebase deploy --only "$list" --project "$PROJECT"
  cd ..
}

display_header
[ ! -d "$FUNCTIONS_DIR" ] && { echo -e "${RED}functions dir not found${NC}"; exit 1; }

case "${1:-}" in
  all) deploy_all_batches ;;
  batch) [ -z "$2" ] && { echo "Usage: $0 batch <n>"; exit 1; }; deploy_batch "$2" ;;
  specific) shift; deploy_specific_functions "$@" ;;
  list|ls)
    echo "Functions:"; for f in "${ALL_FUNCTIONS[@]}"; do echo "  • $f"; done ;;
  *)
    echo "Usage: $0 {all|batch <n>|specific <names>|list}" ;;
esac
