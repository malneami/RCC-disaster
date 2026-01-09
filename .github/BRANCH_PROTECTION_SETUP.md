# Branch Protection Rules Setup Guide

This guide explains how to set up branch protection rules in GitHub to enforce PR reviews before merging.

## Required Branch Protection Rules

To enforce PR reviews, configure the following branch protection rules for your main branches (e.g., `main`, `develop`, `master`):

### Access GitHub Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** → **Branches**
3. Click **Add rule** or edit an existing rule

### Recommended Settings

#### Branch Name Pattern
- Pattern: `main` (or `develop`, `master`, or `*` for all branches)

#### Protect Matching Branches

**Required Settings:**

1. ✅ **Require a pull request before merging**
   - ✅ Require approvals: **1** (or more as needed)
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require review from Code Owners (if you have a CODEOWNERS file)

2. ✅ **Require status checks to pass before merging**
   - Select: `PR Review Check` (from `.github/workflows/pr-review-check.yml`)
   - Select: `Pre-Merge Checks` (from `.github/workflows/pre-merge-checks.yml`)
   - ✅ Require branches to be up to date before merging

3. ✅ **Require conversation resolution before merging**
   - Ensures all comments and discussions are resolved

4. ✅ **Require signed commits** (optional but recommended)
   - Ensures commits are signed for security

5. ✅ **Require linear history** (optional)
   - Prevents merge commits, enforces rebase or squash

6. ✅ **Include administrators**
   - Applies rules to admins as well

7. ✅ **Do not allow bypassing the above settings**
   - Prevents bypassing via admin override

#### Additional Settings (Optional)

- **Restrict who can push to matching branches**: Leave empty to allow PRs from any branch
- **Allow force pushes**: ❌ Disable
- **Allow deletions**: ❌ Disable

## Setting Up via GitHub CLI

Alternatively, you can set up branch protection using GitHub CLI:

```bash
# Install GitHub CLI if not installed
# brew install gh (macOS)
# apt install gh (Linux)

# Authenticate
gh auth login

# Set branch protection rules
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["PR Review Check","Pre-Merge Checks"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
  --field restrictions=null
```

## CODEOWNERS File (Optional)

Create a `.github/CODEOWNERS` file to automatically request reviews from specific teams:

```
# Global owners
* @team-leads

# Backend code
apps/backend/ @backend-team

# Frontend code
apps/frontend/ @frontend-team

# Database migrations
**/prisma/** @database-team

# Documentation
*.md @docs-team
```

## Verification

After setting up branch protection:

1. Create a test PR
2. Try to merge without approvals - it should be blocked
3. Add an approval
4. Verify the merge button is enabled

## Troubleshooting

### Workflows not showing in status checks
- Ensure workflows are in `.github/workflows/` directory
- Check that workflows have the correct `on:` triggers
- Verify workflow files are committed to the default branch

### PRs stuck in "checks required"
- Ensure all required status checks are passing
- Check workflow logs for errors
- Verify branch protection rules are correctly configured

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

