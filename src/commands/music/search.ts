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
import { AudioMaker, collectorTimeout, validateYoutubeUrl } from "../../utils";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("search a song")
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
    interaction.reply("⏳ Loading...").catch(() => {});

    try {
      const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
      const { channel } = guildMember!.voice;
      if (!channel) {
        await interaction.editReply("You need to be connected to a voice channel to play music!");
        return;
      }

      const url = interaction.options.getString("url");
      if (!url) {
        await interaction.editReply("The provided URL cannot be empty.");
        return;
      }

      if (!url.match(validateYoutubeUrl)) {
        let videos: Video[] | undefined;

        try {
          const result = await YouTube.search(url, { limit: 10, type: "video" });
          videos = result.filter((video) => video.title != "Private video" && video.title != "Deleted video");
        } catch {
          await interaction.editReply("Sorry, but I couldn't find any songs!");
          return;
        }
        if (!videos || videos.length === 0) {
          await interaction.editReply("Sorry, but I couldn't find any songs!");
          return;
        }

        const options = videos.map((video: Video, i) => {
          return new StringSelectMenuOptionBuilder()
            .setLabel(video.title ?? "couldn't find title")
            .setDescription(video.description ?? "couldn't find description")
            .setValue(video.url);
        });

        const select = new StringSelectMenuBuilder()
          .setCustomId("songSelection")
          .setPlaceholder("")
          .addOptions(options);

        const components = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
        const result = await interaction.editReply({ content: "Select a song:", components: [components] });
        const filter = (interaction: IInteraction) => interaction.customId === "songSelection";
        const collector = result.createMessageComponentCollector({ filter, time: collectorTimeout });

        collector.on("collect", async (songInteraction) => {
          if (!(songInteraction instanceof StringSelectMenuInteraction)) return;
          await songInteraction.reply({ content: "⏳ Loading the selected song...", components: [] });
          const selectedSong = songInteraction.values[0];
          const song = await AudioMaker.setSong(selectedSong);
          new MusicPlayerBot(song, channel).play();
          await songInteraction.editReply({ content: selectedSong, components: [] });
          await interaction.editReply({ content: "Let the rhythm carry you away!", components: [] });
        });

        collector.on("end", async (_, reason) => {
          if (reason !== "time") return;
          await interaction.editReply("Time is up! The interaction has ended.");
        });
        return;
      }

      try {
        bot.interactionCommands.get("play")?.execute(interaction);
      } catch {
        interaction.editReply("ups, we have a tiny problem, can you please try again?");
      }
    } catch (error) {
      interaction.editReply("ups, we have a tiny problem, can you please try again?");
    }
  }
};
