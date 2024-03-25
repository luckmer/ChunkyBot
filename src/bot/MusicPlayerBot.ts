import {
  AudioPlayer,
  AudioPlayerState,
  AudioPlayerStatus,
  AudioResource,
  NoSubscriberBehavior,
  VoiceConnection,
  createAudioPlayer,
  joinVoiceChannel
} from "@discordjs/voice";
import { Collection, type ChatInputCommandInteraction, type TextBasedChannel } from "discord.js";
import { IMusicPlayerBot, ISong } from "../types/types";
import { type AudioMaker } from "../utils/index";

export class MusicPlayerBot {
  audioPlayer: AudioPlayer;
  interaction: ChatInputCommandInteraction;
  chanel: TextBasedChannel | null;
  voiceChanel: VoiceConnection;
  audioResource: AudioResource<ISong> | undefined = undefined;
  queues: Collection<number, AudioMaker[]> = new Collection<number, AudioMaker[]>();
  botQueue: MusicPlayerBot | undefined = undefined;
  songs: AudioMaker[] = [];
  lockPlay: boolean = false;
  readyLock: boolean = false;
  stopped: boolean = false;

  constructor({ voicechannel, chanel, interaction, botQueue }: IMusicPlayerBot) {
    this.audioPlayer = botQueue?.audioPlayer || this.subscribeToAudioPlayer();
    this.audioResource = botQueue?.audioResource;
    this.botQueue = botQueue;

    this.voiceChanel = joinVoiceChannel({
      channelId: voicechannel.id,
      guildId: voicechannel.guild.id,
      adapterCreator: voicechannel.guild.voiceAdapterCreator
    });

    this.voiceChanel.subscribe(this.audioPlayer);
    this.interaction = interaction;
    this.chanel = chanel;

    this.audioPlayer.on("stateChange" as any, async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
      if (oldState.status !== AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Idle) {
        this.songs.pop();
        if (!this.songs.length) {
          return this.audioPlayer.stop();
        }
        this.play();
      }

      // TODO: add new UI with current music
      // if (oldState.status === AudioPlayerStatus.Buffering && newState.status === AudioPlayerStatus.Playing) {
      // }
    });
  }

  subscribeToAudioPlayer(): AudioPlayer {
    return createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
  }

  async addToQueueAndPlay(songs: AudioMaker[]): Promise<void> {
    this.queues.set(Math.random(), songs);
    this.songs = songs;
    if (this.botQueue?.lockPlay || this.audioPlayer.state.status !== AudioPlayerStatus.Idle) return;
    await this.play();
    this.lockPlay = typeof this.botQueue === "undefined" ? true : this.botQueue?.lockPlay;
  }

  async play(): Promise<void> {
    this.lockPlay = true;
    try {
      const nextSong = this.songs[0];
      const audioResource = await nextSong.getAudioResource();
      this.audioResource = audioResource;
      this.audioPlayer.play(audioResource);
    } catch (error) {
      console.error(error);
    } finally {
      this.lockPlay = false;
    }
  }
}
