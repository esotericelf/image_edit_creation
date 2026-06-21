# Studio Canvas — Image Editor & Creator

Modern React frontend for the Studio Canvas AI image generation suite.

## Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- Lucide React

## Quick start

```bash
npm install
npm run dev
```

The dev server proxies `/api` to `http://localhost:8001` when using relative requests via the Vite proxy. API calls use `VITE_API_URL` (see `src/api/client.ts`).

### Netlify production

1. Connect this repo to Netlify (build: `npm run build`, publish: `dist` — configured in `netlify.toml`).
2. Set environment variable **`VITE_API_URL`** to your public API origin, e.g. `https://api.your-nas.example.com` (no trailing slash).
3. Ensure your QNAP/server API allows CORS from your Netlify domain.

```bash
cd ../image_generation_backend
docker compose up --build
curl http://localhost:8001/api/v1/health
```

## Integration

Import the editor anywhere in your app:

```tsx
import { NanoBananaEditor } from "./components/NanoBananaEditor";

export default function Page() {
  return (
    <NanoBananaEditor
      initialPrompt="A lush garden with neon flowers"
      initialMode="create"
    />
  );
}
```

## Component structure

```
src/components/NanoBananaEditor/
├── NanoBananaEditor.tsx   # Main shell + sub-components
├── api.ts                 # POST /api/v1/generate client
├── types.ts               # Shared types & constants
└── index.ts               # Public exports
```

## API contract

Generates call `POST /api/v1/generate` with:

| Field | Type | Notes |
|-------|------|-------|
| `prompt` | string | Main or contextual edit prompt |
| `resolution` | `0.5K` \| `1K` \| `2K` \| `4K` | Slider-mapped |
| `safety_tolerance` | `"1"`–`"6"` | 1 = strictest |
| `image_urls` | string[]? | Base64 data URIs or hosted URLs |
