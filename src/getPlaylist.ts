import axios from 'axios';
import htmlEntities from 'html-entities';

export default async (url: string) => {
  let playlistObj: {
    playlist: string;
    user: string;
    songs: Array<{
      songName: string;
      singerName: string;
      songDurationSec: number;
      songImageUrl: string;
    }>;
  } = {
    playlist: '',
    user: '',
    songs: []
  };
  let api = "https://api.fabdl.com/apple-music/get?url=";

  console.log("Playlist URL: ", url);
  const { data } = await axios.get(api + url);

  playlistObj.playlist = htmlEntities.decode(data.result.name);
  playlistObj.user = htmlEntities.decode(data.result.owner);

  playlistObj.songs = [];

  data.result.tracks.forEach((track: {
    name: string;
    artists: string;
    duration_ms: number;
    image: string;
  }) => {
    playlistObj.songs.push({
      songName: htmlEntities.decode(track.name),
      singerName: htmlEntities.decode(track.artists),
      songDurationSec: Math.trunc(track.duration_ms / 1000),
      songImageUrl: htmlEntities.decode(track.image),
    });
  });

  return playlistObj;
};
