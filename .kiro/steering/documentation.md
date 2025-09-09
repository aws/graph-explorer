# Project Documentation Standards

## Writing Style & Tone

- **Professional & Clear**: Use straightforward language accessible to both
  technical and non-technical users
- **Concise**: Get to the point quickly without unnecessary explanations
- **Assumption-Explicit**: Clearly state what users need to know or have before
  starting
- **User-Focused**: Write from the user's perspective, addressing their goals
  and pain points

## Content Organization for First-Time Users

### README Structure

1. **Project Overview**: What Graph Explorer is and what problems it solves
2. **Key Features**: Bullet points of main capabilities
3. **Quick Start**: Fastest path to get running (Docker or local setup)
4. **Prerequisites**: System requirements, dependencies, accounts needed
5. **Installation**: Step-by-step setup instructions
6. **Basic Usage**: First steps after installation
7. **Documentation Links**: Clear navigation to detailed guides

### Documentation Hierarchy

- **README.md**: Project overview and quick start
- **additionaldocs/**: Detailed guides organized by user journey
  - `getting-started/`: Installation, first connection, basic usage
  - `user-guide/`: Feature documentation for end users
  - `deployment/`: Production deployment guides
  - `development/`: Contributing and development setup
  - `troubleshooting/`: Common issues and solutions

## Content Guidelines

### Emoji Usage

- **Minimal use**: Avoid emojis in technical documentation
- **Exception**: README may use 1-2 professional emojis for visual hierarchy
- Use text callouts instead: `NOTE:`, `WARNING:`, `IMPORTANT:`

### Assumptions & Prerequisites

- **System Requirements**: Always specify Node.js version (>=24.4.0), OS
  compatibility
- **Dependencies**: List required software (Docker, pnpm, AWS CLI if needed)
- **Access Requirements**: Database endpoints, AWS credentials, network access
- **Knowledge Level**: State if users need graph database knowledge or AWS
  experience

### Technical Accuracy

- **Version Alignment**: Keep examples current with latest release
- **Tested Instructions**: Verify all setup steps work on clean systems
- **Real Examples**: Use actual endpoint formats, not placeholder text
- **Error Handling**: Document common failure points and solutions

## File Organization

### Documentation Structure

```
README.md                           # Project overview and quick start
additionaldocs/
├── getting-started/
│   ├── installation.md            # Local and Docker setup
│   ├── first-connection.md        # Connecting to your first database
│   └── basic-usage.md             # Essential features walkthrough
├── user-guide/
│   ├── connections.md             # Managing database connections
│   ├── graph-visualization.md     # Using the graph viewer
│   ├── data-explorer.md           # Browsing data
│   └── authentication.md          # AWS IAM and other auth methods
├── deployment/
│   ├── docker.md                  # Production Docker deployment
│   ├── aws-ec2.md                 # Deploying on AWS EC2
│   └── configuration.md           # Environment variables and settings
├── development/
│   ├── contributing.md            # How to contribute to the project
│   ├── development-setup.md       # Local development environment
│   └── architecture.md            # Technical architecture overview
└── troubleshooting/
    ├── common-issues.md           # FAQ and common problems
    ├── connection-problems.md     # Database connection issues
    └── performance.md             # Performance optimization
```

### Naming Conventions

- Use kebab-case for all file names: `getting-started.md`
- Use descriptive names that match user tasks: `first-connection.md`
- Group related content in folders by user journey

## Formatting Standards

### Code Examples

- Use shell commands that work on the target platform
- Include complete commands with all necessary flags
- Show expected output when helpful
- Use realistic configuration examples

### Links & Cross-References

- Link to related sections:
  `[installation guide](getting-started/installation.md)`
- Reference configuration files:
  `[sample config](../samples/docker-compose.yml)`
- Use descriptive link text: "see the connection troubleshooting guide"
- Link to external resources with context: "AWS Neptune documentation"

### Visual Elements

- Use code blocks for commands and configuration
- Include screenshots for complex UI interactions
- Use tables for comparing options or listing requirements
- Add diagrams for architecture or workflow explanations
- Use GitHub alerts for important notices or warnings
  - For example:

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

## User Journey Focus

### New User Path

1. **Discovery**: README explains what Graph Explorer does
2. **Evaluation**: Quick start gets them running in minutes
3. **First Success**: Connect to a database and see their data
4. **Learning**: Guided tutorials for key features
5. **Mastery**: Advanced configuration and customization

### Content for Different Audiences

#### End Users (Data Analysts, Researchers)

- Focus on business value and use cases
- Step-by-step tutorials with screenshots
- Minimal technical jargon
- Troubleshooting common user errors

#### System Administrators

- Deployment and configuration guides
- Security considerations
- Performance tuning
- Monitoring and maintenance

#### Developers/Contributors

- Technical architecture
- Development setup
- Code contribution guidelines
- API documentation references

## Maintenance Standards

### Content Updates

- Update documentation with each feature release
- Test installation instructions on clean systems regularly
- Keep screenshots current with UI changes
- Validate all external links quarterly

### Version Management

- Keep documentation in sync with software releases
- Maintain compatibility notes for breaking changes
- Use Git history for version tracking
- Clearly mark deprecated features or methods

## Example Structure

### Good README Introduction

```markdown
# Graph Explorer

Graph Explorer is a React-based web application for visualizing and exploring
graph databases without writing queries. Connect to Amazon Neptune, Apache
TinkerPop, or other graph databases and start exploring your data immediately.

## Key Features

- Visual graph exploration with interactive node and edge manipulation
- Support for Property Graphs (Gremlin, openCypher) and RDF (SPARQL)
- No-code data exploration with point-and-click interface
- AWS IAM authentication for secure Neptune connections
- Export capabilities for further analysis

## Quick Start

Get Graph Explorer running in under 5 minutes:

    # Using Docker (recommended)
    docker run -p 80:80 public.ecr.aws/neptune/graph-explorer

    # Open http://localhost in your browser

## Prerequisites

- Docker (for containerized deployment) OR Node.js >=24.4.0 + pnpm
- Graph database endpoint (Neptune, TinkerPop, etc.)
- Network access to your database
- AWS credentials (if using Neptune with IAM auth)

[Continue with installation and basic usage...]
```
