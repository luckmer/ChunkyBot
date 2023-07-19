import { Client, GatewayIntentBits } from "discord.js";
import Bot from "./src/Bot";

new Bot(
  new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages]
  })
);
