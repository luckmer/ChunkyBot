import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { AudioMaker, EmbedMaker } from "../../utils";

module.exports = {
  data: new SlashCommandBuilder().setName("list").setDescription("list of songs"),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const embed = new EmbedMaker();
    const guildID = interaction.guild!.id;
    const queue = bot.queues.get(guildID);
    const songs: AudioMaker[] = Array.from(queue?.queues.values() ?? []).flat();

    // Create an array to store author information for all songs
    const authorsInfo = songs.map((song: AudioMaker) => ({
      name: song.songInfo.video_details.channel?.name ?? "Unknown Author",
      iconURL: song.songInfo.video_details.channel?.icons?.[0] ?? undefined,
      url: song.songInfo.video_details.url
    }));

    // let playlistEmbed = new EmbedBuilder()
    //   .setTitle("List of Songs")
    //   .setDescription(songs.map((song: AudioMaker, index: number) => `${index + 1}. ${song.song.title}`).join("\n\n"))
    //   .setURL(songs.map((song: AudioMaker) => song.songInfo.video_details.url).join("\n\n"))
    //   .setColor("#F8AA2A");

    // // Set the author field to display information about all authors
    // playlistEmbed.setAuthor({
    //   name: "Authors Information"
    // });

    // // Add author information for each song in a field
    // playlistEmbed.addFields({
    //   name: "Authors",
    //   value: authorsInfo
    //     .map(
    //       (author, index) =>
    //         `[${index + 1}. ${author.name}](${author.url}) ${
    //           author.iconURL ? `[![Icon](${author.iconURL})](${author.url})` : ""
    //         }`
    //     )
    //     .join("\n")
    // });

    const embeds = songs.map((song) => embed.getSongModal(song.songInfo));

    await interaction.channel?.send({
      content: "List of Songs",
      embeds: embeds
    });
    interaction.deleteReply().catch(console.error);
  }
};
