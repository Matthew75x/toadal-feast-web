# TOADAL FEAST QR / acquisition routing contract

Status: pre-production scaffold. This defines the website-side contract for the QR/share plumbing already added to the Android 1.2.9 candidate.

## Goal

Every TOADAL acquisition surface should use a TOADAL-controlled URL. The website records a coarse campaign source, then routes the visitor to the right destination. Printed QR codes therefore remain usable even if store URLs or campaign destinations change later.

The QR itself is not the attribution system. The URL encoded inside it is.

## Current Android contract

The current app candidate emits:

- Nearby QR: `https://toadalfeast.com/?ref=app_qr`
- Native share / Copy Link: `https://toadalfeast.com/?ref=app_share`

The website must preserve support for those two legacy-compatible query forms even if canonical pretty routes are introduced later.

## Canonical future route shape

Preferred public form:

`https://toadalfeast.com/go/<code>`

Examples:

- `/go/app-qr`
- `/go/app-share`
- `/go/sticker-public`
- `/go/event-<slug>`
- `/go/campaign-<slug>`
- `/go/creator-<slug>`

Each public code maps to an internal attribution record. Do not put personal identifiers, account IDs, device IDs, advertising IDs, or save data in the route.

## Attribution event

Minimum event fields:

```json
{
  "routeVersion": 1,
  "code": "app_qr",
  "source": "app",
  "medium": "qr",
  "campaign": "nearby_share",
  "destination": "website"
}
```

Timestamp, coarse platform family, and destination may be added by the server/analytics layer. Avoid fingerprinting.

## Routing priority

1. Resolve the supplied code to a known campaign.
2. Unknown/malformed codes fall back safely to the TOADAL FEAST website.
3. If platform routing is enabled and the corresponding store destination is configured:
   - Android -> Google Play
   - iOS/iPadOS -> App Store
4. Desktop/unknown platform -> website landing page.
5. Campaign tracking must not prevent navigation if analytics fails.

## Configuration rule

Campaign definitions and destination URLs must live in centralized configuration. Do not scatter store URLs or campaign mappings through visual components.

Changing a store URL or retiring a campaign must not require re-exporting printed QR artwork, provided the public TOADAL route remains the same.

## Privacy rule

The first release tracks acquisition channel, not the identity of the person sharing.

Allowed: `app_qr`, `app_share`, `sticker_public`, event/campaign slugs.

Out of scope: player referral IDs, contact information, device fingerprinting, advertising IDs, per-user QR codes.

## Operational requirements before public activation

- Final Google Play and App Store URLs configured.
- Route responses tested on Android, iOS, desktop, and unknown user agents.
- QR payloads decoded and verified before printing.
- Analytics failure tested to confirm routing still succeeds.
- Unknown/expired campaign fallback verified.
- Redirect loops prohibited.
- Campaign registry versioned and documented.

This scaffold intentionally does not decide the final store URLs or analytics vendor.
