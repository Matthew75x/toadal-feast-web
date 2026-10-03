# Owner self-service guide

Status: pilot guide for the planned Studio owner-authoring workflow, dated 2026-10-02. Labels below describe the intended interface; the end-to-end behavior is not yet owner-verified. Treat each step as pending pilot until completed successfully in the running Studio.

## Create a page

In Pages, choose **Create Page** and select one of:

- **Blank** for a clean page.
- **Template** for a starter layout. The curated choices are **TOADAL Media**, **Article / Story-style Page**, and **Information Page**; existing generic templates remain available.
- **Existing page** to start from an existing page.

Enter a title and destination, review the displayed route, then choose **Save** to create or **Cancel** to leave without creating. Confirm the new page is a draft and that the source page remains unchanged. The article/story-style choice creates an ordinary narrative page; it does not add content to the Stories, Manga, or Reader catalogue. This create-and-clone path still needs a safe-copy pilot.

## Edit and preview

Use **Edit content** for words, images, alt text, captions, and links. Use **Build page** for page structure and section arrangement. Save changes, leave and reopen the page, and confirm they persisted. Preview desktop and mobile before deciding whether the page is ready.

When changing an image, inspect its alt text and framing. If the page has a separate mobile image or framing override, it remains independent of the desktop setting: review and update each intentionally. Verify this behavior on the page being edited; do not assume a desktop change also changes mobile.

## Save, publish, and navigation

Use **Save** to keep authoring changes or **Cancel** to discard the current unsaved form edits. If the interface reports a save error or asks how to handle unsaved edits, keep the draft until the save or discard result is clear.

In **Page Settings**, choose **draft** while work is in progress or **published** when the page is approved for inclusion in a website export. This setting is an export boundary; it does not deploy or publish the live website. Verify the actual exported result during the pilot.

Use **Add to navigation** only when you deliberately want visitors to find the page in site navigation. Creating a page should not silently add it to navigation. Confirm the navigation change separately.

## Backup and export

**Backup** preserves a project copy for recovery. **Export Website** prepares a static website package from saved project content and its publication settings. Export is not deployment, and a completed export does not put changes on the live site. Confirm the download was initiated and inspect the generated site before using it elsewhere.

To recover, restore a selected backup into an independent project copy, then verify that the restored copy is open and its pages and media are present. Do not use restore as a substitute for a small page-level Undo or snapshot when that is sufficient. Independent restore behavior and failure recovery remain pending pilot.

## Pilot status

The labels and boundaries in this guide are planned owner-facing language. Save/Cancel behavior across panels, clone independence, draft exclusion from export, navigation changes, desktop/mobile image independence, backup restoration, and download feedback require pilot evidence before they can be described as proven. Record any mismatch and stop before relying on that step for a public release.
