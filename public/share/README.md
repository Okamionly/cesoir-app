# Share assets

Static OG images served from `/share/*` for `navigator.share({ files })`
attachments and og:image tags.

## Files

- `match-og.png` — **TODO (design)**: 1200×630 PNG, dark fluo brand palette
  (#111 background, ☾ moon glyph in #8B5CF6, accent #00FF88). Used by the
  "Partager" button in `MatchCinematic.tsx`.

  Privacy: this image MUST NOT contain any user data, names, or photos. It's a
  generic brand teaser ("J'ai fait un match sur CeSoir 💜") shared by every
  user. The entire premise of the share button is "brag without doxxing".

  Until the asset lands, the share handler gracefully degrades — Web Share API
  is called text+url only, no `files` payload. No 404 visible to the user.

## Future

- `/api/og` dynamic route (Next.js OG image gen) — same brand teaser but
  generated on-the-fly so we can A/B test copy without redeploying assets.
