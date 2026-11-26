# KWL STUDIO · PRE-LAUNCH SITE V2 · CURSOR CHANGE PROMPT

Paste everything below into Cursor (Agent mode) inside the existing KWL repo. Put this kit's `reference/` folder in the repo root first, at `reference/v2/`.

---

## 0. Context

You built the KWL Studio pre-launch page from `reference/kwl-prelaunch-reference.html`. It's deployed on **Netlify** at kwlstudio.shop, from GitHub, using the Next.js runtime.

This is a change request on that existing build. **Keep:**
- the dark minimal look
- IBM Plex Mono and the type sizes
- the spacing, the waitlist form and Klaviyo wiring
- the footer

Change only what's listed below. Work in the phases in section 10, stop after each one, and show me screenshots at 1440×900 and 390×844 before you continue.

Reference images are in `reference/v2/`:
- `colorways/`: the 3 colorways (AI renders, for color only)
- `flash/flash_sparkle_reference.jpg`: the look the FLASH effect must have
- `layout/closed_belt_view_target.jpg`: the composition for the main belt view
- `layout/centering_fix.jpg`: the centering bug
- `layout/madlibs_contact_reference.jpg`: the contact form idea
- `layout/current_site_*.jpg`: how it looks now

**About the AI renders:** they show 5 holes, smaller stars, a different clip and sometimes stitching. **Ignore all of that.** Use them for color only. The geometry in section 3 is what counts.

---

## 1. Remove the logo

Delete the KWL wordmark at the top of the page. Close the gap so the page starts with the product. Keep `KWL STUDIO` in the footer. Keep the favicon and OG image as they are.

---

## 2. Colorways (editable config, not final)

Replace the colorway data with exactly these 3. Keep them in **one config file** (`lib/colorways.ts`) so I can add, remove or rename one by editing a single entry. Nothing else in the code may hard-code colorway names or colors.

```ts
export const COLORWAYS = [
  { id:'01', name:'BLACK / RED',
    a:{ n:'BLACK', c:'#1C1C1C' }, b:{ n:'RED', c:'#A3141C' },
    star:'#0E0E0E',                // core seen through the star cutouts, both sides
    hw:'#191919', hwName:'MATTE BLACK', edge:'#111111', flash:true },
  { id:'02', name:'TAUPE / LIGHT BROWN',
    a:{ n:'TAUPE', c:'#A9917C' }, b:{ n:'LIGHT BROWN', c:'#DCCFBD' },
    star:'#C9B79C',                // one light sand core: reads light on taupe, darker on light brown
    hw:'#C8B79F', hwName:'MATTE SAND', edge:'#BCAE96', flash:false },
  { id:'03', name:'OLIVE / BROWN',
    a:{ n:'OLIVE', c:'#777963' }, b:{ n:'BROWN', c:'#49372B' },
    star:'#0E0E0E', hw:'#191919', hwName:'MATTE BLACK', edge:'#111111', flash:true },
] as const;
```

Rules:
- The star core color is the same on both sides of a belt. There's one shared core layer.
- The buckle and keeper never change when the belt is flipped.
- 02 has **no flash**. The sand buckle stays matte. More on that in section 6.
- No stitching on any colorway, even where a reference render shows some.

---

## 3. Make the belt look real: replace the SVG with a real-time 3D product render

The SVG drawing looks like an illustration. Rebuild the product as a **3D model rendered to look like a studio product photo**.

- **Camera:** fixed, with no orbit or drag controls. It's still a picture that only moves when the user flips or switches view.
- **Stack:** `three` with `@react-three/fiber`, `@react-three/drei` and `@react-three/postprocessing`. Nothing else new without asking.

### 3.1 Units and geometry (1 unit = 1 mm, size M)

- **Strap:** 35 wide, 3.5 thick, built as **three stacked layers**:
  - face A, 1.0, with star windows
  - core, 1.5, solid except for the holes
  - face B, 1.0, with star windows
