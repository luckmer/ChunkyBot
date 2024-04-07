import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  InteractionCollector,
  Message,
  PermissionsBitField,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder
} from "discord.js";
import { YouTube, type Video } from "youtube-sr";
import { bot } from "../../../index";
import { MusicPlayerBot } from "../../bot/MusicPlayerBot";
import { validateYoutubeUrl } from "../../reqex";
import { IInteraction } from "../../types/types";
import { AudioMaker, EmbedMaker } from "../../utils";

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
    const guildMember: GuildMember | undefined = interaction.guild!.members.cache.get(interaction.user.id);
    const botQueue: MusicPlayerBot | undefined = bot.queues.get(interaction.guild!.id);
    const { channel } = guildMember!.voice;

    const embedMaker: EmbedMaker = new EmbedMaker();

    if (!channel) {
      await interaction.reply({
        embeds: [embedMaker.getContentModal("⚠️ You need to be connected to a voice channel to play music!")]
      });
      return;
    }
    await interaction.deferReply({ ephemeral: true }).catch(console.error);

    const url: string = interaction.options.getString("url")!;

    if (!url.match(validateYoutubeUrl)) {
      let videos: Video[] | undefined;
      try {
        const result: Video[] = await YouTube.search(url, { limit: 10, type: "video" });
        videos = result.filter((video) => video.title != "Private video" && video.title != "Deleted video");
      } catch {}

      if (!videos || videos.length === 0) {
        bot.lockSearchCommand(false);
        await interaction.editReply({ embeds: [embedMaker.getContentModal("Sorry, but I couldn't find any songs!")] });
        return;
      }

      const options: StringSelectMenuOptionBuilder[] = videos.map((video: Video) => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(video.title ?? "couldn't find title")
          .setDescription(video.description ?? "couldn't find description")
          .setValue(video.url);
      });

      const select: StringSelectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId("songSelection")
        .setPlaceholder("")
        .addOptions(options);

      const components: ActionRowBuilder<StringSelectMenuBuilder> =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

      const result: Message<boolean> = await interaction.editReply({
        content: "Select a song:",
        components: [components]
      });

      const collector: InteractionCollector<any> = result.createMessageComponentCollector({
        filter: (interaction: IInteraction) => interaction.customId === "songSelection",
        time: 60000
      });

      collector.on("collect", async (songInteraction) => {
        bot.lockSearchCommand(false);
        await songInteraction.deferUpdate();
        if (!(songInteraction instanceof StringSelectMenuInteraction)) return;

        const selectedSong: string = songInteraction.values[0];
        const song: AudioMaker | undefined = await AudioMaker.setSong(selectedSong);

        const musicPlayer: MusicPlayerBot = new MusicPlayerBot({
          voicechannel: channel,
          chanel: interaction.channel,
          botQueue
        });

        if (typeof song === "undefined") {
          await interaction.editReply({
            embeds: [embedMaker.getContentModal("Sorry, but I couldn't find any songs!")]
          });
          return;
        }

        bot.queues.set(interaction.guild!.id, musicPlayer);
        const queue: AudioMaker[] = Array.from(botQueue?.queues.values() ?? []).flat();

        await musicPlayer.addToQueueAndPlay([song, ...queue]);

        if (queue.length) {
          const response: { embeds: EmbedBuilder[] } = {
            embeds: [embedMaker.getQueueModal("Track Added to Queue", song.songInfo)]
          };

          await interaction.channel?.send(response);
          channel.send(response);
        }

        interaction.deleteReply().catch(console.error);
      });

      collector.on("end", () => {
        result.edit({ components: [] }).catch(console.error);
        result.delete().catch(() => {});
      });

      return;
    }

    try {
      bot.interactionCommands.get("play")?.execute(interaction);
    } catch {}

    interaction.deleteReply().catch(console.error);
  }
};
