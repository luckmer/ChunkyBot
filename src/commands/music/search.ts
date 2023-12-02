import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder
} from "discord.js";
import { YouTube, type Video } from "youtube-sr";
import { bot } from "../../../index";
import { MusicPlayerBot } from "../../bot/MusicPlayerBot";
import { IInteraction } from "../../types/types";
import { AudioMaker, collectorTimeout, EmbedMaker } from "../../utils";
import { validateYoutubeUrl } from "../../reqex";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Allows you to find your favorite song")
    .addStringOption((option) =>
      option.setName("url").setDescription("Enter the URL of the song you would like to search").setRequired(true)
    ),
  cooldown: 3,
  permissions: [
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak,
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.ManageMessages
  ],
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const botQueue = bot.queues.get(interaction.guild!.id);
    const { channel } = guildMember!.voice;
    const embedMaker = new EmbedMaker();

    if (!channel) {
      await interaction.reply({
        embeds: [embedMaker.getContentModal("⚠️ You need to be connected to a voice channel to play music!")]
      });
      return;
    }
    interaction.deferReply({ ephemeral: true }).catch(console.error);

    const url = interaction.options.getString("url")!;

    if (!url.match(validateYoutubeUrl)) {
      let videos: Video[] | undefined;
      try {
        const result = await YouTube.search(url, { limit: 10, type: "video" });
        videos = result.filter((video) => video.title != "Private video" && video.title != "Deleted video");
      } catch {}

      if (!videos || videos.length === 0) {
        await interaction.editReply({ embeds: [embedMaker.getContentModal("Sorry, but I couldn't find any songs!")] });
        return;
      }

      const options = videos.map((video: Video, i) => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(video.title ?? "couldn't find title")
          .setDescription(video.description ?? "couldn't find description")
          .setValue(video.url);
      });

      const select = new StringSelectMenuBuilder().setCustomId("songSelection").setPlaceholder("").addOptions(options);

      const components = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
      const result = await interaction.editReply({ content: "Select a song:", components: [components] });

      const collector = result.createMessageComponentCollector({
        filter: (interaction: IInteraction) => interaction.customId === "songSelection",
        time: collectorTimeout
      });

      collector.on("collect", async (songInteraction) => {
        if (!(songInteraction instanceof StringSelectMenuInteraction)) return;

        const selectedSong = songInteraction.values[0];
        const song = await AudioMaker.setSong(selectedSong);
        const musicPlayer = new MusicPlayerBot({
          voicechannel: channel,
          chanel: interaction.channel,
          interaction,
          botQueue
        });

        if (typeof song === "undefined") {
          await interaction.editReply({
            embeds: [embedMaker.getContentModal("Sorry, but I couldn't find any songs!")]
          });
          return;
        }

        bot.queues.set(interaction.guild!.id, musicPlayer);
        const queue = Array.from(botQueue?.queues.values() ?? []).flat();

        await musicPlayer.addToQueueAndPlay([song, ...queue]);

        const response = {
          embeds: [
            !queue.length
              ? embedMaker.getSongModal(song.songInfo)
              : embedMaker.getQueueModal("| Track Added to Queue", song.songInfo)
          ]
        };

        await interaction.channel?.send(response);
        channel.send(response);
        interaction.deleteReply().catch(console.error);
      });

      collector.on("end", async (_, reason) => {
        if (reason === "time") interaction.deleteReply().catch(console.error);
      });
      return;
    }

    try {
      bot.interactionCommands.get("play")?.execute(interaction);
    } catch {}

    interaction.deleteReply().catch(console.error);
  }
};
