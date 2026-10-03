# Owner self-service guide

Status: owner self-service guide for the delivered Studio authoring foundation, dated 2026-10-02. The local Studio implementation is committed as `e06eb5f14c210fc22b9f39dd11b9b51ee6847faa`. Browser proof covers the authoring and static-export behaviors noted below. Backup/restore proof has passed as described in this guide. Starter-page UI checks have also passed on the independent restored pilot; details are in [the closure note](OWNER_SELF_SERVICE_CLOSURE_20261003.md).

## Create a page

In **Pages**, choose **Create Page**. The choices are:

- **Blank page** for a clean page.
- **Template** to choose from patterns: **TOADAL Media**, the Article or Story-style pattern (using its name from patterns), or **Information Page**.
- **Existing page** to start from an existing page.

This safe authoring foundation applies to ordinary pages and excludes pages bound to a game, runtime-only content, and Reader sources. New pages are created as drafts; creation does not add them to navigation. Blank page, Template starters (TOADAL Media, Article/Story-style, and Information Page), and Existing page creation/reopen checks passed on the independent restored pilot. Desktop 1440-pixel and mobile 390-pixel previews had no horizontal overflow. Donor About and News hashes remained unchanged, and project validation reported zero dangling references. A Story-style ordinary page does not itself create a Stories registry entry or add content to Manga or Reader. This workflow does not upload a game cartridge.

Workbench **Duplicate** is a whole-project copy operation, separate from **Existing page**. To make an independent project copy, enter a name in **Name for the independent copy** and choose **Create independent copy**. This duplicates the project, not an individual page.

## Edit and preview

Use **Content** mode for ordinary copy and media edits; use **Design** mode for page structure and layout. The owner editing panels provide explicit **Save** and **Cancel** actions. A cross-panel dirty-edit guard asks how to handle pending edits before navigation; resolve it and confirm the save or discard result before continuing. Verified browser proof covers Media-page creation and persistence of image, copy, and link edits. On the restored pilot, adding an image inside a page, saving, and then cancelling a later edit restored the saved alt text.

Use preview to review a page while authoring. Draft preview is local and marked `noindex` by default; it is not the public export. A checked browser proof covered section operations (add, duplicate, move, hide, delete, and Undo) and 1440-pixel and 390-pixel previews without horizontal overflow. These results concern sections, not page or navigation operations. Check image alt text and visual framing when editing media. Desktop and mobile image controls remain independent settings, as established in the prior pilot; review and update each intentionally.

Visual walkthrough: [created media page](self-service-20261003/created-media-page.png) · [exported page at 390 px](self-service-20261003/exported-media-390.png).

## Save, publish, and navigation

Use **Save** to keep the current owner-form edits or **Cancel** to discard them. If the cross-panel guard appears, choose whether to save, discard, or stay and continue editing. If saving fails, keep the page in draft until the result is clear.

In page settings, choose **Draft** while work is in progress or **Published** when the page is approved for the static website export. Draft pages are excluded from deterministic static exports by default. On the restored pilot, the draft route was absent from all HTML, JSON, and XML output and from output/search/sitemap/navigation. A checked proof opened exported links and confirmed the static output; export remains a file download and does not deploy to an external backend or make the site live.

Use **Add to navigation** only for a published page you deliberately want visitors to find in the shared primary navigation. Draft pages cannot be added through this action. Creating a page does not silently add it to navigation.

## Backup and export

**Download Backup** prepares a portable Studio project ZIP. **Export Website** prepares the current static production build from saved project content and publication settings. Browser proof confirmed deterministic static exports and working links in the generated site. The UI reports preparation and initiates the download; QA separately inspected the saved download. Export is not deployment; no external backend or live-site update is part of this workflow.

To restore, choose **Restore / Import Backup** and select the portable Studio project ZIP. Browser proof passed for a whole-project independent copy created with **Save As**, backup ZIP download, and UI restore into an independent project. QA matched 168 meaningful source files. The restored project retained the saved authored image, copy, and link through reload and preview. An invalid ZIP was rejected with `PROJECT_PACKAGE_INVALID_ZIP`, and the currently open project remained unchanged. This proves the tested recovery path and invalid-ZIP handling; it does not make every backup failure mode proven. For a recent authoring action, use **Undo** when appropriate.

## Pilot status

The owner-authoring foundation has browser evidence for explicit Save/Cancel and the cross-panel dirty guard, Media-page creation and media/copy/link persistence, passed Blank/Template/Existing page creation and reopen checks, draft exclusion across HTML/JSON/XML static output and output/search/sitemap/navigation, published-only navigation, section operations with Undo, deterministic static exports, clicked links, and 1440-pixel and 390-pixel no-overflow checks. The restored pilot also passed image insertion and save/cancel restoration of saved alt text, confirmed donor About and News hashes unchanged, and reported zero dangling references. Backup ZIP download and independent-project restore passed the checks described above. Prior pilot evidence established independent desktop and mobile image controls. The results here are not Home LOCK_VISUAL acceptance, comprehensive migration of incoming links when a route is renamed, or proof of Stories registry upload, the Reader pipeline, game-cartridge upload, an external backend, deployment, or live publication. Record mismatches and review the exported site before using it as a release artifact.
