# Blog Banner Carousel Design

## Goal

Give the blog's wide banner strip a refined, low-distraction carousel effect that matches the existing notebook-and-engineering visual language.

## Chosen interaction

Use the **fade + subtle push-in** option selected by the user. The outgoing banner gently fades while scaling up slightly; the incoming banner fades in from a slightly enlarged scale. This creates a quiet "turning the next notebook page" feel without translating or cropping the banner artwork.

## Behaviour

- Show one banner at a time and advance every five seconds when two or more banners are available.
- Pause automatic progress while the carousel is hovered or keyboard-focused; resume when it is left.
- Keep the existing dot controls and make the active dot a timed, pill-shaped progress indicator.
- Add previous/next controls that appear on hover or focus, work on touch devices, and have descriptive accessible labels.
- Manual navigation resets the five-second progress interval.
- Support keyboard navigation with left/right arrow keys when the carousel has focus.
- Respect `prefers-reduced-motion`: change slides without transform animation and do not show a moving progress indicator.

## Implementation shape

`BannerCarousel.tsx` remains the client-side owner of active index, timer lifecycle, and interactions. It will render all slides in a clipped stage so CSS can crossfade between them. The component will use only React and CSS; no new package is needed.

`blog.css` will define the stage, image scaling, progressive dot, and unobtrusive controls. The existing responsive banner height, theme variables, rounded corners, and image link behaviour remain intact. The sidebar variant keeps its compact image-only styling and shares the interaction model.

## Accessibility and failure cases

- The carousel receives a labelled region and exposes the current slide to assistive technology.
- Buttons have Chinese `aria-label` values; non-active slides cannot receive focus.
- A zero- or one-banner list renders safely with no controls or timer.
- Image URLs and optional links continue to come from the existing `Banner` data model.

## Verification

- Run TypeScript/production build checks.
- Manually verify automatic advance, hover/focus pause, dot and arrow navigation, keyboard navigation, mobile touch controls, single-banner output, dark theme, and reduced-motion mode.
