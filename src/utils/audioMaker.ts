import { createAudioResource } from "@discordjs/voice";
import { stream, video_basic_info } from "play-dl";

export interface ISong {
  url: string;
  title: string;
  duration: number;
}

export class AudioMaker {
  song: ISong;

  constructor(url: any) {
    this.song = url;
  }

  static async setSong(url: string) {
    const songInfo = await video_basic_info(url);
    return new this({
      url: songInfo.video_details.url,
      title: songInfo.video_details?.title ?? "",
      duration: parseInt(songInfo.video_details.durationInSec.toString())
    });
  }

  getSong() {
    return this.song;
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
