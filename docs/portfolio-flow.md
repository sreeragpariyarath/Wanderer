# Portfolio Journey Specification

The portfolio should feel discovered through the existing world, not displayed as a résumé overlay. The game remains playable; professional information appears only when the environment gives it context.

## Narrative flow

| World chapter | Portfolio chapter         | In-world treatment                                                                                |
| ------------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| City          | Identity and introduction | Name and role appear in scenery; a nearby discovery gives the short About text.                   |
| Road          | One year of experience    | Roadside milestones reveal company, role, dates, and outcomes while the car advances the journey. |
| Forest        | Skills                    | Technology groups become trail markers and one optional detail card.                              |
| Bridge        | Featured project          | The crossing frames the primary case study: problem, contribution, architecture, and result.      |
| River wreck   | Engineering story         | A failure, difficult bug, performance issue, or lesson is attached to the wreck.                  |
| Beach         | More projects and contact | The beach after the river holds the remaining projects, education, and the contact finale.        |

Exact positions and required/optional slots are defined in `lib/portfolio/flow.ts`.

## Disclosure rules

1. The first city view must establish name, role, and experience level within ten seconds.
2. Ambient captions contain one short idea, never a paragraph.
3. Detail cards open only after proximity plus an explicit Space, keyboard, or pointer action.
4. A collapsed card shows a title and one-line value statement. Expanded content explains evidence and outcomes.
5. Project links are genuine interactive links and identify live, source, or case-study destinations.
6. Checkpoint navigation remains available for recruiters who want direct access.
7. Résumé, GitHub, LinkedIn, and contact remain reachable from a compact header without interrupting play.
8. All meaningful portfolio text stays in semantic React DOM; canvas decoration must not be the only accessible copy.

## Content needed

Supply the following without secrets or private client information:

- Name, role, location, experience label, introduction, and 80–150 word About text.
- Each job: company, role, dates, summary, 2–4 achievements, measurable results, and technologies.
- Skills grouped into frontend, backend, databases, cloud/DevOps, testing, and tools.
- Two or three projects: name, summary, problem, personal contribution, result, stack, live URL, source URL, and screenshots.
- One honest engineering challenge and what changed because of it.
- Education, certifications, community or teamwork experience.
- Email, résumé URL/file, GitHub, LinkedIn, availability, and preferred contact message.

The typed source contract is `lib/portfolio/types.ts`. Real content belongs in `lib/portfolio/profile.ts` and is passed through `createPortfolioSceneContent` from `lib/portfolio/content.ts`. This produces captions and interactive cards, including real project/contact links, without making renderers own biography or project copy. Until a profile is supplied, `lib/wanderer/sceneData.ts` deliberately retains the original story as a safe fallback.
