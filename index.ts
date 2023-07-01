import { Client } from "discord.js";
import Bot from "./src/Bot";

new Bot(
	new Client({ intents: [] })
);
