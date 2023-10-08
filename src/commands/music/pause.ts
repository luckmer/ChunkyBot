import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { EmbedMaker } from "../../utils";
import { AudioPlayerStatus } from "@discordjs/voice";

module.exports = {
  data: new SlashCommandBuilder().setName("pause").setDescription("Pause the currently playing song"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = bot.queues.get(interaction.guild!.id);
    const embedMaker = new EmbedMaker();

    if (!queue) {
      await interaction.reply({
        embeds: [embedMaker.getContentModal("No active queue to pause.")]
      });
      return;
    }

    if (queue.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      const replyOptions = interaction.replied
        ? { embeds: [embedMaker.getContentModal("There is no song playing to pause.")] }
        : { embeds: [embedMaker.getContentModal("There is no song playing to pause.")] };

      await interaction[interaction.replied ? "editReply" : "reply"](replyOptions);
      return;
    }

    if (queue.audioPlayer.pause()) {
      const replyOptions = { embeds: [embedMaker.getContentModal("Song paused.")] };

      await interaction[interaction.replied ? "editReply" : "reply"](replyOptions);
    }
  }
};
