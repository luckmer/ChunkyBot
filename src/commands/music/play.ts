import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { MusicPlayerBot } from "../../bot/MusicPlayerBot";
import { AudioMaker, validateYoutubeUrl } from "../../utils";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song")
    .addStringOption((option) =>
      option.setName("url").setDescription("Enter the URL of the song you would like to play").setRequired(true)
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
        bot.interactionCommands.get("search")?.execute(interaction);
        return;
      }

      const song = await AudioMaker.setSong(url);
      new MusicPlayerBot(song, channel).play();
      await interaction.editReply(url);
    } catch (error) {
      interaction.editReply("ups, we have a tiny problem, can you please try again?");
    }
  }
};
