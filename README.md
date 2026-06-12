# Solana Technical Updates Dashboard

This project is a dashboard of technical updates across the Solana ecosystem. It gives contributors and readers a broad view of engineering work at each level of development, including protocol changes, validator client changes, Solana SDKs, Solana program frameworks and libraries, and Solana program testing frameworks.

The dashboard is meant to be a companion to the weekly Solana Changelog. When readers or listeners want to go deeper on a changelog item, this project should help them discover the relevant technical context, source material, and related updates.

## Development

Install dependencies:

```bash
bun install
```

Start the local development server:

```bash
bun --bun run dev
```

Build for production:

```bash
bun --bun run build
```

Run tests:

```bash
bun --bun run test
```

## Security

GitHub OAuth is used for sign-in identity and authenticated public API rate limits only. The app requests `read:user` and `user:email`; it does not request repository access through the broad classic `repo` scope. Existing sessions with broader stored GitHub scopes are required to re-authenticate so future tokens use the reduced grant.

## Contributing

Contributors can help by improving the dashboard experience, adding or refining update sources, organizing technical categories, and making it easier to explore ongoing Solana engineering work.
