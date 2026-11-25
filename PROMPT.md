# KWL STUDIO · PRE-LAUNCH SITE · CURSOR BUILD PROMPT

Paste everything below into Cursor (Agent mode). Keep the `reference/` and `public/` folders from this kit in the project root before you start.

---

## 0. What you're building

The production version of the KWL Studio pre-launch page for **kwlstudio.shop**. One page. Near-black background, the KWL wordmark, an oversized star buckle, the product name FLASH, a horizontal reversible leather belt drawn in SVG, colorway and flip controls, "DROP 001 / TBA", an email waitlist with optional size, and a footer.

A finished, working prototype already exists: `reference/kwl-prelaunch-reference.html`. **It is the source of truth.** Port it faithfully into a real codebase. Match its geometry, colors, spacing, copy and behavior exactly. Screenshots are in `reference/screenshots/`. Do not redesign anything. If something in this prompt conflicts with the reference file, the reference file wins, and tell me about the conflict.

## 1. Stack

- Next.js (App Router) + TypeScript, deployed on Vercel.
- Plain CSS (one `globals.css` plus CSS Modules if you want). No Tailwind, no UI kits, no component libraries, no animation libraries.
- Font: IBM Plex Mono 400 and 500 via `next/font/google`. Fallback: `ui-monospace, Menlo, Consolas, monospace`.
- No external runtime scripts. React comes from npm, not a CDN.
- The page must work as a static page (`export const dynamic = 'force-static'` is fine). Only the signup talks to the network.

## 2. Project structure

```
app/
  layout.tsx          // font, metadata, theme-color, body background
  page.tsx            // renders <PreLaunch/>
  globals.css
  opengraph-image.tsx // 1200x630: black bg, KWL wordmark + matte star buckle, nothing else
  icon.svg            // the star buckle shape, bone on transparent
components/
  PreLaunch.tsx       // 'use client'. Owns state: colorway, side, view, lit, form
  Buckle.tsx          // SVG <g> for the star buckle (used in hero and on the belt)
  Belt.tsx            // SVG belt
  ColorwayPicker.tsx
  BeltControls.tsx    // FULL / DETAIL | <FACE> · FLIP ↻
  Signup.tsx
  FlashPop.tsx        // full-screen white flash overlay
lib/
  belt.ts             // geometry constants + starPoints()
  colorways.ts        // colorway data
  klaviyo.ts          // subscribe()
public/
  kwl-wordmark.svg    // provided, use as-is. Never recreate the logo with a font
```

Keep `lib/belt.ts` and `lib/colorways.ts` free of React so the same data can drive a future store page.

## 3. Design tokens (exact)

```css
:root{
  --bg:#0D0D0D; --fg:#E8E5DF; --mute:#92918C; --line:#303030; --error:#C98A80;
  color-scheme:dark;
}
```
- Single dark look. No light mode.
- All text uppercase, 12px, letter-spacing .08em. The privacy line is the one exception: sentence case, 10px, letter-spacing .02em.
- Active controls: `--fg` with a 1px underline, offset 7px. Inactive: `--mute`.
- No gradients in the UI, no glow, no rounded buttons, no cards, no icons beyond the ↻ and → glyphs, no shadows on UI.
- Side gutter: `padding-left/right: max(16px, env(safe-area-inset-left/right))`. Add `viewport-fit=cover` to the viewport meta.

## 4. Layout (top to bottom, centred column)

| Element | Desktop | Mobile ≤640px |
|---|---|---|
| Page padding top / bottom | 28 / 22 | 22 / 18 |
| Wordmark (`public/kwl-wordmark.svg`, fill `--fg`) | 110px wide | 110px |
| Hero buckle (button), margin-top | 180px square, 26 | 128px, 20 |
| FLASH (button), margin-top | 10 | 10 |
| Belt, margin-top | 18, width `min(1100px, 84vw)` | 18, width 100% |
| Colorway row, margin-top | 22, gap 30 | 16, wraps, gap 8/18 |
| Controls row, margin-top | 8 | 8 |
| DROP 001 / TBA, margin-top | 24 | 24 |
| Signup, margin-top | 14, max-width 340 | same |
| Footer, margin-top | 30, `min(1100px,100%)`, space-between | 26, centred, wraps |

The whole page must fit in a 1440×900 viewport without scrolling. There must be no horizontal scroll at 360px.

## 5. Colorways (`lib/colorways.ts`)

