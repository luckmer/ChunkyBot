import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { MusicPlayerBot } from "../../MusicPlayerBot";
import { AudioMaker } from "../../utils/audioMaker";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play song")
    .addStringOption((option) =>
      option.setName("url").setDescription("What kind of song you would like to play").setRequired(true)
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
    const { channel } = guildMember!.voice;

    if (!channel) {
      await interaction.reply("you need to be connected to music chanel!");
      return;
    }

    const url = interaction.options.getString("url");

    if (!url) {
      await interaction.reply("provided url can not be empty");
      return;
    }

    const song = await AudioMaker.setSong(url);

    new MusicPlayerBot(song, channel).play();
    await interaction.reply(url);
  }
};
