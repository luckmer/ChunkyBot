import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("volume")
    .addNumberOption((option) => option.setName("volume").setDescription("Enter volume").setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    interaction.reply("soon");
  }
};
