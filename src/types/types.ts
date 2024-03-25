import {
  type ChatInputCommandInteraction,
  type SlashCommandBuilder,
  type TextBasedChannel,
  type VoiceBasedChannel
} from "discord.js";
import { MusicPlayerBot } from "src/bot/MusicPlayerBot";

export interface Command {
  data: SlashCommandBuilder;
  cooldown: number;
  execute(...args: any): any;
}

export interface IInteraction {
  customId: string;
}

export interface IMusicPlayerBot {
  interaction: ChatInputCommandInteraction;
  voicechannel: VoiceBasedChannel;
  chanel: TextBasedChannel | null;
  botQueue: MusicPlayerBot | undefined;
}

export interface ISong {
  url: string;
  title: string;
  duration: number;
}
