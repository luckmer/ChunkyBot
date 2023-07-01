import { Client } from "discord.js";

const client = new Client({
  intents: []
});
client.login("").catch((err)=>{
  console.log("failed to connect" ,err)
})

console.log(client);
