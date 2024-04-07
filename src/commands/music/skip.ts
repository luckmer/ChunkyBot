import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { AudioMaker, EmbedMaker } from "../../utils";
import { MusicPlayerBot } from "../../bot/MusicPlayerBot";

module.exports = {
  data: new SlashCommandBuilder().setName("skip").setDescription("Allows you to skip to the next available song."),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildMember: GuildMember | undefined = interaction.guild!.members.cache.get(interaction.user.id);
    const botQueue: MusicPlayerBot | undefined = bot.queues.get(interaction.guild!.id);
    const { channel } = guildMember!.voice;
    const embedMaker: EmbedMaker = new EmbedMaker();

    if (!channel) {
      await interaction.reply({
        embeds: [embedMaker.getContentModal("⚠️ You need to be connected to a voice channel to skip to the next song!")]
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true }).catch(console.error);
    const queue: AudioMaker[] = Array.from(botQueue?.queues.values() ?? []).flat();

    queue.pop();

    if (!queue.length) {
      await interaction.editReply({
        embeds: [embedMaker.getContentModal("No active queue.")]
      });
      return;
    }

    const musicPlayer: MusicPlayerBot = new MusicPlayerBot({
      voicechannel: channel,
      chanel: interaction.channel,
      botQueue
    });

    await musicPlayer.skipSong(queue);
    bot.queues.set(interaction.guild!.id, musicPlayer);

    const response: { embeds: EmbedBuilder[] } = {
      embeds: [embedMaker.getSongModal(queue[0].songInfo)]
    };

    await Promise.all([interaction.channel?.send(response), channel.send(response)]);
    interaction.deleteReply().catch(console.error);
  }
};
