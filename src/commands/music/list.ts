import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../../../index";
import { AudioMaker } from "../../utils";

module.exports = {
  data: new SlashCommandBuilder().setName("queue").setDescription("Queue"),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const guildID = interaction.guild!.id;
    const queue = bot.queues.get(guildID);
    const songs: AudioMaker[] = Array.from(queue?.queues.values() ?? []).flat();
    //TODO: display songs
    console.log(songs);
    await interaction.reply("queue!");
  }
};
