#!/bin/bash

set -euo pipefail

# Defaults (override with env vars at runtime)
PROJECT_ID="${PROJECT_ID:-yemame-opos}"
REGION="${REGION:-us-central1}"
KEEP_COUNT="${KEEP_COUNT:-1}"
DRY_RUN="${DRY_RUN:-false}"

# Cost optimization flags (safe defaults)
AUDIT_MIN_INSTANCES="${AUDIT_MIN_INSTANCES:-true}"
SET_MIN_INSTANCES_ZERO="${SET_MIN_INSTANCES_ZERO:-false}"
SHOW_REVISION_STORAGE_HINTS="${SHOW_REVISION_STORAGE_HINTS:-true}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Required command not found: $1"
    exit 1
  fi
}

delete_revision() {
  local revision_name="$1"

  if [ "$DRY_RUN" = "true" ]; then
    echo "      [dry-run] Would delete: $revision_name"
    return
  fi

  gcloud run revisions delete "$revision_name" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --quiet
}

set_min_instances_zero() {
  local service_name="$1"

  if [ "$DRY_RUN" = "true" ]; then
    echo "      [dry-run] Would set min instances to 0 for: $service_name"
    return
  fi

  gcloud run services update "$service_name" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --min-instances=0 \
    --quiet >/dev/null
}

get_min_instances() {
  local service_name="$1"
  local min_instances

  min_instances=$(gcloud run services describe "$service_name" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(spec.template.metadata.annotations.autoscaling.knative.dev/minScale)" 2>/dev/null || true)

  if [ -z "$min_instances" ]; then
    echo "0"
  else
    echo "$min_instances"
  fi
}

echo "🧹 Cleaning up old Cloud Run revisions..."
echo "📦 Project: $PROJECT_ID"
echo "🌎 Region: $REGION"
echo "🧪 Dry run: $DRY_RUN"
echo "⚙️  KEEP_COUNT: $KEEP_COUNT"
echo "⚙️  AUDIT_MIN_INSTANCES: $AUDIT_MIN_INSTANCES"
echo "⚙️  SET_MIN_INSTANCES_ZERO: $SET_MIN_INSTANCES_ZERO"
echo "🔒 This only removes old Cloud Run revisions, NOT container images"
echo "----------------------------------------------------------"

require_command gcloud

# Set the quota project first so gcloud doesn't warn about mismatch when the
# active project is updated below.
echo "🔧 Setting quota project..."
gcloud auth application-default set-quota-project "$PROJECT_ID" --quiet >/dev/null 2>&1 || true

# Set the gcloud project to ensure we're working with the right one.
echo "🔧 Setting project context..."
gcloud config set project "$PROJECT_ID" --quiet >/dev/null

echo ""
echo "Cleaning up old Cloud Run revisions..."
echo "----------------------------------------------------------"

# Get all Cloud Run services
services=()
while IFS= read -r service; do
  if [ -n "$service" ]; then
    services+=("$service")
  fi
done < <(
  gcloud run services list \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(metadata.name)"
)

if [ ${#services[@]} -eq 0 ]; then
  echo "ℹ️  No Cloud Run services found in $PROJECT_ID/$REGION"
  exit 0
fi

echo "📋 Found ${#services[@]} Cloud Run service(s)"

for service in "${services[@]}"; do
  echo ""
  echo "🔍 Checking service: $service"

  # Get list of revisions sorted by creation (oldest → newest)
  revisions=()
  while IFS= read -r revision; do
    if [ -n "$revision" ]; then
      revisions+=("$revision")
    fi
  done < <(
    gcloud run revisions list \
      --service="$service" \
      --region="$REGION" \
      --project="$PROJECT_ID" \
      --sort-by=metadata.creationTimestamp \
      --format="value(metadata.name)"
  )

  # Count total revisions
  total_revisions=${#revisions[@]}
  echo "   Total revisions: $total_revisions"

  if [ "$total_revisions" -eq 0 ]; then
    echo "   ℹ️  No revisions found for $service"
    continue
  fi

  # Calculate how many to delete
  if [ "$total_revisions" -le "$KEEP_COUNT" ]; then
    echo "   ✅ Only $total_revisions revision(s), no cleanup needed"
    continue
  fi

  delete_count=$((total_revisions - KEEP_COUNT))

  # Get old revisions (all except the newest KEEP_COUNT)
  old_revisions=("${revisions[@]:0:delete_count}")

  if [ ${#old_revisions[@]} -eq 0 ]; then
    echo "   ✅ No old revisions to delete"
  else
    echo "   🗑️  Deleting $delete_count old revision(s)..."
    for rev in "${old_revisions[@]}"; do
      echo "      Deleting: $rev"
      delete_revision "$rev"
    done
    echo "   ✅ Cleanup done for $service"
  fi
done

if [ "$AUDIT_MIN_INSTANCES" = "true" ]; then
  echo ""
  echo "Auditing Cloud Run min instances..."
  echo "----------------------------------------------------------"

  services_with_min=0

  for service in "${services[@]}"; do
    min_instances=$(get_min_instances "$service")

    if [ "$min_instances" != "0" ]; then
      services_with_min=$((services_with_min + 1))
      echo "⚠️  $service has min instances set to $min_instances"

      if [ "$SET_MIN_INSTANCES_ZERO" = "true" ]; then
        echo "   → Setting min instances to 0"
        set_min_instances_zero "$service"
      else
        echo "   → No change (set SET_MIN_INSTANCES_ZERO=true to auto-fix)"
      fi
    else
      echo "✅ $service min instances = 0"
    fi
  done

  if [ "$services_with_min" -eq 0 ]; then
    echo "✅ All services already have min instances = 0"
  fi
fi

echo ""
echo "🎯 All done! Old Cloud Run revisions cleaned up."

if [ "$SHOW_REVISION_STORAGE_HINTS" = "true" ]; then
  echo ""
  echo "💡 Additional cost notes:"
  echo "- Revision cleanup reduces clutter but usually not runtime cost by itself"
  echo "- Biggest wins: min instances, logging volume, and Artifact Registry cleanup"
  echo "- To inspect Artifact Registry images:"
  echo "  gcloud artifacts repositories list --project=$PROJECT_ID"
fi

echo ""
echo "Note: To clean up container images (which consume storage quota),"
echo "please use the GCP Console manually to avoid accidental deletions:"
echo "https://console.cloud.google.com/artifacts?project=$PROJECT_ID"
