---
name: Velorah
description: A quiet cinematic interface shaped by moving imagery and editorial type.
colors:
  observatory-navy: "#002b42"
  luminous-white: "#ffffff"
  quiet-silver: "#a5a5ac"
  smoked-surface: "#1a1a1a"
  glass-edge: "#2e2e2e"
typography:
  display:
    fontFamily: "Instrument Serif, serif"
    fontSize: "clamp(3rem, 6.67vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-2.46px"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(1rem, 1.25vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    letterSpacing: "0"
rounded:
  control: "9999px"
  default: "10px"
spacing:
  compact: "24px"
  section: "90px"
  container: "32px"
components:
  button-glass:
    backgroundColor: "rgba(255, 255, 255, 0.01)"
    textColor: "{colors.luminous-white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 24px"
  button-glass-hero:
    backgroundColor: "rgba(255, 255, 255, 0.01)"
    textColor: "{colors.luminous-white}"
    rounded: "{rounded.control}"
    padding: "20px 56px"
---

# Design System: Velorah

## Overview

**Creative North Star: "The Quiet Observatory"**

Velorah places a calm editorial voice inside an immersive moving scene. The interface stays sparse so the video remains the material and the typography remains the thought. Controls are translucent and precise, present enough to guide without competing with the image.

The system is cinematic but restrained: no decorative filler, no artificial atmosphere layered over the footage, and no excess framing. Movement comes from the scene and one measured entrance sequence.

**Key Characteristics:**

- Full-bleed moving imagery as the primary visual material.
- High-contrast serif display type paired with quiet sans-serif utility text.
- Transparent pill controls with a fine luminous edge.
- Centered, spacious compositions with a single dominant statement.

## Colors

The palette uses a deep cool field, white light, and a narrow band of neutral silver.

### Primary

- **Observatory Navy:** The stable page ground and browser chrome color.
- **Luminous White:** Primary display text, active navigation, and control labels.

### Neutral

- **Quiet Silver:** Secondary phrases, body copy, and inactive navigation.
- **Smoked Surface:** Semantic muted and secondary surfaces when a solid fallback is needed.
- **Glass Edge:** Input and boundary color for restrained structural separation.

### Named Rules

**The Footage Carries Color Rule.** Interface color remains neutral so the moving image owns the scene's changing chroma.

## Typography

**Display Font:** Instrument Serif (with serif fallback)  
**Body Font:** Inter (with sans-serif fallback)

**Character:** The serif is open, literary, and cinematic. Inter keeps navigation and supporting copy neutral, legible, and visually quiet.

### Hierarchy

- **Display** (400, 3rem to 6rem, 0.95): Hero statements and major brand moments only.
- **Body** (400, 1rem to 1.125rem, 1.625): Supporting copy with a maximum measure near 42rem.
- **Label** (500, 0.875rem, 0 tracking): Navigation and compact commands.

### Named Rules

**The One Statement Rule.** A cinematic viewport gets one display-scale thought; supporting text remains clearly subordinate.

## Layout

Surfaces use a centered 80rem container with 1.5rem mobile gutters and 2rem gutters from the small breakpoint upward. The first viewport is at least the safe viewport height. Navigation occupies an 88px top band; hero content centers in the remaining space with 90px vertical breathing room. Desktop navigation links disappear below 768px while the wordmark and primary action remain visible.

## Elevation & Depth

The system is flat by default. Depth comes from real video perspective and localized backdrop blur inside controls, not from floating panels or ambient card shadows.

### Shadow Vocabulary

- **Glass inner glint** (`inset 0 1px 1px rgba(255, 255, 255, 0.1)`): Gives transparent controls a restrained optical edge.

### Named Rules

**The Real Depth Rule.** Use imagery and motion for atmosphere; reserve blur and inset light for interactive glass only.

## Shapes

Commands use fully rounded pill silhouettes. The general component radius is gently curved at 10px, but the hero surface itself is unframed and full bleed.

## Components

### Buttons

- **Shape:** Fully rounded pill.
- **Glass:** Near-transparent white fill, 4px backdrop blur, a 1.4px masked edge, and a subtle inset highlight.
- **Hover / Focus:** Scale to 1.03 on hover; use a 2px white focus outline with 3px offset.
- **Hero:** Use expanded 20px by 56px padding for the primary viewport action.

### Navigation

The brand mark uses Instrument Serif at 1.875rem. Links use 0.875rem Inter; the current page is white and inactive links are silver with a white hover transition. Mobile keeps only the wordmark and glass action.

### Cinematic Heading

Wrap selected phrases in Quiet Silver to create tonal rhythm without gradients or weight changes. Keep the line height at 0.95 and preserve balanced wrapping.

## Do's and Don'ts

### Do:

- **Do** let one real visual asset carry the viewport's depth and color.
- **Do** keep display typography large, light in weight, and tightly led.
- **Do** respect reduced-motion preferences while leaving content visible.

### Don't:

- **Don't** add decorative blobs, radial gradients, tint overlays, or floating cards.
- **Don't** place glass effects on passive decoration; glass indicates action.
- **Don't** introduce extra accent hues that compete with the footage.

