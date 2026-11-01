# KNOB: a keyboard scroll story (portfolio concept)

A one-product page for the KNOB keyboard: a real-time 3D story that follows the scroll
(hero, exploded layers, layout, the two knobs and the timer display, one key taken apart),
then a details page. Built with React, Vite, three.js, postprocessing and GSAP.

This is an unofficial portfolio concept. It is not affiliated with or endorsed by Work Louder,
and there are no real orders or payments. The product name belongs to its owners. The 3D model,
images and icons here are drawn or rendered for this project.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
```

In development, `window.__still(name, progress, camera, size)` renders a square image of the
scene at one point of the scroll story (see `src/lib/stage.ts`). It is not in the production build.
