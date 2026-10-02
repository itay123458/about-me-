import { Client, Events, GatewayIntentBits } from "discord.js";
import { publicProfile } from "./profile.js";

export async function connectDiscord(env) {
  const token = env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.log(
      "No Discord token configured. Serving the site without live presence.",
    );
    return {
      snapshot: () => publicProfile(null, null, false),
      close: () => {},
    };
  }
  const userId = env.DISCORD_USER_ID;
  const guildId = env.DISCORD_GUILD_ID;
  if (![userId, guildId].every((id) => /^\d{17,20}$/.test(id || ""))) {
    throw new Error(
      "Set DISCORD_USER_ID and DISCORD_GUILD_ID to valid Discord IDs.",
    );
  }
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences],
  });
  let user = null;
  let presence = null;
  let verified = false;
  let refreshing = false;

  async function refresh() {
    if (refreshing || !client.isReady()) return;
    refreshing = true;
    verified = false;
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild?.available)
        throw new Error(
          "The configured server is unavailable or the bot has not joined it.",
        );
      const members = await guild.members.fetch({
        user: [userId],
        withPresences: true,
        time: 15000,
      });
      const member = members.get(userId);
      if (!member)
        throw new Error("The configured user is not in the shared server.");
      user = member.user;
      presence = guild.presences.cache.get(userId) || null;
      verified = true;
    } catch (error) {
      console.error("Could not refresh Discord profile:", error.message);
    } finally {
      refreshing = false;
    }
  }

  client.on(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log("Bot is online");
    refresh();
  });
  client.on(Events.PresenceUpdate, (_, next) => {
    if (next.guild.id !== guildId || next.userId !== userId || !verified)
      return;
    presence = next;
    user = next.user || user;
  });
  client.on(Events.UserUpdate, (_, next) => {
    if (next.id === userId) user = next;
  });
  client.on(Events.ShardDisconnect, () => {
    verified = false;
  });
  client.on(Events.ShardReconnecting, () => {
    verified = false;
  });
  client.on(Events.Invalidated, () => {
    verified = false;
  });
  client.on(Events.ShardResume, refresh);
  client.on(Events.GuildUnavailable, (guild) => {
    if (guild.id === guildId) verified = false;
  });
  client.on(Events.GuildDelete, (guild) => {
    if (guild.id === guildId) verified = false;
  });
  client.on(Events.GuildAvailable, (guild) => {
    if (guild.id === guildId) refresh();
  });
  client.on(Events.Error, (error) =>
    console.error("Discord client error:", error.message),
  );
  const timer = setInterval(refresh, 5 * 60 * 1000);
  timer.unref();

  try {
    await client.login(token);
  } catch (error) {
    clearInterval(timer);
    client.destroy();
    throw new Error(
      `Discord login failed (${error.code || "connection error"}). Check the token and enable Presence Intent.`,
      { cause: error },
    );
  }
  return {
    snapshot: () =>
      publicProfile(
        user,
        presence,
        verified &&
          client.isReady() &&
          Boolean(client.guilds.cache.get(guildId)?.available),
      ),
    close: () => {
      clearInterval(timer);
      client.destroy();
    },
  };
}
