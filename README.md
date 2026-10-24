# expense-tracker

A personal expense tracker with a Claude chat over my own spending data (JPY and MYR, cash and card).

Built with Next.js, the Claude API, Supabase and Vercel. See [ROADMAP.md](ROADMAP.md) for the plan and current status, and [docs/data-model.md](docs/data-model.md) for the data.

## Run locally

```bash
npm install
# .env.local needs ANTHROPIC_API_KEY
# data/expenses.csv (gitignored) holds the AppSheet export until M1 moves the data to Supabase
npm run dev
```

Then open http://localhost:3000.
