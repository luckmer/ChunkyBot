import { EmbedBuilder } from "discord.js";
import { InfoData } from "play-dl";

export class EmbedMaker {
  getSongModal(song: InfoData) {
    const icons = song.video_details.channel?.icons;

    const chanelIcon = icons?.length ? icons[0].url : undefined;

    return new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(song.video_details.title ?? "--")
      .setURL(song.video_details.channel?.url ?? null)
      .setAuthor({
        name: song.video_details.channel?.name ?? "--",
        iconURL: chanelIcon,
        url: song.video_details.channel?.url
      })
      .setThumbnail(typeof chanelIcon === "undefined" ? null : chanelIcon)
      .setTimestamp();
  }

  getContentModal(content: string) {
    return new EmbedBuilder().setColor(0x0099ff).setTitle(content);
  }

  getQueueModal(content: string, song: InfoData) {
    const icons = song.video_details.channel?.icons;

    const chanelIcon = icons?.length ? icons[0].url : undefined;

    return new EmbedBuilder()
      .setColor(0xff9900)
      .setDescription(content)
      .setTitle(song.video_details.title ?? "--")
      .setURL(song.video_details.channel?.url ?? null)
      .setAuthor({
        name: song.video_details.channel?.name ?? "--",
        iconURL: chanelIcon,
        url: song.video_details.channel?.url
      })
      .setThumbnail(typeof chanelIcon === "undefined" ? null : chanelIcon)
      .setTimestamp();
  }
}
