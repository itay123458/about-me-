const statuses = new Set(["online", "idle", "dnd", "offline"]);

export function publicProfile(user, presence, available) {
  const activities =
    available && presence?.status !== "offline"
      ? presence?.activities || []
      : [];
  const custom = activities.find((activity) => activity.type === 4);
  const activity = activities.find((activity) => activity.type !== 4);
  return {
    available,
    status: available
      ? statuses.has(presence?.status)
        ? presence.status
        : "offline"
      : "unknown",
    user: user
      ? {
          username: user.username,
          displayName: user.globalName || user.username,
          avatarUrl: user.displayAvatarURL({ size: 256, extension: "png" }),
        }
      : null,
    customStatus: custom?.state?.slice(0, 256) || null,
    activity: activity
      ? {
          type: activity.type,
          name: activity.name?.slice(0, 128) || "",
          details: activity.details?.slice(0, 256) || null,
          state: activity.state?.slice(0, 256) || null,
        }
      : null,
  };
}
