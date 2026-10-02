import { profile } from "../config.js";
import { renderIcons } from "./icons.js";
import { renderProjects } from "./projects.js";
import { renderGitHub } from "./github.js";
import { startPresence } from "./discord.js";

renderProjects(profile.projects);
renderIcons();
renderGitHub();
const localApi =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";
startPresence(localApi ? "./api/discord" : profile.presenceApi);
