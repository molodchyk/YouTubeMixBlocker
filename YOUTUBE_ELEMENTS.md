# YouTube Elements Notes

This file records observed YouTube DOM shapes that matter for Mix blocking. YouTube changes markup often, so selectors should stay as narrow and behavior-based as possible.

## Mix URL Signal

Mix links are detected by URL query parameters containing `list=RD...`.

Examples:

- `/watch?v=VIDEO_ID&list=RDVIDEO_ID&start_radio=1`
- `/watch?v=VIDEO_ID&list=RDCLAK5...&start_radio=1`

Non-Mix playlist/course links can contain other list prefixes and must not be blocked:

- `/watch?v=VIDEO_ID&list=PL...`
- `/playlist?list=PL...`

## Home / Recommendations Grid

Observed empty slot after blocking:

```html
<ytd-rich-item-renderer>
  <div id="content" class="style-scope ytd-rich-item-renderer"></div>
</ytd-rich-item-renderer>
```

Observed XPath:

```text
/html/body/ytd-app/.../ytd-rich-grid-renderer/div[5]/ytd-rich-item-renderer[2]/div
```

Notes:

- The useful removable container is the parent `ytd-rich-item-renderer`, not the direct `#content` div.
- When a Mix link sits inside both `yt-lockup-view-model` and `ytd-rich-item-renderer`, target the outer `ytd-rich-item-renderer` on the home grid. Removing only the inner lockup can leave a blank rich-grid slot.
- On the home grid, soft-collapse the outer `ytd-rich-item-renderer` with `display: none` instead of removing it. Hard removal can make YouTube refill/re-render the grid and repeatedly reintroduce the same Mix cards.
- Count each `videoId|listId` Mix key once per page view. YouTube can reintroduce the same recommendation during feed refill, and repeated hiding should not inflate counters.
- Empty `#content` divs can leave visible grid gaps if the parent slot remains.
- Cleanup should only remove a `ytd-rich-item-renderer` when its direct `#content` is empty and contains no links, images, thumbnails, or text.
- YouTube's home `#contents` currently behaves as a wrapping flex container. Full-width nodes such as `ytd-rich-section-renderer` shelves can sit between small batches of `ytd-rich-item-renderer` cards. If a Mix is hidden before one of those full-width boundaries, later rich items cannot naturally wrap upward past the shelf.
- Do not physically move lower rich-item nodes upward. DOM reordering can make YouTube's renderer state lose or "eat" lower items.
- Do not rely on hard-removing first-row or second-row Mix renderers. Live testing showed gaps can remain because the shelf/boundary layout is the actual blocker.
- The working home-grid gap fix is visual-only compaction: apply temporary flex `order` values to ready early-feed items so hidden Mix slots and hollow shells are skipped, while leaving DOM order intact.
- Keep compaction bounded to the early visible rows. Whole-feed ordering or delayed broad passes can cause noticeable scroll jumps when YouTube appends continuation items near the bottom of the feed.
- Only use hydrated rich items as backfill candidates. A `ytd-rich-item-renderer` should have a visible outer box and visible link/thumbnail area before it is treated as a usable card; otherwise it may be an ad-blocker hollow shell or an unhydrated YouTube placeholder.
- Track extension-applied flex ordering with a private attribute such as `data-ymb-grid-order` and update by diffing desired orders. Rewriting all order values on every observer pass can create unnecessary layout churn.
- Re-run bounded compaction on later harmless grid mutations. YouTube can hydrate replacement cards after the Mix removal pass, so a one-shot compaction can leave gaps until scroll or another mutation triggers it.
- Ad blockers such as AdGuard can leave outer `ytd-rich-item-renderer` slots whose visible card contents are hidden. Treat non-visible/hollow rich items as unavailable rather than deleting them.

Observed non-Mix course card:

```html
<ytd-rich-item-renderer>
  <div id="content">
    <yt-lockup-view-model>
      <a href="/watch?v=LIJ_G-LU_Qg&list=PLfIJKC1ud8ghW6bJq2lN-cAuElyF4hpvR">
      ...
      <div class="ytBadgeShapeText">4 Lektionen</div>
    </yt-lockup-view-model>
  </div>
</ytd-rich-item-renderer>
```

This is a course/playlist item, not a YouTube Mix, because the list prefix is `PL`, not `RD`.

## Watch Page Sidebar

Observed newer sidebar Mix card container:

```html
<yt-lockup-view-model class="ytd-item-section-renderer lockup ytLockupViewModelWrapper">
  ...
  <a href="/watch?v=VIDEO_ID&list=RDVIDEO_ID&start_radio=1&rv=VIDEO_ID">
  ...
  <badge-shape>
    <div class="ytBadgeShapeText">Mix</div>
  </badge-shape>
</yt-lockup-view-model>
```

Notes:

- `yt-lockup-view-model` is a targeted removable container for sidebar Mix cards.
- Broad heuristic removal is disabled on `/watch` pages to avoid removing the main video UI.

## Older Renderer Containers

Known targeted containers:

- `ytd-rich-item-renderer`
- `ytd-video-renderer`
- `ytd-compact-video-renderer`
- `ytd-grid-video-renderer`
- `yt-lockup-view-model`

These should be preferred over broad ancestor climbing because they represent YouTube item/card boundaries.
