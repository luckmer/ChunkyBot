import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { EmbedMaker } from "../../utils";
import { MusicPlayerBot } from "../../bot/MusicPlayerBot";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Allows you to control the volume")
    .addIntegerOption((option) =>
      option.setName("volume").setDescription("Enter volume").setRequired(true).setMinValue(0).setMaxValue(100)
    ),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const queue: MusicPlayerBot | undefined = bot.queues.get(interaction.guild!.id);
    const embedMaker: EmbedMaker = new EmbedMaker();

    if (!queue) {
      await interaction.editReply({
        embeds: [embedMaker.getContentModal("No active queue.")]
      });
      return;
    }

    const volume: number = interaction.options.getInteger("volume")!;

    if (!volume) {
      await interaction.editReply({
        embeds: [embedMaker.getContentModal("Couldn't get the volume, try again in a few seconds.")]
      });
      return;
    }

    queue.audioResource!.volume?.setVolume(volume / 100);

    await interaction.channel?.send({
      embeds: [embedMaker.getContentModal(`Current volume: ${volume}%`)]
    });
    interaction.deleteReply().catch(console.error);
  }
};
