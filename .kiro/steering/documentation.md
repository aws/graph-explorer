---
inclusion: fileMatch
fileMatchPattern: "{**/*.md,docs/**}"
---

# Project Documentation Standards

- Be professional & clear; use straightforward language accessible to both technical and non-technical users
- Be concise; get to the point quickly without unnecessary explanations
- Clearly state what users need to know or have before starting
- Write from the user's perspective, addressing their goals and pain points
- Use kebab-case for all file names: `getting-started.md`
- Avoid emojis in technical documentation

## Content for Different Audiences

### End Users (Data Analysts, Researchers)

- Focus on business value and use cases
- Step-by-step tutorials with screenshots
- Minimal technical jargon
- Troubleshooting common user errors

### System Administrators

- Deployment and configuration guides
- Security considerations
- Performance tuning
- Monitoring and maintenance

### Developers/Contributors

- Technical architecture
- Development setup
- Code contribution guidelines
- API documentation references

## GitHub Alerts

Use GitHub alerts for important notices or warnings:

```
> [!NOTE]
> Useful information that users should know, even when skimming content.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.
```
