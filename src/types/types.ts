import { SlashCommandBuilder } from "discord.js";

export interface Command {
  data: SlashCommandBuilder;

  execute(...args: any): any;
}

export interface IInteraction {
  customId: string;
}
