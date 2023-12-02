import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { EmbedMaker, formatTime } from "../../utils";

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
        embeds: [embedMaker.getContentModal("Sorry, but list of songs in the playlist is empty.")]
      });
      return;
    }

    (queue?.songs ?? []).forEach((song, index) => {
      helpEmbed.addFields({
        name: `${index + 1} Title: **${song.song.title}**`,
        value: "duration: " + "[" + "`" + `${formatTime(song.song.duration)}` + "`" + "]",
        inline: false
      });
    });

    helpEmbed.setTimestamp();

    return interaction.editReply({ embeds: [helpEmbed] }).catch(() => {
      interaction.deleteReply().catch(console.error);
    });
  }
};
