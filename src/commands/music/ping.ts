import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Allows you to get information about the current ping"),
  execute(interaction: ChatInputCommandInteraction) {
    interaction
      .reply({ content: "Pong: " + "`" + `${Math.round(interaction.client.ws.ping)}ms` + "`", ephemeral: true })
      .catch(() => {
        interaction.deleteReply().catch(console.error);
      });
  }
};
