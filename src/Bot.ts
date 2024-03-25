import {
  ChatInputCommandInteraction,
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
import { MusicPlayerBot } from "./bot/MusicPlayerBot";
import { Command } from "./types/types";
import { searchCommand } from "./utils";

dotenv.config();

export default class Bot {
  commands: ApplicationCommandDataResolvable[] = [];
  clientId: string = "";
  interactionCommands: Collection<Snowflake, Command> = new Collection<Snowflake, Command>();
  queues: Collection<Snowflake, MusicPlayerBot> = new Collection<Snowflake, MusicPlayerBot>();
  cooldowns = new Collection<string, Collection<Snowflake, number>>();
  lockCommand = new Collection<string, boolean>();
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

  getClientId = (): void => {
    this.client.on(Events.ClientReady, (): void => {
      if (this.client.application === null) return;
      this.clientId = this.client.application.id;
    });
  };

  registerCommands = (): void => {
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

  lockSearchCommand = (lock: boolean): void => {
    if (!lock) {
      this.cooldowns.delete(searchCommand);
      return;
    }
    this.lockCommand.set(searchCommand, lock);
  };

  lockSearchCommandService = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    if (!this.lockCommand.has(searchCommand)) {
      this.lockCommand.set(searchCommand, false);
    }
    const hasSearchLock = this.lockCommand.get(searchCommand)!;

    if (hasSearchLock) {
      await interaction.reply({
        content: `\`Select a song\` is already active.`,
        ephemeral: true
      });
      return true;
    }

    if (interaction.commandName.match(/search/)) {
      this.lockCommand.set(interaction.commandName, true);
      setTimeout(() => this.cooldowns.delete(searchCommand), 60000);
    }
    return false;
  };

  cooldownService = async (
    interaction: ChatInputCommandInteraction,
    command: Command | undefined
  ): Promise<boolean> => {
    if (!this.cooldowns.has(interaction.commandName)) {
      this.cooldowns.set(interaction.commandName, new Collection());
    }

    const now = Date.now();
    const timestamps = this.cooldowns.get(interaction.commandName)!;
    const cooldownAmount = (command?.cooldown || 1) * 1000;

    const timestamp = timestamps.get(interaction.user.id);

    if (timestamp) {
      const expirationTime = timestamp + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        await interaction.reply({
          content: `${timeLeft} more second(s) before reusing the \`${interaction.commandName}\` command.`,
          ephemeral: true
        });
        return true;
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    return false;
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

      if (interaction.commandName === searchCommand) {
        this.lockCommand.set(searchCommand, true);
        setTimeout(() => this.lockCommand.set(searchCommand, false), 60000);
      }

      const lockExecuteCommand = await this.lockSearchCommandService(interaction);
      if (lockExecuteCommand) return;

      const hasCooldown = await this.cooldownService(interaction, command);
      if (hasCooldown) return;

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
