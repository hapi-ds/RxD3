# XR Frontend

WebXR-compatible immersive interface for VR/AR devices built with React Three Fiber.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

The XR frontend will be available at http://localhost:3001

## Technology Stack

- React 18+ with TypeScript (strict mode)
- Vite 6+ (build tool and dev server)
- React Three Fiber (Three.js React renderer)
- @react-three/drei (R3F helpers)
- @react-three/xr (WebXR support)
- Three.js (3D graphics library)

## Configuration

### Environment Variables

- `VITE_API_URL`: Backend API URL (default: http://localhost:8080)
- `VITE_WS_URL`: WebSocket URL (default: ws://localhost:8080/ws)

### TypeScript

TypeScript is configured with strict mode enabled in `tsconfig.json`:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedIndexedAccess: true`

### Vite

Vite is configured to run on:
- Host: `0.0.0.0` (accessible from Docker containers)
- Port: `3001`

## Development

Hot module replacement (HMR) is enabled by default. Changes to source files will automatically reload in the browser.

## Building for Production

```bash
npm run build
```

The production build will be output to the `dist/` directory.

## Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Root XR component
├── components/           # 3D components (to be implemented)
├── hooks/                # Custom hooks (to be implemented)
├── services/             # API clients (to be implemented)
└── types/                # TypeScript interfaces (to be implemented)
```

## Next Steps

This is the initial scaffold. The following components need to be implemented:
- Scene component with XR support
- Avatar component for user representation
- Controls component for VR interaction
- Authentication integration
- WebSocket integration for real-time communication
