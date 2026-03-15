# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, use one of these methods:

1. **[Open a private security advisory](https://github.com/KryptikOne/web-tools/security/advisories/new)** on GitHub (preferred)
2. **[Report a vulnerability](https://github.com/KryptikOne/web-tools/security)** via GitHub's private vulnerability reporting (if enabled)

Include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix and disclosure:** Coordinated with reporter

## Scope

This project runs entirely client-side in the browser. There are no API routes, databases, or server-side processing. The primary attack surface is:

- **XSS via user-supplied content** (HTML, SVG, Markdown rendering)
- **Dependency vulnerabilities** in npm packages
- **Misconfigured security headers**

## Supported Versions

Only the latest version deployed to production is supported with security updates.

## Security Measures

- TypeScript strict mode enabled
- No `eval()` or `Function()` constructors
- `dangerouslySetInnerHTML` usage is sanitized (script stripping, event handler removal)
- All encoding/decoding uses native browser APIs
- Security headers configured (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Dependabot enabled for automated dependency scanning
