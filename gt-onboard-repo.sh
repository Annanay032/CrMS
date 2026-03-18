#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Onboard any repository into Gas Town.

Usage:
  gt-onboard-repo.sh --repo-url <remote-url> [options]

Required:
  --repo-url <url>           Remote repository URL (https://..., git@..., ssh://..., s3://...)

Options:
  --rig <name>               Rig name (letters/numbers/underscores only)
  --crew <name>              Crew member name (default: current user)
  --agent <alias>            Default Gas Town agent for this rig (default: copilot)
  --gt-root <path>           Gas Town workspace root (default: ~/gt)
  --start-mayor              Start mayor session after setup
  --help                     Show this help

Examples:
  gt-onboard-repo.sh --repo-url https://github.com/acme/payments.git
  gt-onboard-repo.sh --repo-url git@github.com:acme/payments.git --rig payments_service --crew annanay --agent copilot --start-mayor
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command not found: $1" >&2
    exit 1
  fi
}

sanitize_rig_name() {
  local input="$1"
  local cleaned
  cleaned="$(echo "$input" | sed -E 's/\.git$//; s/[^a-zA-Z0-9_]+/_/g; s/_+/_/g; s/^_+//; s/_+$//')"
  echo "$cleaned"
}

is_valid_rig_name() {
  [[ "$1" =~ ^[a-zA-Z0-9_]+$ ]]
}

is_remote_url() {
  local url="$1"
  [[ "$url" =~ ^https?:// ]] || [[ "$url" =~ ^git@ ]] || [[ "$url" =~ ^ssh:// ]] || [[ "$url" =~ ^s3:// ]]
}

REPO_URL=""
RIG_NAME=""
CREW_NAME="${USER:-crew}"
AGENT="copilot"
GT_ROOT="${HOME}/gt"
START_MAYOR="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-url)
      REPO_URL="${2:-}"
      shift 2
      ;;
    --rig)
      RIG_NAME="${2:-}"
      shift 2
      ;;
    --crew)
      CREW_NAME="${2:-}"
      shift 2
      ;;
    --agent)
      AGENT="${2:-}"
      shift 2
      ;;
    --gt-root)
      GT_ROOT="${2:-}"
      shift 2
      ;;
    --start-mayor)
      START_MAYOR="true"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$REPO_URL" ]]; then
  echo "Error: --repo-url is required" >&2
  usage
  exit 1
fi

if ! is_remote_url "$REPO_URL"; then
  echo "Error: --repo-url must be a remote URL (https://, git@, ssh://, s3://)" >&2
  echo "Gas Town rig add does not accept local filesystem paths." >&2
  exit 1
fi

if [[ -z "$RIG_NAME" ]]; then
  base_name="$(basename "$REPO_URL")"
  RIG_NAME="$(sanitize_rig_name "$base_name")"
fi

if ! is_valid_rig_name "$RIG_NAME"; then
  suggested="$(sanitize_rig_name "$RIG_NAME")"
  echo "Error: invalid rig name '$RIG_NAME'." >&2
  echo "Use only letters, numbers, underscores. Suggested: '$suggested'" >&2
  exit 1
fi

if [[ -z "$CREW_NAME" ]]; then
  echo "Error: crew name is empty" >&2
  exit 1
fi

require_cmd gt

mkdir -p "$GT_ROOT"

if [[ ! -d "$GT_ROOT/.git" ]]; then
  echo "Initializing Gas Town workspace: $GT_ROOT"
  gt install "$GT_ROOT" --git
fi

cd "$GT_ROOT"

if [[ ! -d "$GT_ROOT/$RIG_NAME" ]]; then
  echo "Adding rig: $RIG_NAME"
  gt rig add "$RIG_NAME" "$REPO_URL"
else
  echo "Rig already exists: $RIG_NAME"
fi

if [[ ! -d "$GT_ROOT/$RIG_NAME/crew/$CREW_NAME" ]]; then
  echo "Adding crew member: $CREW_NAME"
  gt crew add "$CREW_NAME" --rig "$RIG_NAME"
else
  echo "Crew already exists: $CREW_NAME"
fi

cd "$GT_ROOT/$RIG_NAME/crew/$CREW_NAME"

echo "Setting default agent: $AGENT"
gt config default-agent "$AGENT"

echo

echo "Setup complete"
echo "  GT root : $GT_ROOT"
echo "  Rig     : $RIG_NAME"
echo "  Crew    : $CREW_NAME"
echo "  Agent   : $AGENT"
echo "  Path    : $GT_ROOT/$RIG_NAME/crew/$CREW_NAME"

if [[ "$START_MAYOR" == "true" ]]; then
  echo
  echo "Starting Mayor with agent: $AGENT"
  gt mayor start --agent "$AGENT" || true
fi

echo
echo "Next commands:"
echo "  cd '$GT_ROOT/$RIG_NAME/crew/$CREW_NAME'"
echo "  gt config agent list"
echo "  gt mayor attach"

echo
echo "Security reminder: avoid remote URLs with embedded access tokens."