- **Star windows:**
  - regular five-point stars, **25.5 wide**, centres **65 apart**, the first one 114 from R (R = where the strap leaves the buckle)
  - 10 per face
  - centred on the strap's horizontal centreline
  - face A stars point up; **face B stars are cut rotated 180° in the geometry**
  - Because the flip is a real 180° rotation about the strap's long axis, face B stars point up on screen too. **Never fake side B by redrawing the stars, and never show side B stars pointing down.** (Current bug.)
- **Holes:** exactly **6**, Ø4, centres 25.5 apart, centred on 850 from R, punched through all three layers.
- **Tip:** a full semicircle, radius 17.5, starting 160 past the last hole.
- **Edges:** slightly rounded (0.4 mm), painted in `edge`. No stitching.
- **Buckle:**
  - a solid five-point star, **80 point to point**, 3.5 thick
  - points softened to about a 2 mm radius, edge bevel about 0.5 mm
  - flat face, nothing on it
- **Keeper:** a solid metal loop 9 wide and 40 tall, wall 1.5, slightly rounded corners, wrapping strap plus tail, in `hw`.

### 3.2 Centering (the current bug, see `layout/centering_fix.jpg`)

- Centre the buckle on **the middle of the star's body** (its centroid, the centre of the inner pentagon). Don't use its bounding box.
- That point sits exactly on the strap's horizontal centreline.
- The strap, every star window, every hole and the keeper all share that one centreline.

### 3.3 Main view: CLOSED (default)

Match `layout/closed_belt_view_target.jpg`: the belt shown **closed, straight and front-on**.

- The strap runs horizontally and **off both edges of the frame**.
- The star buckle is in the **horizontal centre** of the frame, upright with one point straight up.
- The keeper sits just right of the star.
- The tail comes out from behind the star's right side, lies on top of the strap start, passes through the keeper and ends in its rounded tip a little further right.
- Showing on the tail:
  - one hole between the star's right edge and the keeper
  - the next holes after the keeper
- Star windows show along the strap on both sides of the buckle.
- **Camera:** front-on, about 5° above, long lens look (perspective FOV around 15°) so it reads like a photo.
- **Framing:** the buckle is about 26% of frame width on desktop and about 38% on mobile.

### 3.4 Secondary view: FLAT

- The whole belt laid straight, unbuckled.
- Buckle at the left, tip at the right, the full length in frame, same lighting.
- Rename the view toggle from `FULL / DETAIL` to `CLOSED / FLAT`. CLOSED is the default everywhere, including mobile.
- Switching views is a short (350 ms) camera move. With reduced motion it's instant.

### 3.5 Materials

- **Leather:**
  - Full-grain cowhide, matte.
  - Use a **CC0 leather PBR set** from ambientCG or Poly Haven (albedo, normal, roughness) in `public/textures/leather/`. Desaturate the albedo, then tint it with the colorway color so every color shares one grain.
  - Fine, irregular pebble. No tiling seams visible at this scale, so use triplanar mapping or a large texture.
  - Roughness about 0.7, normal strength subtle.
  - The inside walls of each star window are darker, so the windows read as recessed about 1 mm into the core.
- **Edge paint:** smooth, slightly glossier than the leather (roughness about 0.45), in `edge`.
- **Buckle and keeper:**
  - `MeshPhysicalMaterial`, color `hw`
  - roughness about 0.85, metalness about 0.15
  - dead matte like a ceramic coating, with no visible reflections
  - **No double outline, no gradient overlay, no fake bevel lines.** The real bevel geometry catches a hairline of light and that's all.

### 3.6 Lighting and background

