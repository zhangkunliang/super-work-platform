# Velorah Hero Design

## Objective

Build a single-page, fullscreen cinematic hero for Velorah using React, Vite, TypeScript, Tailwind CSS, and shadcn/ui.

## Composition

The page is one viewport-height scene. A looping, muted, inline-playing video fills the canvas with `object-cover`. Navigation and hero content sit above it without gradients, blobs, tint layers, or decorative overlays.

The navigation uses a centered `max-w-7xl` row with the Instrument Serif wordmark on the left, desktop links in the middle/right, and a compact liquid-glass CTA. Links hide below the medium breakpoint. The hero is vertically centered, text-aligned center, and constrained for readable line lengths.

## Typography And Theme

Instrument Serif is the display face and Inter 400/500 is the body face. CSS variables use the user-supplied dark HSL palette. The headline scales from `text-5xl` to `md:text-8xl`, uses a tight 0.95 line height, and gives the starred phrases muted contrast without rendering literal asterisks.

## Interaction And Motion

Both CTAs are presentation-only buttons because no destination was supplied. Liquid-glass styling follows the supplied CSS exactly. Headline, copy, and hero CTA rise into view in three timed stages. A reduced-motion media query removes transforms and animation for users who request it.

## Responsive And Accessibility

The video includes a fallback message. Navigation is labelled, buttons use the shadcn Button primitive, and text maintains contrast against the user-selected video frame. Mobile layouts preserve stable spacing, avoid horizontal overflow, and keep the primary message within the first viewport.

## Verification

Run unit checks for rendered copy and video attributes, a production build, and browser screenshots at 1440x900 and 390x844. Confirm video rendering, layout framing, no overlap, and mobile text fit.

