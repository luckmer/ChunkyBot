import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { EmbedMaker } from "../../utils";

module.exports = {
  data: new SlashCommandBuilder().setName("pause").setDescription("Pause the currently playing song"),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = bot.queues.get(interaction.guild!.id);
    const embedMaker = new EmbedMaker();

    if (!queue) {
      await interaction.reply({ embeds: [embedMaker.getContentModal("No active queue to pause.")] });
      return;
    }

    if (queue.audioPlayer.pause()) {
      if (interaction.replied) {
        await interaction.editReply({ embeds: [embedMaker.getContentModal("Song paused.")] });
      } else {
        await interaction.reply({ embeds: [embedMaker.getContentModal("Song paused.")] });
      }
    }
  }
};
