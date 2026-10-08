# Cleanomatics brand research and dashboard direction

Researched 8 October 2026. Scope: design evidence and proposed task-management UI. This document does not introduce functional assignment requirements.

## Primary evidence

- Official website: https://www.cleanomatics.com/
- Homepage title: “Cleanomatics — AI-Powered Laundry Technology Platform”.
- Browser visual inspection covered the desktop hero, sticky header, platform cards, and app ecosystem section.
- Read-only browser computed-style inspection verified actual fonts, colors, CSS custom properties, component radii, CTA gradient, shadows, and section spacing.
- Agent Reach web route (Jina Reader) independently retrieved the homepage content: https://r.jina.ai/https://www.cleanomatics.com
- Published stylesheet observed in the rendered page: https://www.cleanomatics.com/assets/index-28sgXagt.css
- Published font stylesheet observed: https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap

The site positions Cleanomatics as an operations and technology platform: laundry business management, mobile applications, automation, garment intelligence, marketing, and franchise growth. A task workspace should feel like a credible operational product from this family.

## Verified visual language

| Token               | Exact observed value | Website use                                                           |
| ------------------- | -------------------- | --------------------------------------------------------------------- |
| Primary cyan blue   | `#0DA2E7`            | Contact strip, selected navigation, prominent heading words, controls |
| Primary dark blue   | `#0673BC`            | Published `--primary-dark`                                            |
| CTA gradient top    | `#18ADF2`            | Primary pill buttons                                                  |
| CTA gradient bottom | `#067FD0`            | Primary pill buttons                                                  |
| Primary light       | `#D7F2FE`            | Published `--primary-light`, icon and accent family                   |
| Section soft        | `#F0FAFF`            | Alternating sections; rendered at 40% opacity                         |
| Main ink            | `#0F1729`            | Headings and body foreground                                          |
| Secondary text      | `#65758B`            | Published muted foreground                                            |
| Border              | `#E1E7EF`            | Card and control boundaries                                           |
| Muted canvas        | `#F4F7FA`            | Published muted background                                            |
| Surface             | `#FFFFFF`            | Main page and cards                                                   |

HSL tokens were converted mathematically to rounded 8-bit RGB hex. These values are CSS evidence, not screenshot guesses.

Typography is Inter with weights 400, 500, 600, 700, and 800. Hero H1 is 56px/800 at the inspected desktop width. Section H2 is 34px/800. Navigation is 14px/500; hero CTA is 14px/600; contact strip is 12px. The logo combines a navy-and-cyan droplet mark with an uppercase navy wordmark. The mobile app preview adds a deep navy/indigo header, confirming navy is compatible with the brand even though the marketing website emphasizes cyan.

Layout characteristics:

- White, uncluttered canvas with broad side gutters and generous vertical whitespace.
- Header has a slim cyan contact ribbon, white navigation row, and persistent position while scrolling.
- Hero uses a large left-aligned headline paired with app imagery on the right.
- Selected words in headings turn cyan to create emphasis.
- Primary actions are full pill shapes with a restrained blue glow; secondary actions are outlined pills.
- Feature tiles are white, lightly bordered, softly rounded, and use cyan icons on pale-blue circular backplates.
- Major sections use 80px vertical padding, with faint ice-blue alternation.
- Published card radius token is 0.625rem; primary CTA radius is 9999px.
- Observed primary CTA shadow: `0 6px 20px rgba(13, 162, 231, 0.35)`.

## Proposed direction: Cleanomatics Task Workspace

Build a calm, precise operations workspace with a stronger application hierarchy than the marketing homepage. Carry its verified cyan, deep ink, pale blue, Inter typography, droplet-inspired identity, soft cards, and broad breathing room into a usable dashboard.

Recommended composition:

1. Desktop sidebar approximately 224–240px wide. Deep navy (`#0F1729`) identity and navigation create a confident anchor. Selected destination gets a cyan accent and restrained pale/transparent fill. A clean brand mark and “Workspace” descriptor communicate context.
2. Main canvas in `#F4F7FA` with white cards and 24–32px desktop gutters. Keep sidebar contrast purposeful; the actual work area stays light and readable.
3. Compact top bar with breadcrumbs/context, role badge and user identity. Avoid decorative fake search or notification controls unless they work.
4. An editorial introductory row: small uppercase workspace eyebrow, 30–36px/700–800 page title, one useful supporting sentence, and a visible cyan primary action such as “Create task”. Emphasize at most one word in cyan.
5. Four compact summary cells for real task counts. Use tabular numerals, a small recognizable icon, a precise label, and no fabricated trends.
6. A clear tasks panel with view toggle, real search, filters, task rows/cards, and count/pagination when required. Make task title, status, priority, assignee and due date scannable in that order, subject to assignment fields.
7. Use a detail drawer or focused modal for task creation/editing. Keep labels visible, validation inline, and the save action fixed near the form footer. Destructive actions need a clear confirmation.

Spacing should come from a consistent 4px scale. Use 12–16px card radii and 8–10px control radii for the application, preserving the website’s rounded character while fitting denser information. Reserve pill shapes for badges and one primary action. Body/control text 14px; metadata 12–13px; table headings 11–12px with restrained uppercase tracking. Use a consistent 1.5–1.75px icon stroke, preferably Lucide.

## Functional polish and states

- Status chips should carry both text and a compact dot/icon: neutral pending, blue in-progress, green completed. Priority chips should use muted semantic tones: low slate, medium amber, high red. Color alone must never communicate the value.
- Keep the primary blue for actions and selection. For white text on small blue controls use darker `#0673BC`/`#067FD0` rather than the bright cyan, which needs contrast review. Use dark text for pale cyan chips.
- Focus rings: visible blue outline with surface separation. Keyboard-accessible menus, dialogs, and form controls; honest accessible names.
- Empty state: one small task illustration or outline symbol, concise explanation, and a meaningful action appropriate to the role.
- Loading state: table/card skeletons preserving the actual layout. Errors: useful explanation plus retry. Success: a short toast and refreshed real data.
- Subtle 120–180ms hover/focus transitions; an optional 180–240ms opening transition for the drawer. Respect reduced-motion preferences. Avoid continuous animation.
- Responsive: collapse sidebar into an accessible menu; stack intro/action and summary cells; switch the table to readable task cards on narrow screens. Do not force horizontal page scrolling.
- Seed data may reference realistic Cleanomatics work (franchise onboarding, garment scanning QA, mobile order tracking) only where demo content is permitted. Do not present website marketing claims as implemented application features.

## Design boundaries

The assignment remains the source of functional requirements. Branding research informs appearance only. Do not add AI automation, payments, franchise management, or claims of endorsement to the task-management scope. Use an original droplet-inspired icon or text identity unless reusing the company’s logo is deliberately chosen; no need to copy commercial illustrations. Keep every visible navigation destination and major control functional. No deployment or external sharing is part of this design research.

## Acceptance checks for frontend review

- Screen reads as the same cyan/navy/ice-blue brand family as the verified company website.
- Every displayed task count and identity comes from real state.
- A reviewer can discover create/edit/status/delete workflows without hunting.
- Roles and permissions are clear and behave according to the assignment.
- Forms, empty/error/loading states, keyboard interactions, and mobile layouts are complete.
- A restrained visual hierarchy makes task operations faster, with no decorative controls masquerading as features.
