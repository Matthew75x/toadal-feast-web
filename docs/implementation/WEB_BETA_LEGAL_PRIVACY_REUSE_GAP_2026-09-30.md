# Website Beta Legal / Privacy Reuse Gap

Date: 2026-09-30  
Status: factual reuse inventory and pre-release checklist. This is not legal advice and does not publish new legal terms.

## Existing current app disclosure authority

The current TOADAL FEAST 1.2.9 game source contains an in-app Privacy Policy effective September 21, 2026.

Its shipping claims include, in substance:

- offline-first local gameplay/save storage;
- no account required for 1.2.9 play;
- no developer-operated cloud saves;
- no production telemetry uploads;
- no online leaderboards;
- no advertising;
- no in-app purchases;
- no normal-play upload of local save contents to a TOADAL FEAST developer service;
- Android Internet permission exists;
- no app request for location/camera/microphone/contacts/broad media permissions;
- Android/Google platform backup may preserve eligible local app data;
- local data can be reset/cleared/uninstalled;
- future releases that activate online services must update disclosures.

Source:
`Matthew75x/Toadal-Feast-Development/src/runtime/ui/ui-settingspanel.js`

## Why the website cannot blindly copy that policy

The web beta has different technical behavior.

Expected web-beta behavior includes:

- browser localStorage for website/player state;
- host-owned local Arcade preview progression;
- coarse QR/share acquisition codes;
- optional vendor-neutral analytics adapter if enabled;
- browser-delivered static assets;
- no account requirement for the current beta Play experience;
- no mobile/Android backup semantics;
- no transfer of the mobile `froggyFeast` save.

Therefore the final website Privacy page must describe the **website**, not pretend it is the Android 1.2.9 app.

## Website beta disclosure matrix

| Topic | Beta expectation | Release action |
|---|---|---|
| Accounts | Not required for Beta 1 play | Say so plainly |
| Website local state | Used for shell/game preview state | Disclose browser-local storage |
| Arcade preview state | Host-owned local best/unlocks | Disclose local browser progression |
| Mobile save | Not read/imported | Do not imply sync |
| Analytics | Vendor-neutral adapter; actual transport may be disabled/unconfigured | Disclose only what is actually enabled |
| Acquisition refs | Coarse `app_qr` / `app_share` etc. | Explain coarse campaign measurement if analytics consumes it |
| Advertising | Not part of current website plan | Do not claim ad tracking |
| Purchases | No website checkout in Beta 1 | Do not imply commerce |
| Global leaderboard | Not live | Do not imply public score upload |
| Contact/support form | Only if a real endpoint exists | Disclose collection only when activated |
| Cookies | Do not invent a cookie banner/claim; inspect actual deployed dependencies first | Verify before release |

## Required owner/legal fields before publication

Do not invent:

- exact legal/developer entity shown on the website policy;
- public privacy contact;
- public support contact;
- effective date of the web policy;
- jurisdiction-specific language beyond the approved source;
- analytics vendor/disclosures until the actual vendor/config is known.

## Beta legal implementation rule

BETA-01 may build the Legal/Privacy page structure and content slots.

It must not publish placeholder legal text as approved policy.

Before Beta RC:

1. inspect the exact static/deployed website behavior;
2. list browser storage keys;
3. list external requests/vendors;
4. list any forms;
5. list analytics actually enabled;
6. reconcile those facts against the draft policy;
7. owner/legal review the final wording;
8. publish one HTTPS-accessible policy;
9. verify links from website footer/support and any store listing that points to it.

## Support page

A beta Support page can safely ship before a support form exists if it:

- provides truthful help/navigation;
- provides a real contact method only when one is configured;
- does not submit messages to a fake endpoint;
- links to the current Privacy/Legal page;
- clearly distinguishes app support from website-preview limitations where useful.

## Release blocker

A polished visual Legal page containing unapproved or technically false privacy claims is worse than a simple accurate page.

The legal route is a Beta RC blocker only at the point of public release, not a reason to block Arcade qualification or visual implementation now.
