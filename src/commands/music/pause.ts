import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { EmbedMaker } from "../../utils";
import { AudioPlayerStatus } from "@discordjs/voice";

module.exports = {
  data: new SlashCommandBuilder().setName("pause").setDescription("Pause the currently playing song"),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const queue = bot.queues.get(interaction.guild!.id);
    const embedMaker = new EmbedMaker();

    if (!queue) {
      await interaction.editReply({ embeds: [embedMaker.getContentModal("No active queue to pause.")] });
      return;
    }

    if (queue.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      await interaction.editReply({ embeds: [embedMaker.getContentModal("There is no song playing to pause.")] });
      return;
    }

    if (queue.audioPlayer.pause()) {
      await interaction.channel?.send({ embeds: [embedMaker.getContentModal("Song paused.")] });
      interaction.deleteReply().catch(console.error);
    }
  }
};
