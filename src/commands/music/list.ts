import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { EmbedMaker } from "../../utils";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("Allows you to view the list of songs in the playlist."),
  async execute(interaction: ChatInputCommandInteraction) {
    const embedMaker = new EmbedMaker();
    await interaction.deferReply({ ephemeral: true });
    const guildID = interaction.guild!.id;
    const queue = bot.queues.get(guildID);

    let helpEmbed = embedMaker.getValueContentModal(interaction.client.user!.username);

    if (!queue?.songs.length) {
      await interaction.editReply({
        embeds: [embedMaker.getContentModal("Sorry, but list of songs in the playlist is empty.", "#F8AA2A")]
      });
      return;
    }

    (queue?.songs ?? []).forEach((song, index) => {
      helpEmbed.addFields({
        name: `**${index + 1}: ${song.song.title}**`,
        value: `duration: ${parseInt(song.song.duration.toString()) / 60}`,
        inline: false
      });
    });

    helpEmbed.setTimestamp();

    return interaction.editReply({ embeds: [helpEmbed] }).catch(() => {
      interaction.deleteReply().catch(console.error);
    });
  }
};
