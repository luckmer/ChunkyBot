import {
  Collection,
  Events,
  Interaction,
  REST,
  Routes,
  type ApplicationCommandDataResolvable,
  type Client,
  type Snowflake
} from "discord.js";
import dotenv from "dotenv";
import { readdirSync } from "fs";
import * as path from "path";
import { Command } from "./types/types";
import { MusicPlayerBot } from "./bot/MusicPlayerBot";
dotenv.config();

export default class Bot {
  commands: ApplicationCommandDataResolvable[] = [];
  clientId: string = "";
  interactionCommands: Collection<Snowflake, Command> = new Collection<Snowflake, Command>();
  queues: Collection<Snowflake, MusicPlayerBot> = new Collection<Snowflake, MusicPlayerBot>();
  client: Client;

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
          this.interactionCommands.set(command.data.name, command);
        }
      }

      await rest.put(Routes.applicationCommands(this.clientId), { body: this.commands });
    });
  };

  interactionService = (): void => {
    this.client.on(Events.InteractionCreate, async (interaction: Interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command: Command | undefined = this.interactionCommands.get(interaction.commandName);

      if (!command) {
        await interaction.reply({
          content: `No command matching ${interaction.commandName} was found.`,
          ephemeral: true
        });
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true });
        } else {
          await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        }
      }
    });
  };
}
