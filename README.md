# Itay100k / About me

A personal developer profile with a static frontend and an official Discord bot presence service. Plain HTML, CSS, and JavaScript; Node.js 24 LTS; Discord.js v14. No framework, database, commands, self-bot, or third-party profile widget.

- **Website:** https://itay123458.github.io/about-me-/
- **Pi profile/API:** https://ik.tailce7102.ts.net/about-me/
- **GitHub:** https://github.com/itay123458

## How it works

GitHub Pages serves only `public/`. A daily Actions workflow refreshes public GitHub repository stats, language totals, and the contribution calendar before publishing. Language percentages represent bytes across original public repositories, not skill levels. The calendar covers the past year. Missing data stays unavailable rather than becoming invented statistics.

The Pi runs a persistent Discord Gateway connection. The frontend polls `/api/discord` every 30 seconds while the tab is visible. The endpoint returns only the configured user's display name, username, avatar, status, custom status, and one current activity. It never accepts arbitrary user or server IDs. It never publishes tokens, messages, member lists, activity secrets, or internal Discord objects.

If the bot disconnects, the page shows **Status unavailable** instead of a stale online status. A verified shared-server member without a presence is **Offline**. Invisible users appear offline; custom status/activity visibility depends on what Discord exposes and the user's privacy settings.

## Local setup

Install Node.js **24 LTS** and run:

```sh
npm install
cp .env.example .env
npm start
```

On Windows, copy with `Copy-Item .env.example .env`. Open http://localhost:3000. For automatic restarts, run `npm run dev`. Without a token, the site still runs, with live presence unavailable. Run `npm test` for the public API and privacy checks.

## Configure Discord

1. Open the [Discord Developer Portal](https://discord.com/developers/applications). Create an application, then open its **Bot** settings.
2. Create/copy the **bot token** into `.env` as `DISCORD_BOT_TOKEN`. Use the official bot application, never a normal user token.
3. Under **Privileged Gateway Intents**, enable **Presence Intent**. This service requests `Guilds` and `GuildPresences`. **Server Members Intent and Message Content Intent are not needed.** It requests only the configured member, not the whole member list. Verified applications may need Discord approval for presence access.
4. Under **OAuth2 → URL Generator**, choose the `bot` scope and no bot permissions. Invite it to a server you share with the bot; administrator access and application-command scopes are unnecessary.
5. In your Discord client, enable **User Settings → Advanced → Developer Mode**. Right-click yourself and choose **Copy User ID**; right-click the shared server and choose **Copy Server ID**.
6. Set these private runtime values:

```env
DISCORD_BOT_TOKEN=
DISCORD_USER_ID=
DISCORD_GUILD_ID=
ALLOWED_ORIGIN=https://itay123458.github.io
PORT=3000
```

The IDs must point to the profile owner and a server shared with the bot. The user's presence and activity shown on this public site are intentionally public. CORS restricts browser reads to the configured origin; it is not authentication and does not make a public profile private.

Official references: [Gateway intents](https://docs.discord.com/developers/events/gateway#privileged-intents), [targeted member requests](https://docs.discord.com/developers/events/gateway-events#request-guild-members), [presence updates](https://docs.discord.com/developers/events/gateway-events#presence-update).

## Edit the profile

Edit the copy and links in `public/index.html`. `public/config.js` contains project names, descriptions, tech stacks, optional status labels, source links, Discord user ID, and the public presence API URL. Set `status` or `url` to `null` when unknown. Dexzu links to the public **dashboard** repository. EditIL's details are explicitly pending rather than invented.

The Discord card uses live Discord avatar/name data when available. Its initial fallback image is the actual GitHub avatar, labeled accordingly. `public/styles.css` contains theme tokens, layout, and responsive rules. Typography is self-hosted IBM Plex Sans with its license in `public/assets/`.

To use a different GitHub account, change `username` in `scripts/update-github.js` and the GitHub links in the page/config. To refresh locally, run `npm run update:github`. Set `GITHUB_TOKEN` in the process environment only if you want authenticated contribution-calendar access. Never put it in `public/config.js`.

## Deploy

### GitHub Pages

In the repository's **Settings → Pages**, select **GitHub Actions** as the source. Push to `main` or run the **Publish profile** workflow manually. The workflow deploys `public/` only; server code, `.env`, and bot tokens never enter the Pages artifact. It also refreshes GitHub data daily. Discord presence requires the separate always-on service below; GitHub Pages cannot maintain a Gateway connection.

### Raspberry Pi / Docker

Copy the repository to the Pi, configure its `.env`, then run:

```sh
docker compose up -d --build
docker compose logs -f profile
```

The ARM64-compatible image runs as a non-root user with a read-only filesystem. Docker binds the service to **127.0.0.1:3010** on the Pi. Publish it through an HTTPS reverse proxy, not a bare public HTTP port. Configure the public endpoint in `public/config.js` and set `ALLOWED_ORIGIN` to the website's origin (without a path).

This deployment uses the Pi's existing Tailscale Funnel with an additional `/about-me` route to `http://127.0.0.1:3010`. The existing root route stays in place. The service accepts both root and `/about-me/` paths, and `/api/health` reports HTTP service health independently of Discord availability.

After changing `.env`, run `docker compose up -d` to recreate the container. Keep `.env` mode `600` on Linux. Do not run an additional copy of the presence service unnecessarily.

## Structure

```text
public/                 Static site; the only directory published by Pages
  assets/               Avatar, favicon, self-hosted font and font license
  data/github.json      Real public GitHub snapshot
  js/                   Small rendering modules
  config.js             Public profile/project configuration; no secrets
  index.html
  styles.css
server/                 HTTP server and persistent Discord connection
scripts/update-github.js
test/                   Privacy and HTTP boundary checks
.github/workflows/      Pages publishing and daily stats refresh
.env.example            Runtime configuration template
```

Never commit `.env`, Discord tokens, or API secrets. The Docker build also excludes environment files.
