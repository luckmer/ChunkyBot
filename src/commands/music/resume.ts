import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { EmbedMaker } from "../../utils";
import { bot } from "../../../index";

module.exports = {
  data: new SlashCommandBuilder().setName("resume").setDescription("Resume the currently paused song"),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = bot.queues.get(interaction.guild!.id);
    const embedMaker = new EmbedMaker();

    if (!queue) {
      await interaction.reply({ embeds: [embedMaker.getContentModal("No active queue to resume.")] });
      return;
    }

    if (queue.audioPlayer.unpause()) {
      if (interaction.replied) {
        await interaction.editReply({ embeds: [embedMaker.getContentModal("Song resumed.")] });
      } else {
        await interaction.reply({ embeds: [embedMaker.getContentModal("Song resumed.")] });
      }
    }
  }
};
