# TOADAL FEAST — Owner Website Acceptance Checklist

**Date:** 2026-10-03  
**Companion to:** `VISUAL_CONTENT_CLOSURE_AUDIT_20261003.md`

This is the short owner-facing finish line. It is intentionally smaller than the engineering qualification suites. Automated QA can prove consistency; this checklist proves that the website and Studio are actually usable and visually acceptable to the owner.

## A. Non-coding authoring proof

Complete one real but disposable draft workflow in Studio:

- Create an ordinary page from a TOADAL starter.
- Replace one image and adjust its framing.
- Edit visible copy and alt text.
- Add or edit one internal link.
- Add a section, duplicate or move it, then Undo one structural change.
- Save, leave the page, reopen it, and confirm the saved state.
- Check desktop and mobile preview.
- Publish the test page only if needed for export proof; otherwise leave it Draft.
- If published, add it to navigation explicitly and verify the navigation change.
- Export the static website and click the edited link in the exported result.
- Download a project backup and restore it into an independent project copy.

**Pass condition:** the owner can complete the sequence without editing code/JSON or wondering whether a Save/Cancel/Export action silently lost work.

## B. Visual review

Review these six staging surfaces at desktop and mobile:

### Home
- Hero promise is immediately understandable.
- Both primary paths are visible and usable.
- No clipped CTA/text.
- Browser games and Feast Pass are discoverable without overwhelming the first screen.
- Companion does not cover essential controls.

### Play
- A visitor can tell what is playable, preview-only, and coming later.
- No internal package/origin/staging terminology is required to understand the page.
- Game cards have intentional image framing.
- Mobile cards and filters are usable without accidental clipping.

### Characters
- Faces, crowns and identifying features are framed intentionally.
- Card actions look like the rest of the site.
- Future/unpublished characters look intentional, not broken.
- Hero text and character artwork do not collide on mobile.

### Stories
- The page feels like a prepared publishing destination even with no public stories.
- Empty states do not repeat the same negative message across the entire first viewport.
- Reader/manga preview links are truthful and useful.

### World
- Environment art remains the visual lead.
- No invented location/lore is used to fill space.
- Character/world/story paths are obvious.

### App
- Real gameplay imagery is clearly differentiated from browser previews.
- Store buttons remain disabled until real destinations exist.
- Browser/world fallback paths work.
- Do not redesign this page if only store-link availability remains.

## C. Responsive/navigation proof

At 1440px, a tablet width, 390px, and one narrower safe-area width:

- no horizontal page overflow
- no clipped CTA label
- no essential face/text collision
- mobile navigation is discoverable and operable
- keyboard focus remains visible
- touch targets remain usable
- reduced-motion behavior is preserved
- companion never blocks a required control

## D. Public-language proof

A visitor should not need engineering context.

Search the visible site for terms or phrases such as:

- staging
- package connected
- origin-safe / origin-safety
- requalification
- PUBLIC as an implementation status
- website package
- test/build jargon that is not part of the product

Each occurrence must be intentionally kept for a staging-only reason or rewritten into truthful visitor language before public promotion.

## E. Release decision

### STOP

Do not promote when any essential control/text is clipped, mobile navigation is not discoverable, a public CTA is dead, a character crop is visibly broken, or the page makes an unsupported availability/account/store claim.

### ITERATE

Functional behavior is sound, but the owner still sees obvious polish problems: repeated empty states, overly technical wording, inconsistent minor controls, awkward crop/framing, or unacceptable companion overlap.

### ACCEPT / LOCK CANDIDATE

The owner can operate the authoring workflow without code, the six major surfaces are visually coherent on desktop/mobile, unavailable features remain truthful and useful, and no P0 issue from the visual closure audit remains.

Owner acceptance is a separate decision from automated qualification and from deployment. Passing this checklist does not itself deploy `staging/live-visual` or production.
