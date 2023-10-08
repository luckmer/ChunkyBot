import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { EmbedMaker } from "../../utils";
import { AudioPlayerStatus } from "@discordjs/voice";

module.exports = {
  data: new SlashCommandBuilder().setName("resume").setDescription("Resume the currently paused song"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = bot.queues.get(interaction.guild!.id);
    const embedMaker = new EmbedMaker();

    if (!queue) {
      await interaction.reply({
        embeds: [embedMaker.getContentModal("No active queue to resume.")]
      });
      return;
    }

    if (queue.audioPlayer.state.status !== AudioPlayerStatus.Paused) {
      const replyOptions = interaction.replied
        ? { embeds: [embedMaker.getContentModal("Current song is not paused.")] }
        : { embeds: [embedMaker.getContentModal("Current song is not paused.")] };

      await interaction[interaction.replied ? "editReply" : "reply"](replyOptions);
      return;
    }

    if (queue.audioPlayer.unpause()) {
      const replyOptions = { embeds: [embedMaker.getContentModal("Song resumed.")] };
      await interaction[interaction.replied ? "editReply" : "reply"](replyOptions);
    }
  }
};
