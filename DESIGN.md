---
name: Monatekeda
description: Escaparate de estudio. A studio still life of real Peruvian crafts behind the store's own name, on cool grey, in the logo's red.
colors:
  brand-50: "#fdf0ec"
  brand-100: "#fadbd2"
  brand-300: "#f0917c"
  brand-500: "#e5341d"
  brand-600: "#d02c16"
  brand-700: "#b02410"
  brand-800: "#8c1c0c"
  brand-muted: "#a8695f"
  ground: "#e9eaec"
  hero: "#dfe1e6"
  footer: "#d8dadf"
  surface: "#ffffff"
  sunk: "#dfe0e3"
  line: "#d4d5da"
  line-strong: "#b6b8bf"
  ink: "#17162b"
  ink-2: "#45435a"
  ink-3: "#5f5d70"
typography:
  wordmark:
    fontFamily: "Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "min(17vw, 17rem)"
    fontWeight: 600
    lineHeight: 0.78
    letterSpacing: "-0.065em"
  display-light:
    fontFamily: "Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 5.4vw, 5.5rem)"
    fontWeight: 300
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  display-bold:
    fontFamily: "Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 5.4vw, 5.5rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 300
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  lede:
    fontFamily: "Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 300
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 2.6vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.035em"
  stat:
    fontFamily: "Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "'tnum'"
  card-name:
    fontFamily: "Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 550
    letterSpacing: "-0.005em"
  price:
    fontFamily: "Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    fontFeature: "'tnum', 'lnum'"
  caption:
    fontFamily: "Geist Variable, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
rounded:
  sm: "0.5rem"
  md: "0.875rem"
  lg: "1.25rem"
  xl: "1.5rem"
  panel: "2rem"
  full: "9999px"
spacing:
  gutter-mobile: "1rem"
  gutter: "2rem"
  section: "6rem"
  section-lg: "8rem"
  grid-gap-mobile: "0.75rem"
  grid-gap: "1.25rem"
  container: "1360px"
  header: "4.5rem"
  header-condensed: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.brand-600}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 1.25rem"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.brand-700}"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    height: "3rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 1.25rem"
    height: "2.75rem"
  button-ghost-hover:
    backgroundColor: "{colors.surface}"
  button-light:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand-700}"
    rounded: "{rounded.full}"
    height: "3.25rem"
  button-outline-light:
    backgroundColor: "transparent"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    height: "3.25rem"
  header-cart-block:
    backgroundColor: "{colors.brand-600}"
    textColor: "{colors.surface}"
    width: "10.5rem"
    height: "{spacing.header}"
  header-search-block:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    width: "13rem"
    height: "{spacing.header}"
  product-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "0.5rem"
  product-card-photo:
    backgroundColor: "{colors.sunk}"
    rounded: "{rounded.md}"
  card-action-round:
    backgroundColor: "{colors.brand-600}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    size: "2.5rem"
  stat-card:
    backgroundColor: "{colors.brand-700}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    width: "9.5rem"
  pick-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.75rem 0.5rem 0.5rem"
  category-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "1.25rem"
  material-tile:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  filter-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.full}"
    height: "2.75rem"
  filter-pill-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  closing-panel:
    backgroundColor: "{colors.brand-700}"
    textColor: "{colors.surface}"
    rounded: "{rounded.panel}"
  footer:
    backgroundColor: "{colors.footer}"
    textColor: "{colors.ink}"
    rounded: "2.5rem 2.5rem 0 0"
---

# Design System: Monatekeda

## Overview

**Creative North Star: "Escaparate de estudio"**

The storefront opens like a studio shop window. A still life of real Peruvian crafts (an alpaca plush, a woven blanket, a painted jar, a silver vicuña, jewellery and a woven bag) stands on white plinths, photographed against the same cool grey as the page, so it reads as the page itself rather than a banner on top of it. Behind the products, the store's name "monatekeda" runs edge to edge in translucent white, vertically stretched; in front of them, a two-tone headline, a staircase of recommended pieces, red stat cards and a short material index float over the photograph. The logo's red carries the colour; everything else is neutral, and the product photography supplies the texture.

Density is moderate from the first viewport (the hero already sells with real pieces and figures) and settles into a calmer rhythm below: categories, a 3D "Top productos" carousel, material tiles, a silver-restoration service, a filterable grid of available pieces, a red closing panel and a dark footer. Type is one sans family, Geist, in opposed weights (light against bold) with no italics anywhere. Motion is a reveal: lines rise out of masks, the hero stage arrives as one block, numbers count up, tiles wipe open and grids cascade. Every reveal starts from a visible default and stops under reduced motion.

