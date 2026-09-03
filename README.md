# Dance Studio Web

Mobile-first React/Vite client for GitHub Pages. Set `VITE_API_BASE_URL` to the HTTPS ECS/ALB API URL when deploying. `vite.config.ts` uses a relative base path so built assets work on a GitHub Pages project site.

```bash
npm install
cp .env.example .env.local
npm run dev
```
