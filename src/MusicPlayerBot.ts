import {
  AudioPlayer,
  NoSubscriberBehavior,
  VoiceConnection,
  createAudioPlayer,
  joinVoiceChannel
} from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js";
import { type AudioMaker } from "./utils/audioMaker";

export class MusicPlayerBot {
  voiceChanel: VoiceConnection;
  audioPlayer: AudioPlayer = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
  audioMaker: AudioMaker;

  constructor(audioMaker: AudioMaker, channel: VoiceBasedChannel) {
    this.voiceChanel = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator
    });
    this.audioMaker = audioMaker;
  }

  async play() {
    const audioResource = await this.audioMaker.getAudioResource();
    this.voiceChanel.subscribe(this.audioPlayer);
    this.audioPlayer.play(audioResource!);
  }
}
