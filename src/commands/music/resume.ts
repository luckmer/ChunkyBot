import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { Reply } from "../../../src/utils/reply";
import { MusicPlayerBot } from "../../bot/MusicPlayerBot";

module.exports = {
  data: new SlashCommandBuilder().setName("resume").setDescription("Resumes playback of stopped music"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue: MusicPlayerBot | undefined = bot.queues.get(interaction.guild!.id);

    if (!queue) {
      await Reply(interaction, "No active queue.");
      return;
    }

    if (queue.audioPlayer.unpause()) {
      await Reply(interaction, "Song resumed.");
    }
  }
};
