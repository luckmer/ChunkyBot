import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Allows you to get information about the current ping"),
  execute(interaction: ChatInputCommandInteraction) {
    interaction
      .reply({ content: `Current ping is: ${Math.round(interaction.client.ws.ping)}`, ephemeral: true })
      .catch(console.error);
  }
};
