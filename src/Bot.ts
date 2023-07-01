import { type Client, Events } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

export default class Bot {
  clientUsername: string = "";
  client: Client;

  constructor(client: Client) {
    client.login(process.env.DISCORD_TOKEN).catch((err) => console.log("failed to connect", err));
    client.on(Events.Error, (err) => console.log(err));
    client.on(Events.Warn, (err) => console.log(err));
    this.client = client;

    this.getClientUsername();
    this.interactionService();
  }

  getClientUsername = () => {
    this.client.on(Events.ClientReady, () => {
      if (this.client.user === null) return;
      this.clientUsername = this.client.user.username;
      console.log(this.clientUsername);
    });
  };

  interactionService = () => {
    this.client.on(Events.InteractionCreate, (interaction) => {
      if (interaction.isChatInputCommand()) return;
      console.log(interaction, "interactions");
    });
  };
}
