import { Command } from "../../types/types";
import { bot } from "./../../../index";
import { Collection, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder().setName("help").setDescription("List of help commands"),
  async execute(interaction: CommandInteraction) {
    let commands: Collection<string, Command> = bot.interactionCommands;

    let helpEmbed: EmbedBuilder = new EmbedBuilder()
      .setTitle(interaction.client.user!.username)
      .setDescription("Description")
      .setColor("#F8AA2A");

    commands.forEach((cmd) => {
      helpEmbed.addFields({
        name: `**${cmd.data.name}**`,
        value: `${cmd.data.description}`,
        inline: false
      });
    });

    helpEmbed.setTimestamp();

    return interaction.reply({ embeds: [helpEmbed] }).catch(() => {
      interaction.deleteReply().catch(console.error);
    });
  }
};
