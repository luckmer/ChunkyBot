import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../../..";

module.exports = {
  data: new SlashCommandBuilder().setName("stop").setDescription("Stop song"),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply("stop!");

    const queue = bot.queues.get(interaction.guild!.id);
    if (!queue) return;
    //TODO: add stop method
  }
};
