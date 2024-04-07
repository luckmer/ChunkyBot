import { type SlashCommandBuilder, type TextBasedChannel, type VoiceBasedChannel } from "discord.js";
import { MusicPlayerBot } from "../bot/MusicPlayerBot";

export interface Command {
  data: SlashCommandBuilder;
  cooldown: number;
  execute(...args: any): any;
}

export interface IInteraction {
  customId: string;
}

export interface IMusicPlayerBot {
  voicechannel: VoiceBasedChannel;
  chanel: TextBasedChannel | null;
  botQueue: MusicPlayerBot | undefined;
}

export interface ISong {
  url: string;
  title: string;
  duration: number;
}

export interface IMetadata {
  title: string;
  url: string;
  duration: number;
}
