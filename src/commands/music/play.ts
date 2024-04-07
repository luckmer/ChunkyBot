import { ChatInputCommandInteraction, GuildMember, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { MusicPlayerBot } from "../../bot/MusicPlayerBot";
import { validateYoutubeUrl } from "../../reqex";
import { AudioMaker, EmbedMaker } from "../../utils";

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
    interaction.deferReply({ ephemeral: true }).catch(console.error);

    const url: string = interaction.options.getString("url")!;

    if (!url.match(validateYoutubeUrl)) {
      bot.lockSearchCommand(true);
      bot.interactionCommands.get("search")?.execute(interaction);
      return;
    }

    const song: AudioMaker | undefined = await AudioMaker.setSong(url);

    if (typeof song === "undefined") {
      bot.lockSearchCommand(false);
      await interaction.editReply({
        embeds: [embedMaker.getContentModal("Sorry, but I couldn't find any songs!")]
      });
      return;
    }

    const musicPlayer: MusicPlayerBot = new MusicPlayerBot({
      voicechannel: channel,
      chanel: interaction.channel,
      botQueue
    });

    bot.queues.set(interaction.guild!.id, musicPlayer);
    const queue: AudioMaker[] = Array.from(botQueue?.queues.values() ?? []).flat();
    await musicPlayer.addToQueueAndPlay([song, ...queue]);

    if (queue.length) {
      await interaction.channel?.send({
        embeds: [embedMaker.getQueueModal("Track Added to Queue", song.songInfo)]
      });

      channel.send({
        embeds: [embedMaker.getQueueModal("Track Added to Queue", song.songInfo)]
      });
    }

    interaction.deleteReply().catch(console.error);
  }
};
