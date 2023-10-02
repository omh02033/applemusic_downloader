const axios = require("axios");

const INFO_URL = "https://slider.kz/vk_auth.php?q=";

export default async (
  songName,
  singerName,
  songDurationSec
) => {
  let query = `${singerName}%20-%20${songName}`.replace(/\s/g, "%20");

  const { data } = await axios.get(encodeURI(INFO_URL + query));

  if (!data["audios"][""] || !data["audios"][""][0].id) {
    return null;
  }

  const songs = data["audios"][""];
  let songDownloadUrl: string | null = null;
  let songTitleFound: string | null = null;

  // Find by duration of song
  for (let i = 0; i < songs.length; i++) {
    if (songDurationSec === songs[i].duration) {
      songDownloadUrl = encodeURI(songs[i].url);
      songTitleFound = songs[i].tit_art.replace(/\?|<|>|\*|"|:|\||\/|\\/g, "");
      break;
    }
  }

  if (songDownloadUrl && songTitleFound) {
    return { songDownloadUrl, songTitleFound };
  }
  return null;
};
