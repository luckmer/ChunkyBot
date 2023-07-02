import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder().setName("stop").setDescription("Stop song"),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply("stop!");
  }
};
