# AI Demo Project

A simple demo using the Vercel AI SDK with OpenAI.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```

   Get your API key from: https://platform.openai.com/api-keys

## Usage

Run the demo:
```bash
pnpm start
```

Or directly with tsx:
```bash
tsx index.ts
```

## What it does

The script uses OpenAI's GPT-4 Turbo model to invent a new holiday and describe its traditions, streaming the response in real-time.