```ts
export const COLORWAYS = [
  { id:'01', name:'BLACK / OLIVE', a:{n:'BLACK',c:'#232323'}, b:{n:'OLIVE',c:'#777963'}, star:'#0F0F0F', hw:'#191919', edge:'#121212', flash:true,  light:false },
  { id:'02', name:'BLACK / BROWN', a:{n:'BLACK',c:'#232323'}, b:{n:'BROWN',c:'#49372B'}, star:'#0F0F0F', hw:'#191919', edge:'#121212', flash:true,  light:false },
  { id:'03', name:'BONE / TAUPE',  a:{n:'BONE', c:'#D8D0C1'}, b:{n:'TAUPE',c:'#A58F79'}, star:'#C9B79C', hw:'#C8B79F', edge:'#B9AA91', flash:false, light:true  },
] as const;
```
- `star` is the recessed star color, `hw` is the buckle and keeper finish, and `edge` is the painted edge.
- Star, buckle and keeper colors never change when the belt is flipped. Only the strap face changes.
- Picking a colorway resets the belt to side A.

## 6. Belt geometry (`lib/belt.ts`). Copy these numbers exactly

All units are mm and become the SVG user units. This is size M from the tech pack.

```ts
export const W = 35;                                   // strap width
export const HOLES = [0,1,2,3,4,5].map(i => 850 + (i-2.5)*25.5);  // 6 holes, 25.5 pitch, centred on 850
export const HOLE_R = 2;
export const TIP = HOLES[5] + 160;                     // rounded tip, radius 17.5
export const STARS: number[] = []; for (let x=114; x <= HOLES[0]-32-12.75; x+=65) STARS.push(x); // 10 stars
export const STRAP = `M-2,0 H${TIP-17.5} A17.5,17.5 0 0 1 ${TIP-17.5},35 H-2 Z`;
export const KEEPER = { x:60.5, y:-2.7, w:9, h:40.4, rx:1.4 };
export const BUCKLE = { cx:8, cy:17.5, w:74, stroke:4 };  // 74 + 4mm round stroke ≈ 80mm buckle
export const VIEWBOX = { full:'-44 -26 1130 88', detail:'-44 -26 400 88' };

export function starPoints(w:number, rotated=false){
  const D=Math.PI/180, R=w/(2*Math.cos(18*D)), r=R*0.382, p:[number,number][]=[];
  for(let i=0;i<10;i++){ const a=(-90+i*36+(rotated?180:0))*D, rr=i%2?r:R; p.push([rr*Math.cos(a), rr*Math.sin(a)]); }
  const ys=p.map(q=>q[1]), off=-(Math.min(...ys)+Math.max(...ys))/2;   // centre by bounding box
  return p.map(q=>`${q[0].toFixed(2)},${(q[1]+off).toFixed(2)}`).join(' ');
}
```
- Strap stars are 25.5 wide. **Side A stars point up. Side B stars are rotated 180°.** This matches the factory construction, so don't "fix" it.
- 6 holes, not 5. Ignore any render showing 5.

## 7. SVG rendering details (match the reference file exactly)

Port the `Buckle` and `Belt` functions from the reference file one to one, converted to TSX. Summary:

**Belt layers, in order:**
1. Strap path filled with the face color, through a grain filter (`userSpaceOnUse`):
   - `feTurbulence fractalNoise baseFrequency="1.2 1.6" numOctaves=3 seed=9`
   - Greyscale `feColorMatrix`
   - `feComposite arithmetic` with `k2=1`, and `k3=.2, k4=-.1` (light colorway `k3=.16, k4=-.08`)
   - Then `feComposite in` with SourceGraphic
2. A clipped rect over the strap with a vertical "roundness" gradient: top highlight, bottom shade (values in the reference).
3. Stars: a fill polygon, an inner wall-shadow stroke (2.6 wide, clipped to the star, gradient dark at top to clear at 55%), and a 0.3 hairline highlight.
4. Holes: filled `#0D0D0D` (the background shows through), with a faint 0.35 rim.
5. A highlight line 0.9 mm below the top edge, plus the edge-paint stroke (1 mm, `edge` color) around the strap.
6. Keeper: three rects (fill `hw`, horizontal cylinder-shade gradient, 0.3 rim stroke).
7. Buckle on top at (8, 17.5).

**Buckle layers:**
1. A rim stroke (5.4 wide, vertical white gradient) so it reads on black.
2. The base polygon (fill and stroke `hw`, stroke 4, round joins).
3. A diagonal shade overlay.
4. A "lit" radial overlay (white center to `#A8ACB2`) whose opacity goes 0 to 1 when flashed (160 ms transition).

**SVG IDs:** both the hero and the belt render a Buckle. Generate IDs with React's `useId()` so the two never collide.

## 8. Interactions

- **Flip** (the FLIP button **and** clicking the hero buckle):
  - Animate the belt wrapper `scaleY 1 → 0.02` over 200 ms with `cubic-bezier(.55,0,.8,.3)`.
  - Swap the side.
  - Animate `0.02 → 1` over 200 ms with `cubic-bezier(.2,.7,.45,1)`.
  - Transform origin is `50% 48%`.
  - Ignore clicks while it's animating.
  - With `prefers-reduced-motion`, swap instantly.
  - Use the Web Animations API, not CSS filters. Never fake leather colors with filters.
