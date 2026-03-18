# Gas Town + GitHub Copilot Setup and Usage

This document captures the setup that was completed and how to reuse it for any repo.

## What is already done on this machine

Installed tools:
- Homebrew packages: go, dolt, tmux, gh, gastown (and beads via gastown dependency)
- GitHub Copilot CLI installed and available on PATH

Configured workspace:
- Gas Town root: ~/gt
- Rig for this repo: snowbird_securesigning
- Crew member: annanay
- Default Gas Town agent: copilot

## Daily usage for this repo

1. Move to your crew workspace

    cd ~/gt/snowbird_securesigning/crew/annanay

2. Check config

    gt config agent list
    gt rig list

3. Start or attach Mayor

    gt mayor start --agent copilot
    gt mayor attach

4. Optional monitoring

    gt feed

## Verify Copilot CLI is available

Run:

    command -v copilot
    copilot --version

If you get "Cannot find GitHub Copilot CLI", install/repair it by running:

    copilot --version

If prompted "Install GitHub Copilot CLI?", answer y.

Then re-run:

    copilot --version

## Do I need opencode installed?

Short answer: No, not for your current setup.

- You are already using the copilot runtime successfully.
- opencode is optional and only needed if you want to run Gas Town agents with opencode.

If you want opencode as an optional runtime:

    brew install anomalyco/tap/opencode

Then verify and use it:

    opencode --version
    gt config agent set opencode "opencode"
    gt mayor start --agent opencode

## How to set this up for another repo

Use this pattern for each new repository.

1. Choose a valid rig name
- Use letters, numbers, and underscores only.
- Do not use hyphens, dots, spaces, or path separators.

2. Add the rig using the remote URL

    cd ~/gt
    gt rig add <rig_name_with_underscores> <repo_remote_url>

Example:

    gt rig add payments_service https://github.com/your-org/payments-service.git

3. Create your crew workspace

    gt crew add annanay --rig <rig_name_with_underscores>

4. Enter your crew workspace

    cd ~/gt/<rig_name_with_underscores>/crew/annanay

5. Use Copilot for that rig

    gt config default-agent copilot
    gt mayor start --agent copilot
    gt mayor attach

## One-command onboarding script (recommended)

Use the helper script added in this repo:

    ./scripts/gt-onboard-repo.sh --repo-url <repo_remote_url>

### How to run the script

1. Open a terminal in this repository root.

2. Make the script executable (one-time):

    chmod +x ./scripts/gt-onboard-repo.sh

3. Run it:

    ./scripts/gt-onboard-repo.sh --repo-url <repo_remote_url>

4. Optional: if you run it from a different folder, use the absolute path:

    /Users/annanay.sharma/Documents/GitHub/snowbird-securesigning/scripts/gt-onboard-repo.sh --repo-url <repo_remote_url>

Example:

    ./scripts/gt-onboard-repo.sh --repo-url https://github.com/your-org/payments-service.git --crew annanay --agent copilot --start-mayor

Useful flags:
- --rig <name> to force a custom rig name
- --gt-root <path> if you do not want to use ~/gt
- --start-mayor to start Mayor immediately after onboarding

Notes:
- The script auto-generates a valid rig name if --rig is not provided.
- It requires a remote URL and will reject local filesystem paths.

## Recommended quick checklist for each new repo

- Confirm remote URL:

    git -C /path/to/repo remote get-url origin

- Add rig in Gas Town:

    gt rig add <rig_name> <remote_url>

- Add crew:

    gt crew add annanay --rig <rig_name>

- Start Mayor with Copilot:

    cd ~/gt/<rig_name>/crew/annanay
    gt mayor start --agent copilot
    gt mayor attach

## Security note

Avoid remotes containing embedded access tokens in plain text. Prefer token-free remotes and credential helpers.
