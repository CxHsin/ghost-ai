# Ghost AI Learning

Ghost AI Learning is a real-time collaborative system design workspace built with Next.js.

## Learning Note

This project was built step by step by following the author of this YouTube video:

- [Build an AI System Design SaaS with Next.js](https://www.youtube.com/watch?v=14RP8liACqo&list=WL&index=1&t=12797s)

The implementation in this repository is part of my hands-on learning process, following the author's project flow and rebuilding the product feature by feature.

To clearly distinguish this repository from the original author's project, this learning version is named `Ghost AI Learning`.

## Trigger.dev

Trigger.dev is configured for background workflows in this project.

1. Set `TRIGGER_PROJECT_REF` and `TRIGGER_SECRET_KEY` in `.env`.
2. Start the local Trigger.dev worker with `npm run trigger:dev`.
3. Deploy workflows with `npm run trigger:deploy`.

The Trigger.dev config lives in `trigger.config.ts`, and background tasks live in `trigger/`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
