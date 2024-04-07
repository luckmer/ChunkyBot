import { AudioPlayerStatus } from "@discordjs/voice";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { Reply } from "../../../src/utils/reply";
import { MusicPlayerBot } from "../../bot/MusicPlayerBot";

module.exports = {
  data: new SlashCommandBuilder().setName("pause").setDescription("Allows you to pause the currently listening song."),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue: MusicPlayerBot | undefined = bot.queues.get(interaction.guild!.id);

    if (!queue) {
      await Reply(interaction, "No active queue.");
      return;
    }
    if (queue.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      await Reply(interaction, "There is no song playing to pause.");
      return;
    }

    if (queue.audioPlayer.pause()) {
      await Reply(interaction, "Song paused.");
    }
  }
};
