# Graph Report - SIMANIKA  (2026-09-22)

## Corpus Check
- Corpus is ~25,166 words - fits in a single context window. You may not need a graph.

## Summary
- 83 nodes · 94 edges · 12 communities (9 shown, 3 thin omitted)
- Extraction: 80% EXTRACTED · 19% INFERRED · 1% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Product Scope and Events|Product Scope and Events]]
- [[_COMMUNITY_Project Markdown and Architecture Rules|Project Markdown and Architecture Rules]]
- [[_COMMUNITY_Integration Contracts and Tests|Integration Contracts and Tests]]
- [[_COMMUNITY_Visual Design and Accessibility|Visual Design and Accessibility]]
- [[_COMMUNITY_Dynamic OPREC and Security|Dynamic OPREC and Security]]
- [[_COMMUNITY_System Stack|System Stack]]
- [[_COMMUNITY_Authentication Stack|Authentication Stack]]
- [[_COMMUNITY_PHP Composer Alignment|PHP Composer Alignment]]
- [[_COMMUNITY_Next.js Documentation Rules|Next.js Documentation Rules]]
- [[_COMMUNITY_Agent Workspace Instructions|Agent Workspace Instructions]]
- [[_COMMUNITY_Frontend Architecture Rule|Frontend Architecture Rule]]
- [[_COMMUNITY_Inherited Frontend Rules|Inherited Frontend Rules]]

## God Nodes (most connected - your core abstractions)
1. `Dynamic Event listing and detail` - 6 edges
2. `OPREC registration adapter and backend validation` - 6 edges
3. `Neo-Arcade Editorial design system` - 5 edges
4. `Dynamic OPREC UI contract` - 5 edges
5. `SIMANIKA product purpose` - 4 edges
6. `Dynamic OPREC and results flow` - 4 edges
7. `Architecture Compliance Audit` - 4 edges
8. `SIMANIKA system architecture` - 4 edges
9. `Laravel 11 REST backend` - 4 edges
10. `Sanctum session cookie and CSRF authentication` - 4 edges

## Surprising Connections (you probably didn't know these)
- `SIMANIKA root README` --conceptually_related_to--> `SIMANIKA product purpose`  [AMBIGUOUS]
  README.md → PRD.md
- `Public user and admin Event API endpoints` --implements--> `Dynamic Event listing and detail`  [INFERRED]
  architecture.md → PRD.md
- `Public user and admin OPREC API endpoints` --implements--> `Dynamic OPREC and results flow`  [INFERRED]
  architecture.md → PRD.md
- `Cookie auth role validation CSRF and upload security` --conceptually_related_to--> `OPREC registration adapter and backend validation`  [INFERRED]
  PRD.md → frontend/docs/oprec.md
- `Authentication page visual direction` --conceptually_related_to--> `Minka login WebP illustration`  [INFERRED]
  DESIGN.md → frontend/docs/login-art.md

## Communities (12 total, 3 thin omitted)

### Community 0 - "Product Scope and Events"
Cohesion: 0.21
Nodes (14): HIMANIKA admin role, Dynamic Event listing and detail, Dynamic OPREC and results flow, Public user and admin sitemap, Core Web Vitals and Lighthouse targets, SIMANIKA product purpose, Competition team registration and codes, Public and student user role (+6 more)

### Community 1 - "Project Markdown and Architecture Rules"
Cohesion: 0.15
Nodes (14): Read all project Markdown before code changes, Align implementation with architecture.md, Check FE-BE contract, validation, authorization, session and tests, Read local Next.js docs before frontend edits, Protect environment secrets and credentials, Track decisions and pending work in TODO.md, Latest user instruction takes precedence, Follow all project Markdown documents (+6 more)

### Community 2 - "Integration Contracts and Tests"
Cohesion: 0.18
Nodes (14): Frontend Backend API Contracts, Current Integration Scope Limits, Consistent Localhost Configuration, Sanctum Cookie CSRF Session Flow, Integration Verification and Remaining Tests, React Hook Form and Zod Auth Validation, Current Backend Implementation Scope, Private OPREC File Storage (+6 more)

### Community 3 - "Visual Design and Accessibility"
Cohesion: 0.20
Nodes (10): Accessibility requirements, Authentication page visual direction, Blue as action and focus signal, Neo-Arcade Editorial design system, Forms and interaction component specifications, Framer Motion motion system, Pixel details with purpose, Reduced motion behavior (+2 more)

### Community 4 - "Dynamic OPREC and Security"
Cohesion: 0.36
Nodes (9): Cookie auth role validation CSRF and upload security, Sanctum session cookie and CSRF authentication, Public user and admin OPREC API endpoints, OPREC Next adapter and Laravel authority revision, Dynamic OPREC UI contract, Private OPREC result lookup, Admin-driven OPREC form schema, OPREC schedule state machine (+1 more)

### Community 5 - "System Stack"
Cohesion: 0.47
Nodes (6): Recommended Next Laravel PostgreSQL stack, SIMANIKA system architecture, Backend stack: Sanctum Eloquent Storage Mail Queue, Laravel 11 REST backend, Next.js App Router frontend, PostgreSQL 15+ database

### Community 6 - "Authentication Stack"
Cohesion: 0.50
Nodes (5): Authentication API endpoints, Sprint 2 authentication implementation plan, Frontend stack: Zustand Axios Tailwind shadcn RHF Zod Framer Motion, Password recovery email link flow, Password reset token flow

### Community 7 - "PHP Composer Alignment"
Cohesion: 0.40
Nodes (5): Backend Local Setup, PHP 8.2 Platform Constraint, Backend Runtime Verification, Laravel 11 Sanctum PostgreSQL Stack, Composer Lock Targets PHP 8.2

### Community 8 - "Next.js Documentation Rules"
Cohesion: 0.67
Nodes (3): Installed Next.js version may have breaking changes, Read local Next.js docs before frontend changes, Claude agent rules reference

## Ambiguous Edges - Review These
- `SIMANIKA product purpose` → `SIMANIKA root README`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **27 isolated node(s):** `Blue as action and focus signal`, `Pixel details with purpose`, `Reduced motion behavior`, `Accessibility requirements`, `Autonomous workspace agent instructions` (+22 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 27 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `SIMANIKA product purpose` and `SIMANIKA root README`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Public user and admin OPREC API endpoints` connect `Dynamic OPREC and Security` to `Product Scope and Events`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `Dynamic OPREC and results flow` connect `Product Scope and Events` to `Dynamic OPREC and Security`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Dynamic Event listing and detail` (e.g. with `Public user and admin Event API endpoints` and `Event detail response and publication rules`) actually correct?**
  _`Dynamic Event listing and detail` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Blue as action and focus signal`, `Pixel details with purpose`, `Reduced motion behavior` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._