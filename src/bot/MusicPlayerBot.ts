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
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Collection,
  InteractionCollector,
  Message,
  type TextBasedChannel
} from "discord.js";
import { bot } from "../../index";
import { Reply } from "../../src/utils/reply";
import { IMetadata, IMusicPlayerBot, ISong } from "../types/types";
import { AudioMaker, EmbedMaker } from "../utils/index";
import { SONG_COMMANDS } from "../types/enums";
import { CommandHandlersType } from "../types/type";

export class MusicPlayerBot {
  audioPlayer: AudioPlayer;
  chanel: TextBasedChannel | null;
  voiceChanel: VoiceConnection;
  audioResource: AudioResource<ISong> | undefined = undefined;
  queues: Collection<number, AudioMaker[]> = new Collection<number, AudioMaker[]>();
  botQueue: MusicPlayerBot | undefined = undefined;
  songs: AudioMaker[] = [];
  lockPlay: boolean = false;
  readyLock: boolean = false;
  stopped: boolean = false;
  isSongModal: boolean = false;
  commandHandlers: CommandHandlersType = new Map([
    [SONG_COMMANDS.MUTE, this.muteSong],
    [SONG_COMMANDS.DECREASE_VOLUME, this.decreaseVolume],
    [SONG_COMMANDS.INCREASE_VOLUME, this.increaseVolume],
    [SONG_COMMANDS.PAUSE, this.pauseSong],
    [SONG_COMMANDS.RESUME, this.resumeSong]
  ]);

  constructor({ voicechannel, chanel, botQueue }: IMusicPlayerBot) {
    this.audioPlayer = botQueue?.audioPlayer || this.subscribeToAudioPlayer();
    this.audioResource = botQueue?.audioResource;
    this.botQueue = botQueue;
    this.voiceChanel = joinVoiceChannel({
      channelId: voicechannel.id,
      guildId: voicechannel.guild.id,
      adapterCreator: voicechannel.guild.voiceAdapterCreator
    });

    this.voiceChanel.subscribe(this.audioPlayer);
    this.chanel = chanel;

    this.audioPlayer.on("stateChange" as any, async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
      if (oldState.status !== AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Idle) {
        this.songs.pop();
        if (!this.songs.length) {
          return this.audioPlayer.stop();
        }
        this.play();
      } else if (
        oldState.status === AudioPlayerStatus.Buffering &&
        newState.status === AudioPlayerStatus.Playing &&
        !this.isSongModal
      ) {
        this.isSongModal = true;
        const data = newState.resource.metadata;
        if (!this.hasMetadata(data)) {
          this.isSongModal = false;
          return;
        }

        this.SongModal(data).catch(() => {
          this.isSongModal = false;
        });
      }
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

  async skipSong(songs: AudioMaker[]) {
    this.queues.set(Math.random(), songs);
    this.songs = songs;
    await this.play();
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

  hasMetadata(override: unknown): override is IMetadata {
    function isSomethingLike(given: unknown): given is Partial<Record<keyof IMetadata, unknown>> {
      return typeof given === "object" && given !== null;
    }

    return (
      isSomethingLike(override) &&
      typeof override.title === "string" &&
      typeof override.url === "string" &&
      typeof override.duration === "number"
    );
  }

  createSongButtons(): ActionRowBuilder<ButtonBuilder>[] {
    const musicButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SONG_COMMANDS.MUTE).setLabel("🔇").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SONG_COMMANDS.DECREASE_VOLUME).setLabel("🔉").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SONG_COMMANDS.INCREASE_VOLUME).setLabel("🔊").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SONG_COMMANDS.PAUSE).setLabel("⏸️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SONG_COMMANDS.RESUME).setLabel("▶️").setStyle(ButtonStyle.Secondary)
    );
    return [musicButtons];
  }

  controlButtonCommands(playingMessage: Message, songInfo: Message<false> | Message<true>, song: AudioMaker): void {
    if (!this.chanel) {
      return;
    }

    const collector: InteractionCollector<any> = this.chanel.createMessageComponentCollector({
      filter: (i: any) => i.isButton() && i.message.id === songInfo.id,
      time: song.songInfo.video_details.durationInSec * 1000
    });

    collector?.on("collect", async (songInteraction) => {
      if (!songInteraction.isButton() || !this.songs.length) return;

      const handler = this.commandHandlers.get(songInteraction.customId as SONG_COMMANDS);
      const queue = bot.queues.get(songInteraction.guild!.id);

      if (!queue) {
        await Reply(songInteraction, "No active queue.");
        return;
      }

      if (handler) {
        await handler(queue, songInteraction);
      }
    });

    setTimeout(() => {
      playingMessage.edit({ components: [] }).catch(console.error);
      playingMessage.delete().catch();
      this.isSongModal = false;
    }, song.songInfo.video_details.durationInSec * 1000 - 100);
  }

  async SongModal(metadata: IMetadata) {
    if (!this.chanel) {
      return;
    }
    const embedMaker = new EmbedMaker();
    const song = (await AudioMaker.setSong(metadata.url))!;

    const songResponse = await this.chanel.send({
      embeds: [embedMaker.getSongModal(song.songInfo)],
      components: this.createSongButtons()
    });

    this.controlButtonCommands(songResponse, songResponse, song);
  }

  async muteSong(queue: MusicPlayerBot, interaction: ButtonInteraction) {
    if (queue.audioResource!.volume?.volume === 0) {
      queue.audioResource!.volume?.setVolume(1);
      await Reply(interaction, "unmuted");
      return;
    }

    queue.audioResource!.volume?.setVolume(0);
    await Reply(interaction, "muted");
  }
  async decreaseVolume(queue: MusicPlayerBot, interaction: ButtonInteraction) {
    const volume = queue.audioResource!.volume;

    if (volume!.volume <= 0) {
      queue.audioResource!.volume?.setVolume(0);
      await Reply(interaction, "muted");
      return;
    }

    queue.audioResource!.volume?.setVolume(volume!.volume - 0.25);
    await Reply(interaction, "decreased volume");
  }
  async increaseVolume(queue: MusicPlayerBot, interaction: ButtonInteraction) {
    const volume = queue.audioResource!.volume;

    if (volume!.volume >= 1) {
      queue.audioResource!.volume?.setVolume(1);
      await Reply(interaction, "volme is at max");
      return;
    }

    queue.audioResource!.volume?.setVolume(volume!.volume + 0.25);
    await Reply(interaction, "increased volume");
  }

  async pauseSong(queue: MusicPlayerBot, interaction: ButtonInteraction) {
    if (queue.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      await Reply(interaction, "There is no song playing to pause.");
      return;
    }

    if (queue.audioPlayer.pause()) {
      await Reply(interaction, "Song paused.");
    }
  }
  async resumeSong(queue: MusicPlayerBot, interaction: ButtonInteraction) {
    if (queue.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      await Reply(interaction, "There is no song playing to resume.");
      return;
    }

    if (queue.audioPlayer.unpause()) {
      await Reply(interaction, "Song resumed.");
    }
  }
}