- **Flip label:** `<FACE NAME in --mute> · FLIP ↻`, for example `OLIVE · FLIP ↻`.
- **FULL / DETAIL:** switches the viewBox. Default is FULL on desktop and DETAIL at ≤640px (read once on mount, no hydration mismatch). Use `overflow:hidden` on the SVG in detail view.
- **FLASH** (text button under the hero):
  - Trigger a full-screen white overlay that goes from opacity .92 to 0 over 500 ms. Skip it under reduced motion.
  - If the colorway has `flash:true`, light both buckles for 1.5 s.
  - On 03 the overlay still fires but the buckle stays matte. That's the real product: 03 has no flash finish.
- No autoplay, pulsing, rotation or scroll animations anywhere.

## 9. Signup

- **Email field:** centred, 1px bottom border `--line`. It turns `--fg` on focus and `--error` when invalid. Placeholder: `EMAIL`. Include a visually hidden label.
- **Sizes:** `XS S M L` in a 4-column grid. Optional. Clicking the active size deselects it.
- **Button:** `NOTIFY ME →`, shown as `SENDING…` while the request is in flight.
- **Messages:** `ENTER A VALID EMAIL`, `SOMETHING WENT WRONG. TRY AGAIN.`, `NO CONNECTION. TRY AGAIN.`, in an `aria-live` region.
- **Success:** replace the form with `YOU'RE ON THE LIST.` and, muted, `DROP 001 / TBA`.
- **Privacy line**, verbatim: "Your email is only used for drop alerts. Size and colorway are optional and help us decide how many to make."
- **`lib/klaviyo.ts`:** use the Klaviyo client subscriptions endpoint from the reference file.
  - `POST https://a.klaviyo.com/client/subscriptions/?company_id=<public key>`
  - Header `revision: 2024-10-15`
  - Profile properties: `drop001_colorway` (for example `"01 BLACK / OLIVE"`), plus `drop001_size` if one was picked.
- **Env vars:** `NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY` and `NEXT_PUBLIC_KLAVIYO_LIST_ID`. If either is missing, simulate success after 400 ms and log a console warning in dev only.
- Add a `.env.example` with both names and empty values.

## 10. Footer

`KWL STUDIO · CHICAGO · @KWLSTUDIO · CONTACT@KWLSTUDIO.SHOP`
- 10px, `--mute`.
- `@KWLSTUDIO` links to `https://instagram.com/kwlstudio` in a new tab.
- The email is a `mailto:` link.

## 11. Metadata

- **Title:** `KWL STUDIO`
- **Description:** `Drop 001. Reversible star belt.`
- `theme-color` `#0D0D0D`.
- OG image from `opengraph-image.tsx`.
- Favicon from `app/icon.svg`.
- `robots` allows indexing.
- No analytics until I ask. If you add a slot, use `@vercel/analytics` behind a flag that is off by default.

## 12. Quality bar

- Lighthouse 95+ on Performance, Accessibility and Best Practices, on mobile.
- Every control is a real `<button>` with a visible `:focus-visible` outline (1px `--fg`, offset 5px), keyboard operable, with `aria-pressed` on toggles.
- No layout shift when switching colorway, side, view or form state.
- Hero buckle button `aria-label`: `Flip the belt. <FACE> side showing`. Belt SVG: `role="img"` with label `<COLORWAY>, <FACE> side showing, size M`.
- Check at 360, 390, 768, 1280 and 1440 widths, plus 1440×900 with no vertical scroll.
- No console errors and no hydration warnings.

## 13. Don'ts

- Don't add navigation, sections, a hero headline, marketing copy, a countdown, stock counters or a cookie banner.
- Don't recreate the logo with a font. Don't redraw the belt with different proportions, 5 holes, or stitching.
- Don't use GPT renders or stock images.
- Don't add colors outside the tokens and colorway data.

## 14. Deploy

1. Push to a new GitHub repo, `kwl-site`.
2. Import it in Vercel and add the two env vars (they can stay empty for now).
3. Vercel > Project > Settings > Domains: add `kwlstudio.shop` and `www.kwlstudio.shop`, and redirect www to the apex.
4. At my domain registrar, add exactly the DNS records Vercel shows on that Domains screen. Then wait for the certificate.
5. Give me the preview URL, then the production URL.

## 15. When you're done, report back with

- A screenshot at 1440×900 for each colorway (side A), one with 01 flipped to side B, and one on mobile at 390px.
- The file list, and anything from the reference you couldn't match exactly, with the reason.

## Later (don't build now, but keep it easy)

- Real product photos will replace the SVG belt. Keep `Belt` behind a simple interface (`colorway`, `side`, `view`) so a photo version can swap in.
- Release day gets a store page using the same `lib/colorways.ts` and sizes XS/S/M/L.
