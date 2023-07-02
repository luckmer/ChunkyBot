import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder().setName("play").setDescription("Play song"),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply("play!");
  }
};
