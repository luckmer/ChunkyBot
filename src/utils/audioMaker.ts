import { createAudioResource } from "@discordjs/voice";
import { InfoData, stream, video_basic_info } from "play-dl";
import { ISong } from "../types/types";

export class AudioMaker {
  song: ISong;
  songInfo: InfoData;

  constructor({ song, songInfo }: { song: ISong; songInfo: InfoData }) {
    this.song = song;
    this.songInfo = songInfo;
  }

  static async setSong(url: string) {
    const songInfo = await video_basic_info(url);
    const song = {
      url: songInfo.video_details.url,
      title: songInfo.video_details?.title ?? "",
      duration: parseInt(songInfo.video_details.durationInSec.toString())
    };
    return new this({ song, songInfo });
  }

  async getAudioResource() {
    const playStream = await stream(this.song.url);
    return createAudioResource(playStream.stream, {
      metadata: this.song,
      inputType: playStream.type,
      inlineVolume: true
    });
  }
}
