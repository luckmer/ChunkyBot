import { ColorResolvable, EmbedBuilder } from "discord.js";
import { InfoData } from "play-dl";
import { formatTime } from "./formatTime";

export class EmbedMaker {
  getSongModal(song: InfoData) {
    const icons = song.video_details.channel?.icons;

    const chanelIcon = icons?.length ? icons[0].url : undefined;
    return new EmbedBuilder()
      .setColor("#7646CD")
      .setTitle(song.video_details.title ?? "--")
      .setURL(song.video_details.channel?.url ?? null)
      .setAuthor({
        name: song.video_details.channel?.name ?? "--",
        iconURL: chanelIcon,
        url: song.video_details.channel?.url
      })

      .setThumbnail(typeof chanelIcon === "undefined" ? null : chanelIcon)
      .addFields({
        name: "Duration",
        value: "[" + "`" + `${formatTime(song.video_details.durationInSec)}` + "`" + "]"
      })
      .setTimestamp();
  }

  getContentModal(content: string) {
    return new EmbedBuilder().setColor("#7646CD").setTitle(content);
  }

  getValueContentModal(title: string) {
    return new EmbedBuilder().setTitle(title).setDescription("Description").setColor("#7646CD");
  }

  getQueueModal(content: string, song: InfoData) {
    const icons = song.video_details.channel?.icons;

    const chanelIcon = icons?.length ? icons[0].url : undefined;

    return new EmbedBuilder()
      .setColor("#7646CD")
      .setTitle(song.video_details.channel?.name ?? "--")
      .setURL(song.video_details.channel?.url ?? null)
      .setAuthor({
        name: content,
        iconURL: chanelIcon
      })
      .addFields({
        name: "Duration",
        value: "[" + "`" + `${formatTime(song.video_details.durationInSec)}` + "`" + "]"
      });
  }
}
