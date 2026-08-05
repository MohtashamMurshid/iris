# Security policy

## Supported versions

Iris is under active development. Security fixes are applied on the latest `main` branch.

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Older tagged releases | Best effort |

## What to report

Please report anything that could put users or contributors at risk, including:

- Remote code execution or arbitrary native code loading
- Unauthorized access to camera, microphone, photos, or location
- Data exfiltration from local capture pipelines
- Secrets, tokens, or credentials committed to the repository
- Dependency vulnerabilities with a practical exploit path in this project

## What not to report publicly

- Issues that require physical access and have no security impact beyond that
- Pure crash bugs with no security consequence (open a normal issue instead)
- Feature requests

## How to report a vulnerability

**Do not open a public GitHub issue for security reports.**

Email **mohtashammurshid@gmail.com** with:

1. A short description of the issue
2. Steps to reproduce, or a proof of concept
3. Affected platform / iOS version / build when relevant
4. Your assessment of impact

If you prefer GitHub’s private reporting flow, use **Security → Report a vulnerability** on the repository when that feature is enabled.

## Response expectations

- Acknowledgement within **7 days**
- Initial triage and severity assessment soon after
- Coordinated disclosure once a fix is available or the report is declined with rationale

Please give us a reasonable window to investigate and ship a fix before any public disclosure.

## Safe harbor

We will not pursue legal action against researchers who:

- Make a good-faith effort to avoid privacy violations and service disruption
- Do not access, modify, or destroy data that is not their own beyond what is needed to demonstrate the issue
- Report findings privately and give us time to respond
