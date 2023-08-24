import {
  AudioPlayer,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnection,
  createAudioPlayer,
  joinVoiceChannel
} from "@discordjs/voice";
import { Collection, type ChatInputCommandInteraction, type TextBasedChannel } from "discord.js";
import { IMusicPlayerBot } from "../types/types";
import { miliseconds, type AudioMaker } from "../utils/index";

export class MusicPlayerBot {
  audioPlayer: AudioPlayer;
  interaction: ChatInputCommandInteraction;
  chanel: TextBasedChannel | null;
  voiceChanel: VoiceConnection;
  queues: Collection<number, AudioMaker[]> = new Collection<number, AudioMaker[]>();
  botQueue: MusicPlayerBot | undefined = undefined;
  songs: AudioMaker[] = [];
  lockPlay = false;
  readyLock = false;
  stopped = false;

  constructor({ voicechannel, chanel, interaction, botQueue }: IMusicPlayerBot) {
    this.audioPlayer = typeof botQueue === "undefined" ? this.subscribeToAudioPlayer() : botQueue.audioPlayer;
    this.botQueue = botQueue;
    this.voiceChanel = joinVoiceChannel({
      channelId: voicechannel.id,
      guildId: voicechannel.guild.id,
      adapterCreator: voicechannel.guild.voiceAdapterCreator
    });
    this.voiceChanel.subscribe(this.audioPlayer);
    this.interaction = interaction;
    this.chanel = chanel;
  }

  subscribeToAudioPlayer() {
    return createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
  }

  async addToQueueAndPlay(songs: AudioMaker[]) {
    this.queues.set(Math.random(), songs);
    this.songs = songs;

    const areSongsEmpty = this.songs.length === 0;
    const isBotQueueLockedOrPlaying =
      this.botQueue?.lockPlay || this.audioPlayer.state.status !== AudioPlayerStatus.Idle;

    if (areSongsEmpty) this.audioPlayer.stop();
    if (isBotQueueLockedOrPlaying || areSongsEmpty) return;

    await this.play();
    this.lockPlay = typeof this.botQueue === "undefined" ? true : this.botQueue?.lockPlay;
  }

  async play() {
    this.lockPlay = true;

    try {
      const nextSong = this.songs[0];
      console.log("so next song", nextSong?.song?.title);

      const audioResource = await nextSong.getAudioResource();
      const delayMilliseconds = nextSong.song.duration * miliseconds;
      this.audioPlayer.play(audioResource);
      console.log(this.songs.length);

      console.log(this.songs.length);
      setTimeout(() => {
        this.lockPlay = false;
        this.play();
      }, delayMilliseconds);
    } catch (error) {
      console.error(error);
    } finally {
      this.lockPlay = false;
    }
  }
}
