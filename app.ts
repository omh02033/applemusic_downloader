import fs from "fs";
import ProgressBar from "progress";
import axios from "axios";
import NodeID3 from "node-id3";
import prompt from "prompt";

import getPlaylist from "./src/getPlaylist";
import getDownloadLink from "./src/getDownloadLink";

let index = -1;
let songList: Array<any> = [];
let totalSongs = 0;
let notFound: Array<{
  songName: string;
  singerName: string;
  songImageUrl: string;
  songDurationSec: string;
}> = [];

const downloadSong = async (
  songName: string,
  singerName: string,
  songImageUrl: string,
  songDownloadUrl: string,
  songTitleFound: string
) => {
  try {
    let numb = index + 1;
    console.log(`\n(${numb}/${totalSongs}) Starting download: ${songName}`);
    const { data, headers } = await axios({
      method: "GET",
      url: songDownloadUrl,
      responseType: "stream",
    });

    const filepath = `./songs/${songTitleFound}.mp3`;

    const totalLength = headers["content-length"];
    const progressBar = new ProgressBar(
      "-> downloading [:bar] :percent :etas",
      {
        width: 40,
        complete: "=",
        incomplete: " ",
        renderThrottle: 1,
        total: parseInt(totalLength),
      }
    );

    data.on("data", (chunk: any) => progressBar.tick(chunk.length));
    data.on("end", async () => {
      singerName = singerName.replace(/\s{2,10}/g, "");
      console.log("Song Downloaded!");

      let imageFilePath = `./songs/${songTitleFound}.jpg`;

      await downloadImage(songImageUrl, imageFilePath);

      const tags = {
        title: songName,
        artist: singerName,
        APIC: imageFilePath,
      };

      NodeID3.write(tags, filepath);
      console.log("WRITTEN TAGS");

      try {
        fs.unlinkSync(imageFilePath);
      } catch (err) {
        console.error(err);
      }
      startNextSong();
    });

    //for saving in file...
    data.pipe(fs.createWriteStream(filepath));
  } catch (err) {
    console.log("Error:", err);
    startNextSong();
  }
};

const downloadImage = async (songImageUrl: string, imageFilePath: string) => {
  try {
    const response = await axios({
      method: "GET",
      url: songImageUrl,
      responseType: "stream",
    });

    // Create a write stream to save the image
    const writer = fs.createWriteStream(imageFilePath);

    // Pipe the response data into the writer stream
    response.data.pipe(writer);

    // Wait for the image to finish downloading
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log("Image downloaded!");
  } catch (error) {
    console.error("Error downloading image:", error.message);
  }
};

const startNextSong = async () => {
  index += 1;
  if (index === totalSongs) {
    console.log("\n#### ALL SONGS ARE DOWNLOADED!! ####\n");
    console.log("Songs that are not found:-");
    let i = 1;
    console.log(notFound);
    // for (let song of notFound) {
    //   console.log(`${i} - ${song}`);
    //   i += 1;
    // }
    if (i === 1) console.log("None!");
    return;
  }

  const { songName, singerName, songImageUrl, songDurationSec } =
    songList[index];

  const res = await getDownloadLink(songName, singerName, songDurationSec);

  if (res) {
    const { songDownloadUrl, songTitleFound } = res;
    if (fs.existsSync(`./songs/${songTitleFound}.mp3`)) {
      console.log(
        `\n(${
          index + 1
        }/${totalSongs}) - [ SONG ALREADY PRESENT ] : ${songName}`
      );
      startNextSong(); //next song
      return;
    }

    await downloadSong(
      songName,
      singerName,
      songImageUrl,
      songDownloadUrl,
      songTitleFound
    );
  } else {
    console.log(
      `\n(${index + 1}/${totalSongs}) - [ SONG NOT FOUND ] : ${songName}`
    );
    notFound.push({
      songName,
      singerName,
      songImageUrl,
      songDurationSec,
    });
    startNextSong();
  }
};

const start = async () => {
  prompt.start();
  const { Playlist_URL }: { Playlist_URL: string } = await prompt.get([
    "Playlist_URL",
  ]);

  try {
    const res = await getPlaylist(Playlist_URL);
    console.log("Playlist Name: ", res.playlist);
    console.log("User Name: ", res.user);
    console.log("Total songs: ", res.songs.length);

    songList = res.songs;
    totalSongs = res.songs.length;
    console.log(res.songs);

    //create folder
    let dir = "./songs";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    startNextSong();
  } catch (err) {
    console.log(err);
  }
};

start();
