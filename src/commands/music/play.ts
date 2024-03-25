import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { MusicPlayerBot } from "../../bot/MusicPlayerBot";
import { AudioMaker, EmbedMaker, searchCommand } from "../../utils";
import { validateYoutubeUrl } from "../../reqex";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Allows you to play a song using a url link")
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

    if (!channel) {
      await interaction.reply({
        embeds: [embedMaker.getContentModal("⚠️ You need to be connected to a voice channel to play music!")]
      });
      return;
    }
    interaction.deferReply({ ephemeral: true }).catch(console.error);

    const url = interaction.options.getString("url")!;

    if (!url.match(validateYoutubeUrl)) {
      bot.lockSearchCommand(true);
      bot.interactionCommands.get("search")?.execute(interaction);
      return;
    }

    const song = await AudioMaker.setSong(url);

    if (typeof song === "undefined") {
      await interaction.editReply({
        embeds: [embedMaker.getContentModal("Sorry, but I couldn't find any songs!")]
      });
      return;
    }

    const musicPlayer = new MusicPlayerBot({
      voicechannel: channel,
      chanel: interaction.channel,
      interaction,
      botQueue
    });

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
  }
};