The direction was pinned by the owner from a reference product landing (giant background wordmark, two-tone headline, objects overlapping the stage) and has since been iterated many times by the owner, element by element. Treat their decisions below as pinned.

**Key Characteristics:**
- Cool grey page (#e9eaec) with a slightly deeper hero grey (#dfe1e6) that the header shares while at the top of the home page.
- The "monatekeda" wordmark sits between the studio photo and a cut-out of its products, so it always reads as behind the pieces.
- One brand red from the logo, in three jobs: action fill, red text and fields, and a muted red-grey for light display lines.
- Geist light against Geist bold in the same heading; no italics; no eyebrow labels.
- White cards with soft, offset shadows and no borders; full pills for buttons and filters.
- Square, full-height colour blocks at the header's right edge (white search, red cart).
- Generated editorial photos carry an "Imagen ilustrativa" pill wherever they appear.
- Peruvian identity as fine detail: Andean stepped motifs drawn from the logo's stepped heart, photographs of the pieces' places of origin, and short Quechua words with their Spanish translation.

## Colors

A cool neutral ground and ink, with a single red family taken from the logo and used decisively.

### Primary
- **Logo Red** (brand-600): the action fill. Primary pill buttons, the header cart block, the round add-to-cart button on cards, the active nav underline, carousel progress and active dot, filter focus line, the focus ring and the caret.
- **Deep Logo Red** (brand-700): red as text and as a field. The bold half of every two-tone heading, the nav links, prices, the stat cards, the rank badges, material count pills, the "Después" tag and the closing panel.
- **Muted Clay Red** (brand-muted): the light half of a two-tone heading and the hero tagline's plain words. About 3.6:1 on the ground: large text only.
- **Red tints** (brand-50, brand-100): icon tiles behind category icons, quick hover fills, and the text selection colour.

### Neutral
- **Cool Mist Ground** (ground): the page background.
- **Hero Grey** (hero): the home hero background and, while scrolled to the top of the home page, the header. It matches the studio backdrop of the hero photograph, so the photo has no visible edge, and it is also the left rule of the header search block.
- **White** (surface): cards, the header search block, the condensed header after scroll, the search panel, the wordmark letters, filter pills at rest.
- **Recessed Grey** (sunk): photo placeholders, skeletons, disabled controls, hover fills on white blocks.
- **Hairline / Strong Hairline** (line, line-strong): dividers in the material index and the mobile menu, the ghost button outline, inactive carousel dots, the scrollbar thumb.
- **Footer Grey** (footer): the footer band, one step deeper than the page. Chosen so Quiet Ink (4.6:1) and Muted Clay Red at display size (3.1:1) still pass on it.
- **Night Ink** (ink): primary text, the dark secondary button, the active filter pill.
- **Slate Ink** (ink-2) and **Quiet Ink** (ink-3): secondary text, metadata, placeholders and icons at rest.

### Named Rules
**The One Red Rule.** The logo's red is the only interface hue. It appears at full strength (fill, bold word, card, panel) and never as a tinted wash behind content. Photographs supply every other colour. The single exception is WhatsApp green on the floating contact button and the footer's WhatsApp action, because the brand colour of that channel is how visitors recognise it.

**The Large-Red-Grey Rule.** Muted Clay Red never sets body copy, labels or anything under the lede size.

**The Hero-Grey Seam Rule.** Anything that touches the hero photo's backdrop (the hero section, the header at the top of the home page, the search block's left rule) uses Hero Grey (#dfe1e6) exactly, so no seam shows.

## Typography

**Display and body font:** Geist Variable (ui-sans-serif, system-ui fallback), self-hosted through Fontsource.

**Character:** one modern grotesque made expressive by its extremes: light 300 against bold 700 inside one heading, with tight tracking at size. No second family and no italic, by owner request.

### Hierarchy
- **Wordmark** (600; min(17vw, 17rem) on desktop, 30vw on phones, 24vw on tablets; vertically stretched to 1.6×; line-height 0.78; -0.065em): the store name, decorative and aria-hidden, white at 45% opacity, behind the hero products. It also appears in white at 7% inside the closing panel and in 70% white across the bottom of the grey footer.
- **Display** (300 and 700, clamp(3.25rem, 7.4vw, 6rem) on phones, clamp(3.25rem, 5.4vw, 5.5rem) on desktop, 0.95): the hero headline "Hecho a mano / en el Perú.", light Muted Clay Red over bold Deep Logo Red.
- **Headline** (300 with a 700 keyword, clamp(2.25rem, 5vw, 3.75rem), 1.02, -0.04em): every section title, two-tone ("Explora por **categoría**", "Top **productos**", "Elige por **material**", "Restauramos tu **platería**", "Piezas **disponibles**").
- **Lede** (300, 1.375rem): the hero tagline, with "Plata", "alpaca" and "telar" in semibold Deep Logo Red.
- **Title** (600, clamp(1.75rem, 2.6vw, 2.25rem), up to 3.5rem on the large material tile): names set on photographs.
- **Stat** (700, 1.875rem, tabular): the hero figures, counting up from zero on first view.
- **Card name** (600, 0.9375–1rem, two-line clamp): product names in cards.
- **Price** (600, tabular lining figures) in Deep Logo Red.
- **Label** (550, 0.9375rem): buttons, nav links, filters.
- **Caption** (0.6875–0.75rem): "Imagen ilustrativa", categories above product names, fine print.

### Named Rules
**The Two-Weight Heading Rule.** Section headings pair light Muted Clay Red with one bold Deep Logo Red word that carries the meaning.

**The Upright Type Rule.** No italic or oblique type anywhere. Emphasis comes from weight and from the brand red.

**The No-Kicker Rule.** No uppercase, letter-spaced labels above headings. A small heading above a list (for example "Por material", "Te recomendamos") is a real heading in sentence case.

## Layout

Content sits in a centred 1360px container with 1rem side gutters on phones and 2rem from sm. Section tops are 5–6rem (7–8rem from lg). Breakpoints: sm 640, md 768, lg 1024, xl 1280.

**Header.** 4.5rem tall (4rem on phones and after scrolling). A three-column grid from lg: logo left, nav exactly centred, and two square blocks flush to the viewport's right edge at full header height: a white search block (a real field with "Buscar…" from xl; a magnifier square that opens a search panel below xl) and a red cart block ("Carrito" from xl; icon-only below). The nav sits in Deep Logo Red with 1.25–2rem gaps; Catálogo opens a categories mega-panel. Below lg, a menu button opens a sheet with links, categories and social icons.

**Hero (home): "Escaparate rojo".** A full-width Deep Logo Red stage carrying the Andean texture in white (9%), with a soft white spotlight behind the pieces like a lit shop window. The hero image is a still life generated on a transparent background for this stage (`hero-vitrina.webp`: woven blanket, alpaca plush, silver vicuña, painted jar, silver necklace and cuff, woven leather bag) with no plinths, standing between the two columns on a soft dark contact shadow; its width follows the available height so it never touches the text or the material index. Upper left: the headline in white (light 80% + bold), a white StepBand, the tagline with the materials in bold white, a white "Explorar piezas" pill and an outline-light "Ver categorías". Lower left: "Te recomendamos" as a staircase of solid white pick cards. Upper right: the three stat cards in white with red figures (staircase). Right: "Por material" index in white. Bottom right: social icons (light). The hero ends in a StepHem painted in the page grey. While the page is at the top, the header is red too (same texture, white logo text and nav); it turns white once scrolled. On phones: headline, tagline, buttons, the cut-out pieces in their spotlight, picks, stats, socials.

**Sections below the hero, in order:** Categorías (white directory panel: title and red "Todo el catálogo" card left, two columns of category rows right) · Top productos (#1 feature + numbered ranking) · Elige por material (typographic index 5 columns + photo stage 7 columns) · Ruraq maki (origins) · Restauramos tu platería (dark panel: text and steps 5 columns, photo 7) · Piezas disponibles (sticky left column with title and vertical material filters on desktop, card grid of 2/3/4 columns on the right) · Closing panel · Footer.

## Elevation & Depth

Depth comes from layering (wordmark between photo and cut-out, cards over the photo, a translucent header that turns white with a shadow once scrolled) and from soft, offset shadows on white cards. Shadows always carry a downward offset and a negative spread; there are no zero-offset halos.

### Shadow Vocabulary
- **Card rest** `0 16px 34px -26px rgb(23 22 43 / 0.45)`: product, pick and category cards.
- **Card hover** `0 26px 44px -24px rgb(23 22 43 / 0.5)` with a 4px lift.
- **Red card** `0 18px 36px -18px rgb(140 28 12 / 0.6)`: stat cards and the red catalogue card.
- **Header scrolled** `0 12px 30px -22px rgb(23 22 43 / 0.45)` on 90% white with backdrop blur.
- **Panel drop** `0 30px 60px -28px rgb(23 22 43 / 0.45)`: the catalogue mega-panel and the search panel.
- **Product cut-out** `drop-shadow(0 30px 40px rgb(60 8 2 / 0.45))`: the collection photo rising out of the closing panel.
- **Button hover glows**: red `0 8px 20px -10px rgb(176 36 16 / 0.6)`; dark `0 8px 20px -10px rgb(23 22 43 / 0.6)`.

### Glass
Hero cards are lightly translucent: pick cards white at 70% with backdrop blur and a 1px white ring (90% on hover); stat cards Deep Logo Red at 90% with blur. This is the only glass in the system, and it exists so the studio photo reads through the cards.

## Shapes

Full pills for every button, filter, chip, caption and round action. Cards are 1.25rem (20px), with photos inside at 0.875rem (14px) so the inner radius sits concentric to the outer one. Material tiles and the carousel cards are 1.5rem; the closing panel is 2rem. The header's search and cart blocks are the one deliberate exception: square, flush right, full header height.

## Components

### Buttons
- **Primary pill:** Logo Red, white label 550, 3rem tall in the hero (2.75rem default, 3.25rem large), optional trailing arrow. Hover deepens to Deep Logo Red with the red glow; press moves 1px.
- **Dark pill:** Night Ink with white label; the hero's secondary action ("Ver categorías"), with a grid icon.
- **Ghost pill:** transparent with an ink label and a 1px Strong Hairline inset; "Ver todo el catálogo" links and secondary actions.
- **Light / Outline-light:** white with a red label, or a white 40% ring, only on the red closing panel.
- **Round card action (40px):** red cart for simple products (turns green with a check for 2s after adding), dark arrow for products with options, grey and inactive when sold out.

### Product Card
White 1.25rem card with 0.5rem padding and the card rest shadow; a square photo inside, then category (caption, Quiet Ink), name (card-name, two-line clamp), and a bottom row with the red price and the round action. Hover lifts 4px and zooms the photo to 1.05. Sold-out pieces show a dark "Agotado" pill on a desaturated photo. At narrow widths the action wraps under the price instead of covering it.

### Hero Pick Card
Translucent white card, 64px thumbnail, category, name, price, and a small red arrow circle. Three of them step down and to the right as a staircase.

### Stat Card
Deep Logo Red at 90%, 9.5rem wide on desktop, a white icon disc, the figure (counting up) and a two-line label. On desktop the three step down as a staircase; on phones they sit in a three-column grid with a smaller figure below 400px.

### Top Products Ranking
Replaced by an editorial ranking (no carousel). Left: the #1 piece as a tall photo card with a giant white "01" and a short white StepBand at the top left, and category, name, price and a large buy pill at the foot over a dark scrim. Right: an ordered list of #2–#7, each row a big light Muted Clay Red numeral (bold red on hover), a 72px thumbnail, category, name, red price and a round arrow; rows lift into a white card on hover and are divided by faint StepBands. Everything is visible at once.

### Material Selector ("Elige por material")
A typographic index beside a stage. Left: the small two-tone heading, a hint, and the materials (Alpaca, Platería, Textiles) as huge rows: inactive rows light Muted Clay Red over a hairline; the active row bold Deep Logo Red over a red StepBand, with a red count pill (live API total). Hover, focus or tap selects (ARIA tabs). Right: a tall rounded stage where the three material photos are stacked and the active one cross-fades in with a slight zoom-out (900ms); over a dark bottom scrim sit the material name, a white "Ver las N" pill (red on hover) and a strip of up to four real in-stock pieces of that material as small white cards with photo and red price. On phones the index stacks above the stage.

### Restoration Section
The only dark panel on the page: a rounded Night Ink panel with a 4% white stepped-diamond texture. Left: two-tone heading in white (light white at 70% + bold white "platería"), one sentence, a red StepBand, three numbered steps (Envíanos una foto · Te orientamos · Recupera su brillo), the six object pills in translucent white, and "Consultar restauración" (red pill; WhatsApp with a prefilled message) plus "Ver platería" (outline-light). Right: the half-tarnished, half-polished tray photo on its light studio ground with "Antes" and "Después" tags.

### Filter Pills
White pills with category icons; the active pill is Night Ink with white text. They scroll horizontally on phones. Changing the filter re-runs a short fade-up on the cards.

### Header blocks and panels
- **Search block (white):** from xl a real input ("Buscar…"); the magnifier turns red and a red line draws along the bottom on focus. Below xl a magnifier square opens a white panel under the header with a large field, a "Buscar" button and category shortcuts; Escape, the ×, the dimmed page or navigation close it.
- **Cart block (red):** icon plus "Carrito" from xl, icon-only below; the count is a white circle that bumps when a piece is added.
- **Catalogue mega-panel:** white panel with all categories as icon rows and a red "Todo el catálogo" card; opens on hover or via the chevron button, closes with Escape.

### Andean Motifs (`src/components/Andean.tsx`)
Drawn on a 4px step grid, from the logo's stepped heart; always decorative (aria-hidden) and always small or faint.
- **StepBand:** a stepped fret (escalonado) line with a small square "eye", repeated. Used as a short rule under the "Ruraq maki" title, a short white rule above the place names on the origin photos, and a full-width rule in the footer at 20% ink.
- **StepHem:** stepped pyramids at the hero's bottom edge, painted in the page ground, so the hero grey ends like the finished edge of a weaving.
- **Page texture (`.andean-ground`):** the whole page background is a lattice of stepped diamonds with small square "eyes", like a woven ground, in ink at 5.5% on the Cool Mist Ground (a 120px SVG tile in `index.css`). The tile lives in the `--andean-tile` variable. The hero carries it too: on its own background and, through a `HeroTexture` layer, over the studio backdrop of the hero photo, masked out with the product cut-out so the pieces stay clean; that layer aligns its tile to the section so there is no seam. Cards and panels sit on top with their own fills, so the texture only shows in the gaps.
- **StepDiamondField:** a stepped-diamond texture, white at 7% inside the red closing panel and ink at 2.5% on the footer.

### Origins Section ("Ruraq maki")
The Quechua title "Ruraq maki" in bold Deep Logo Red, with its translation «Manos que hacen», en quechua as the light heading, a short StepBand and one sentence about family workshops. Two tall photo cards (Puno: Lake Titicaca reeds and a totora boat; Lima: carved colonial balconies), offset in a staircase, each linking to its origin tag in the catalogue. The cards carry a dark scrim, a white StepBand, the place name, one factual line of geography, and a white pill "Ver piezas de …".

### Closing Panel and Footer
- **Closing panel:** a rounded Deep Logo Red panel with a faint wordmark, the statement "Piezas de Lima y **Puno**, en un solo lugar.", a light and an outline-light button, and the collection photo rising above the panel's top edge on desktop.
- **Footer:** Footer Grey band with 2.5rem rounded top corners and ink text. Top row: logo with the two-tone line "Hecho a mano **en el Perú.**" beside a white "Pedidos y consultas" card whose WhatsApp row shows the number (the number from config.js). Then hairline-separated link columns (Tienda, Categorías from the API, Síguenos with social icons), a copyright row with "Volver arriba", and the wordmark in 70% white across the bottom, read as a relief on the grey.

### Floating WhatsApp button
Green circle fixed bottom right, expanding to "Escríbenos" on hover. Hidden when no WhatsApp number is configured.

### Motion
One curve, expo ease-out (cubic-bezier(0.16, 1, 0.3, 1)). Headline lines rise from masks (1000ms, 130ms stagger). The hero stage (photo, wordmark and cut-out together) fades and rises as one block (1400ms) so the wordmark never shows through half-transparent products. Wordmark letters rise one by one. Scroll reveals start visible and hide only once armed; grids cascade in 50–70ms steps; material photos wipe open with clip-path; the closing photo rises in. The wordmark drifts left with scroll and the hero photo follows the pointer slightly. Reduced motion removes all of it and shows the final state.

## Do's and Don'ts

### Do:
- **Do** keep the page cool grey and use Hero Grey wherever something meets the hero photograph.
- **Do** keep the wordmark between the studio photo and its product cut-out; if the hero photo changes, regenerate the cut-out from it.
- **Do** write section headings in two weights, light Muted Clay Red plus one bold Deep Logo Red word.
- **Do** use white cards with offset soft shadows and concentric radii (20px card, 14px photo).
- **Do** label every generated photo "Imagen ilustrativa".
- **Do** show real numbers from the API (piece counts, stock) and leave owner-supplied figures as given (+10 años, +3000 productos, 24 talleres).
- **Do** start every reveal from a visible default and provide a reduced-motion fallback.

### Don't:
- **Don't** set body or small text in Muted Clay Red.
- **Don't** add a second accent hue or red gradients; WhatsApp green is the only exception, on WhatsApp actions.
- **Don't** use italics, a second typeface, or eyebrow/kicker labels.
- **Don't** use zero-offset glows or hard offset shadows; don't put borders on cards.
- **Don't** add glass beyond the hero cards.
- **Don't** invent artisans, testimonials, certifications or service details the owner has not given.
- **Don't** use Andean motifs as large fills or bright multicolour patterns; they stay as hems, rules and faint textures.
- **Don't** use Quechua or Aymara words without their Spanish translation next to them, and mark them with `lang="qu"`. Words in use: *Ruraq maki* («manos que hacen»), *Sulpayki* («gracias»).
