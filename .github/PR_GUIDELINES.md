# Pull Request Guidelines

This document outlines the standards and best practices for creating and reviewing pull requests in this repository.

## PR Size Limits

### Maximum Change Limit
- **500 lines maximum** (additions + deletions combined)
- PRs exceeding this limit will be automatically rejected by CI checks
- If your PR exceeds 500 lines, please split it into multiple smaller PRs

### Why Size Matters
- Smaller PRs are easier to review and understand
- Faster review cycles lead to quicker merges
- Reduces the risk of introducing bugs
- Makes it easier to identify and revert problematic changes

### When to Split a PR
Split your PR if:
- It addresses multiple unrelated features or fixes
- It touches multiple areas of the codebase without clear connection
- The PR description becomes too long to explain all changes
- Reviewers request splitting due to complexity

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) format for all commit messages.

### Format
```
<type>(<scope>): <subject>

<body (optional)>

<footer (optional)>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Revert previous commit

### Examples
```
feat(frontend): add user registration form
fix(backend): resolve database connection timeout
docs(readme): update installation instructions
refactor(auth): simplify JWT token validation
```

### Rules
- Type and subject are required
- Subject must be at least 10 characters
- Subject must not exceed 72 characters
- Use lowercase for type and scope
- No period at the end of subject
- Use imperative mood ("add" not "added" or "adds")

## PR Title Requirements

- Minimum 10 characters
- Should clearly describe what the PR does
- Prefer conventional commit format when possible
- Examples:
  - ✅ `feat: Add Excel export to data quality reports`
  - ✅ `fix: Resolve critical time tracker completion issue`
  - ❌ `fix` (too short)
  - ❌ `updates` (too vague)

## PR Description Requirements

### Minimum Requirements
- At least 50 characters
- Clear description of what changes were made
- Why the changes were necessary

### Recommended Structure
```markdown
## Description
Brief summary of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List of specific changes
- Bullet points are helpful

## Testing
- How was this tested?
- Test cases or scenarios covered

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
```

## Code Review Checklist

### For Authors
Before requesting review, ensure:
- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] No linting errors
- [ ] PR description is complete
- [ ] Commit messages follow conventional format
- [ ] PR is under 500 lines (or split if necessary)
- [ ] No sensitive data (API keys, passwords, etc.) in code
- [ ] Documentation updated if needed

### For Reviewers
When reviewing, check:
- [ ] Code quality and correctness
- [ ] Adherence to coding standards
- [ ] Test coverage is adequate
- [ ] No security vulnerabilities
- [ ] Performance implications considered
- [ ] Documentation is clear and accurate
- [ ] Changes are well-documented in PR description

## Pre-commit Hooks

This repository uses Husky pre-commit hooks to ensure code quality:

### What Runs Automatically
- **Linting**: ESLint checks on staged files only
- **Formatting**: Prettier formatting on staged files only
- **Commit Message Validation**: Commitlint validates commit message format

### Important Notes
- Only **staged changes** are formatted/linted (not entire files)
- This prevents irrelevant formatting changes in PRs
- If hooks fail, fix the issues before committing

### Bypassing Hooks (Not Recommended)
```bash
# Only use in emergencies
git commit --no-verify
```

## Best Practices

### 1. Keep PRs Focused
- One feature or fix per PR
- Related changes can be grouped, but keep it logical

### 2. Write Clear Descriptions
- Explain the "what" and "why"
- Include context for reviewers
- Link related issues or discussions

### 3. Respond to Feedback
- Address all review comments
- Ask for clarification if needed
- Update PR based on feedback

### 4. Keep PRs Up to Date
- Rebase or merge main branch regularly
- Resolve conflicts promptly
- Keep commits clean and logical

### 5. Test Before Submitting
- Run tests locally
- Test the feature manually
- Check for linting errors

### 6. Use Draft PRs
- Mark PRs as draft for work-in-progress
- Request review only when ready
- Use draft status to get early feedback

## Automated Checks

The following checks run automatically on all PRs:

1. **PR Title Validation**: Minimum 10 characters
2. **PR Description Validation**: Minimum 50 characters
3. **Change Size Check**: Maximum 500 lines (additions + deletions)
4. **Sensitive File Detection**: Blocks commits containing secrets
5. **Large File Warning**: Alerts for files with >1000 changes

All checks must pass before a PR can be merged.

## Getting Help

If you have questions about:
- PR guidelines: Check this document or ask in team chat
- Commit message format: See [Conventional Commits](https://www.conventionalcommits.org/)
- Code style: Check project ESLint/Prettier configs
- Splitting large PRs: Ask a team lead for guidance

## Exceptions

In rare cases, exceptions to these rules may be granted:
- Large refactoring efforts (coordinate with team)
- Emergency hotfixes (follow up with proper PR)
- Migration scripts (document thoroughly)

Always discuss exceptions with the team before proceeding.

