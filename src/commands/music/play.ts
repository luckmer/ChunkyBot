import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { MusicPlayerBot } from "../../bot/MusicPlayerBot";
import { AudioMaker, EmbedMaker, validateYoutubeUrl } from "../../utils";

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
    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const botQueue = bot.queues.get(interaction.guild!.id);
    const { channel } = guildMember!.voice;
    const embedMaker = new EmbedMaker();

    try {
      await interaction.reply({ embeds: [embedMaker.getContentModal("⏳ Loading...")] });
    } catch {}

    if (!channel) {
      await interaction.editReply({
        embeds: [embedMaker.getContentModal("⚠️ You need to be connected to a voice channel to play music!")]
      });
      return;
    }

    const url = interaction.options.getString("url")!;

    if (!url.match(validateYoutubeUrl)) {
      bot.interactionCommands.get("search")?.execute(interaction);
      return;
    }

    const song = await AudioMaker.setSong(url);
    const musicPlayer = new MusicPlayerBot({
      voicechannel: channel,
      chanel: interaction.channel,
      interaction,
      botQueue
    });

    bot.queues.set(interaction.guild!.id, musicPlayer);
    const queue = Array.from(botQueue?.queues.values() ?? []).flat();

    await musicPlayer.addToQueueAndPlay([song, ...queue]);

    await interaction.channel?.send({
      embeds: [
        !queue.length ? embedMaker.getSongModal(song.songInfo) : embedMaker.getContentModal("🛣️  Added to queue  🛣️")
      ]
    });

    channel.send({
      embeds: [
        !queue.length ? embedMaker.getSongModal(song.songInfo) : embedMaker.getContentModal("🛣️  Added to queue  🛣️")
      ]
    });

    interaction.deleteReply().catch(console.error);
  }
};