- The canvas background is the page background (#0D0D0D), seamless and with no visible box.
- **Key:** a large soft area light from the upper left.
- **Rim:** a weak cool light from behind and above, so the black leather and black buckle separate from the background.
- **Fill:** low, from the right.
- **No bloom or glow at rest.** Bloom exists only during FLASH.
- Tone mapping: ACES or AgX, exposure set so black leather reads as dark charcoal with visible grain, not pure black.

### 3.7 Flip

- **Triggers:** FLIP, or clicking or tapping the buckle.
- **Motion:** the strap and keeper rotate **180° around the strap's long horizontal axis** over 500 ms, easing in and out. The **buckle never moves or rotates.**
- After the flip, side B shows and its stars point up.
- **Label:** shows the visible face, for example `RED · FLIP ↻`.
- **Rules:**
  - Ignore clicks mid-animation.
  - With reduced motion, swap instantly.
  - Choosing a colorway resets to side A.

### 3.8 Performance and fallback

- Lazy-load the canvas.
- `frameloop="demand"`, so it only renders on changes and during animations.
- Cap DPR at 2. Total JS for the 3D chunk ideally under 350 KB gzipped. Compress textures to KTX2 or WebP, max 2K.
- **Fallback image:** ship a pre-rendered WebP still per colorway and side (generated from the scene with a small script) and show it:
  - as the first paint
  - when WebGL isn't available
  - while the canvas loads
- No layout shift when the canvas replaces the still.
- The top of the page still fits in 1440×900.

---

## 4. Signup sizes

The waitlist size selector stays `XS S M L` (optional). Add a small text button under it: `SIZE GUIDE`.

---

## 5. Size guide (opens only when asked)

`SIZE GUIDE` opens an in-page panel below the sizes. It's text only, the same mono style, and has no modal. It closes with `CLOSE` or Esc. It contains three things.

### 5.1 Size finder (port the logic from the old size finder, updated)

- **Fit:** `MALE / FEMALE`
- **Jeans size grid:**
  - Men: 24–37
  - Women: 00, 0, 2, 4, 6, 8, 10
- **Worn at:** `HIGH / MID / LOW`
- **Output:** the recommended size and hole, for example `M · 85 CM · HOLE 3 OF 6 FROM THE TIP`
- **Measure instead:** a belt-line input in IN or CM, which overrides the grid.
- **Estimate of the belt line in cm:**
  - men: (jeans + 2) × 2.54 + {HIGH −3, MID 0, LOW +3}
  - women: 70 + 2.5 × numeric size (00 = −2) + {HIGH −3, MID 0, LOW +4}
- **Pick:** the size whose fit range contains the belt line, preferring the one whose centre is closest. **Ties go to the larger size** (between sizes, size up). Check that the finder's output matches the 5.2 chart for every jeans size, and fix the logic if not.
  - Below XS: `XS` with the note `SMALLER THAN XS. TIGHTEST HOLE MAY BE LOOSE.`
  - Above L: `L` with the note `LARGER THAN L. WE DON'T MAKE YOUR SIZE THIS DROP.`
- **Hole:** counted from the tip (1 = loosest) as `clamp(round(3.5 − (line − size)/2.55), 1, 6)`. Holes are 2.55 cm apart and the size equals the midpoint of holes 3 and 4.

### 5.2 Size chart (exact)

| SIZE | BELT | FITS (CM) | FITS (IN) | MEN'S JEANS | WOMEN'S JEANS |
|---|---|---|---|---|---|
| XS | 65 | 58.6–71.4 | 23–28 | 24–25 | 00–0 |
| S | 75 | 68.6–81.4 | 27–32 | 26–29 | 0–2 |
| M | 85 | 78.6–91.4 | 31–36 | 30–33 | 4–6 |
| L | 95 | 88.6–101.4 | 35–40 | 34–37 | 8–10 |

### 5.3 Notes under the chart (verbatim)

`BELT SIZE = BUCKLE TO THE MIDDLE OF THE 6 HOLES. HOLES 2.55 CM APART. BETWEEN SIZES, SIZE UP.`

`MEASURE: TAPE AROUND WHERE YOUR BELT SITS, OVER YOUR JEANS.`

Put the chart data and finder logic in `lib/sizes.ts`, shared with the contact form.

---

## 6. FLASH: make the star actually shine

Right now FLASH just fades the star to white. Replace that with a **retroreflective sparkle**. Match `flash/flash_sparkle_reference.jpg`: sunlight on water, with dozens of tiny hard glints and a few big starbursts with thin cross-shaped spikes.

**Sequence** (about 1.8 s total, colorways with `flash:true`):
1. **0 ms:** a camera flash. A full-screen white overlay goes from opacity 0.9 to 0 over 450 ms.
2. **0–120 ms:** the buckle face lifts from matte black to a **bright silvery white** (#EEF1F5 to #FFFFFF at the centre). It reads as light coming off the surface, with no gradient banding.
3. **Micro glints:** hundreds of tiny pin-point sparkles (1–2 px) scattered over the star face only, like glass beads, each twinkling at a random phase for 1.2 s.
4. **Starbursts:** 6–9 larger glints at random spots on the face (more near the centre), each a hard white core with **4 thin diffraction spikes** (a few with 6, slightly rotated), spikes 2–5× the core size, cool white with a faint warm edge. They pop in staggered over 300 ms, twinkle (scale 0.7 to 1.15, opacity flicker) and fade.
5. **Bloom:** a soft bloom, **only on the buckle**, via postprocessing with a luminance threshold. Nothing else glows.
6. **1.2 s → 1.8 s:** everything eases back to matte black.

**Implementation:**
- Draw one starburst sprite texture on a canvas at runtime.
- Place the glints as additive-blended sprites clipped to the buckle face.
- Add the micro glints as a high-frequency sparkle shader or points layer on the buckle face.
- Enable `Bloom` only while flashing.
- The strap, keeper and background never glow.

**Colorway 02 (no flash):** the camera flash overlay still fires, but the sand buckle stays matte with only a faint normal highlight. That's the true product, so don't fake a shine.

**Reduced motion:** no flicker. Show a static lit buckle with 6 still starbursts for 1.2 s, then fade.

---

## 7. Contact: fill-in-the-sentence form (new `/contact` page)

Add `CONTACT` to the footer as a link to `/contact`. That page has no wordmark and the same dark background, with a `← BACK` text link at the top left.

### 7.1 Heading
`Talk to KWL Studio.` Mono, the same size as the sentence.

### 7.2 The sentence

One paragraph with the controls inline:

> My name is **[your name]** and I'd like to talk about **[a belt ▾]**. ‹middle› You can reach me on **[Instagram ▾]** at **[@yourhandle]**. One more thing: **[optional notes]**.

**Inquiry options:** `a belt`, `sizing help`, `a custom piece`, `wholesale`, `press & collabs`, `an order I placed`

**‹middle› changes with the inquiry:**
- **a belt:** `I'm interested in the belt in [colorway ▾], in size [XS ▾]. My jean size is [jean size ▾].`
- **sizing help:** `I'm looking at [colorway ▾] and my jean size is [jean size ▾].` Then, in muted text, a live suggestion from `lib/sizes.ts`: `That's usually a M.`
- **a custom piece:** nothing extra. Notes carry it.
- **wholesale / press & collabs:** `I'm with [company name].`
- **an order I placed:** `My order number is [order #].`

**Controls:**
- **Colorway options** come from `lib/colorways.ts`, for example `01 BLACK / RED`. Never hard-code them.
- **Size options:** `XS, S, M, L`, plus `not sure` for a belt inquiry.
- **Jean size options:** grouped into `MEN` 24–37 and `WOMEN` 00–10.
- **Contact method:** `Instagram / email / phone`. The value field's placeholder and validation follow it:
  - `@yourhandle` (must start with @, or we add it)
  - `you@email.com` (valid email)
  - `your number` (at least 10 digits)

### 7.3 Design
- **One big paragraph:**
  - IBM Plex Mono 400, `clamp(22px, 3vw, 40px)`, line-height 1.5
  - sentence case (the rest of the site stays uppercase)
  - max width about 30em, left-aligned, generous top padding
- **Blanks have no boxes.** They're inline native `<select>` and `<input>` elements, styled as text:
  - 1px underline in `--fg`
  - value in `--fg`, placeholder in `--mute`
  - a subtle `#1A1A1A` highlight on focus, with a visible focus outline
- **Every blank auto-resizes to the width of its current text.** Use a hidden measuring span. Selects size to the selected option.
- Native controls throughout so phones get the system pickers. Each blank has an `aria-label`.
- **Submit:** `Send it →` as a text button, under the paragraph.
- **Fallback line below, small and muted:** `Prefer email? Reach KWL Studio at CONTACT@KWLSTUDIO.SHOP`. The email shows as selectable text with a `mailto:` link.

### 7.4 Validation
- Only **name** and the **contact value** are required, plus company or order # when those blanks show.
- On submit, highlight **only the missing or invalid blank**:
  - underline in `--error` (#C98A80)
  - a tiny muted message under the paragraph, for example `ADD YOUR NAME`
- Focus the first bad blank.

### 7.5 Sending: Netlify Forms
- Create `public/__forms.html` containing a hidden form `name="contact"` with `data-netlify="true"`, `netlify-honeypot="bot-field"` and **every field** below, so Netlify detects it at deploy.
- The page submits with `fetch('/__forms.html', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams(data) })`, including `form-name=contact`.
- **Fields, each sent as its own field:**
  - `name`, `inquiry`, `colorway`, `size`, `jean_size`, `suggested_size`, `company`, `order_number`, `contact_method`, `contact`, `notes`
  - `email`, only when the method is email, so replies go to them
  - `subject`
- **Subject:** `KWL Studio · [inquiry] from [name]`. Netlify documents only a static subject, plus variables, from a hidden `subject` field. Send it dynamically, then **test one real submission**. If Netlify ignores the dynamic value, put a static `subject` of `KWL Studio · new message (%{submissionId})` in the hidden form and keep the inquiry and name in the body.
- **I set up myself:** in Netlify, Forms → enable form detection, then email notifications to contact@kwlstudio.shop. List these steps for me at the end.
- **On success,** replace the paragraph with the same big type: `Got it, [name]. We'll get back to you at [contact].` with a `SEND ANOTHER` text link under it.
- **On failure:** `THAT DIDN'T SEND. TRY AGAIN OR EMAIL CONTACT@KWLSTUDIO.SHOP.`

No em dashes anywhere in the copy.

---

## 8. Keep as is

- The waitlist form, Klaviyo env vars and simulated mode
- The privacy line
- The footer, apart from adding `CONTACT`
- The fonts and tokens
- The reduced-motion and keyboard support
- The no-scroll first screen on desktop for the main page

---

## 9. Quality bar

- **Widths:** check 360, 390, 768, 1280 and 1440. No horizontal scroll, and tap targets of 44 px or more.
- **Lighthouse mobile:** Performance 85+ (the 3D canvas is lazy and the still is the LCP), Accessibility 95+, Best Practices 95+.
- No console errors and no hydration warnings.
- `prefers-reduced-motion` respected everywhere.
- Keyboard: flip, colorways, views, flash, the size guide and every contact blank are reachable and usable.
- **Visual checks, each with screenshot proof:**
  1. Buckle centroid on the strap centreline
  2. Side B stars point up after the flip
  3. Exactly 6 holes
  4. No stitching
  5. The flash sparkle on 01 and 03; no shine on 02

---

## 10. Phases (stop after each one and show screenshots)

1. **Cleanup:** remove the logo, new colorway config, `CLOSED / FLAT` toggle labels, size guide panel with finder and chart.
2. **3D product:** geometry, materials, lighting, CLOSED and FLAT views, flip, fallback stills.
3. **FLASH:** the sparkle effect.
4. **Contact page:** Netlify Forms, a test submission, mobile check.
5. **QA:** the section 9 pass, then a short list of anything you couldn't match and why.
