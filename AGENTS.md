# Project rules
- The trip planner flow lives in src/routes/index.tsx with local step state; why: it's a single linear wizard mirroring the Figma frames, no server data yet.
- Figma palette colors are Tailwind tokens prefixed `ws-` in src/styles.css; why: keep design values in one place.
