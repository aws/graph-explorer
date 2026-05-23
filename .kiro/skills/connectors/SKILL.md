---
name: connectors
description: Database connector and explorer patterns for Gremlin, openCypher, and SPARQL, including the query template tag and escapeString usage.
tools: ["fs_read", "code", "grep", "glob", "web_search", "web_fetch"]
---

# Connector & Explorer Patterns

## Connector Pattern

- Database connectors are separated by query language (gremlin, openCypher, sparql)
- Common interfaces are defined in `src/connector/index.ts`
- Each connector implements the same interface for consistent API

## Explorer Pattern

- "Explorers" abstract querying databases with different query languages
- Each explorer provides a unified interface for a specific query language
- Located in `src/connector/[query-language]/explorer/`
- Explorers handle query construction, execution, and result transformation
- They shield the application from query language specifics while providing consistent data structures

## Branded Types

For branded type conventions and the full type reference table, refer to `.kiro/skills/typescript/SKILL.md`.

## Database Queries

- Use the `query` template tag from `@/utils` for all query strings (Gremlin, openCypher, SPARQL) to ensure consistent formatting
- For Gremlin queries, use `escapeString()` from `@/utils` to escape special characters in string literals
