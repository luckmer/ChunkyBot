import { type ApplicationCommandDataResolvable, type Client, Events, Interaction, REST, Routes } from "discord.js";
import dotenv from "dotenv";
import { readdirSync } from "fs";
import * as path from "path";
import { Command } from "./types";

dotenv.config();

export default class Bot {
  commands: ApplicationCommandDataResolvable[] = [];
  clientId: string = "";
  public client: Client;

  constructor(client: Client) {
    client.login(process.env.DISCORD_TOKEN).catch((err) => console.log("failed to connect", err));

    this.client = client;
    this.getClientId();
    this.registerCommands();

    client.on(Events.Error, (err: Error) => console.log(err));
    client.on(Events.Warn, (err: string) => console.log(err));
    this.interactionService();
  }

  getClientId = () => {
    this.client.on(Events.ClientReady, (): void => {
      if (this.client.application === null) return;
      this.clientId = this.client.application.id;
    });
  };

  registerCommands = () => {
    this.client.on(Events.ClientReady, async () => {
      const rest: REST = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN ?? "");
      const commandFiles: string[] = readdirSync(path.join(__dirname, "commands")).filter((file: string) =>
        file.endsWith(".ts")
      );

      for (const file of commandFiles) {
        const importedCommands = await import(path.join(__dirname, "commands", `${file}`));
        const commands: Command[] = Object.values(importedCommands);

        for (const command of commands) {
          this.commands.push(command.data);
        }
      }

      await rest.put(Routes.applicationCommands(this.clientId), { body: this.commands });
    });
  };

  interactionService = (): void => {
    this.client.on(Events.InteractionCreate, async (interaction: Interaction) => {
      if (!interaction.isChatInputCommand()) return;

      // TODO : connect commands

      if (interaction.commandName === "play") {
        await interaction.reply({ content: "play ", ephemeral: true });
      }

      if (interaction.commandName === "stop") {
        await interaction.reply({ content: "stop ", ephemeral: true });
      }
    });
  };
}
