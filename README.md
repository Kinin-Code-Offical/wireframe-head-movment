# Wireframe Head Movement

A real-time animated wireframe head avatar built with React + TypeScript + Vite + Three.js.

## Features
- Procedural 3D wireframe human head
- Emotion-driven facial expressions (neutral, happy, sad, angry, surprised, thinking, focused, calm)
- Task-context motion bias (greeting, explaining, warning, success, error, thinking, listening, idle)
- Browser speech synthesis with lip-sync animation
- Audio-reactive mouth mode (microphone)
- Micro-animations: blinking, breathing, gaze drift, head sway
- Spring-based smooth transitions
- Debug panel for live expression values

## Getting Started

### Install
```bash
npm install
```

### Dev
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview built output
```bash
npm run preview
```

## Deployment

### GitHub Pages
Push to `main` branch. The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically build and deploy.

## Browser Notes
- Speech synthesis requires a modern browser (Chrome, Edge, Firefox).
- Audio reactive mode requires microphone permission.
- Speech synthesis voices may vary by OS/browser.
- On iOS, speech synthesis requires a user gesture (tap Speak button).

## Architecture

```
src/
  main.tsx              Entry point
  App.tsx               Root layout
  styles.css            Global dark UI styles
  components/
    SceneRoot.tsx        Three.js Canvas + Controllers
    WireframeHead.tsx    Procedural 3D head geometry
    ControlPanel.tsx     UI controls panel
    DebugPanel.tsx       Live debug overlay
  hooks/
    useSpeechController.ts    Browser TTS + lip animation
    useEmotionController.ts   Spring-driven emotion blending
    useTaskContextController.ts  Task → emotion mapping
    useMicroMotion.ts         Blink, breathing, gaze drift
    useAudioReactiveMouth.ts  Microphone amplitude → jaw
  state/
    avatarStore.ts        Zustand global state
  utils/
    spring.ts             SpringValue + damp/lerp
    math.ts               sinWave, noise, smoothstep
    speechMapping.ts      Syllable estimation + lip curves
    emotionProfiles.ts    Per-emotion motion parameters
    taskProfiles.ts       Per-task motion bias
```
