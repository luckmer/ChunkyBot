import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { EmbedMaker } from "../../utils";
import { AudioPlayerStatus } from "@discordjs/voice";

module.exports = {
  data: new SlashCommandBuilder().setName("resume").setDescription("Resume the currently paused song"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const queue = bot.queues.get(interaction.guild!.id);
    const embedMaker = new EmbedMaker();

    if (!queue) {
      await interaction.editReply({ embeds: [embedMaker.getContentModal("No active queue to resume.")] });
      return;
    }

    if (queue.audioPlayer.state.status !== AudioPlayerStatus.Paused) {
      await interaction.editReply({ embeds: [embedMaker.getContentModal("Current song is not paused.")] });
      return;
    }

    if (queue.audioPlayer.unpause()) {
      await interaction.channel?.send({ embeds: [embedMaker.getContentModal("Song resumed.")] });
      interaction.deleteReply().catch(console.error);
    }
  }
};
