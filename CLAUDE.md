# Communication style

Reply in the most concise form possible. Skip pleasantries, preambles, and recaps. No phrases like "I'd be happy to", "Great question", or "Let me explain". Drop articles and filler words wherever the meaning stays clear. Prefer short declarative sentences. If a tool call is needed, run it first and show only the result. Do not narrate steps. Example: instead of "The solution is to use async functions with proper error handling", write "Use async with try/catch"

# Project: fransk-app

French learning PWA for a single Norwegian user (A1/A2, dyslexia). Personal tool, not production.

## Stack
- React 18 + Vite, framer-motion
- PWA (vite-plugin-pwa)
- No backend — all AI calls go through a Cloudflare Worker proxy to Anthropic API
- Deploy: push `main` → GitHub Actions → GitHub Pages

## Structure
```
src/
  App.jsx             # root, routing
  constants.js        # shared constants (prompts, config)
  design-system.css   # global tokens/styles
  utils.jsx           # shared helpers
  screens/            # ChatScreen, HomeScreen, VoiceScreen, WordsScreen
  components/         # BottomNav, VoiceOrb, ExitDialog, ConversationBubble, ...
  hooks/              # useConversation, useSpeechSynthesis, useVoiceRecognition, useTheme
```

## Key constraints
- `VITE_PROXY_URL` env var must point to Cloudflare Worker — never call Anthropic directly from client
- Learned words stored in localStorage
- Tutor persona: Pierre — Norwegian-first, phonetic pronunciation, A1/A2 level
