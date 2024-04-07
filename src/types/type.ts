import { ButtonInteraction } from "discord.js";
import { MusicPlayerBot } from "../bot/MusicPlayerBot";
import { SONG_COMMANDS } from "./enums";

export type CommandHandlersType = Map<
  SONG_COMMANDS,
  (queue: MusicPlayerBot, interaction: ButtonInteraction) => Promise<void>
>;
