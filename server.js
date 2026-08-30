const express = require("express");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const { Server } = require("socket.io");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  pingTimeout: 20000,
  pingInterval: 10000
});

app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map();
const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
const EMPTY_ROOM_TTL_MS = 20 * 60 * 1000;

const E = (title, artist, year, level = 2) => ({
  title,
  artist,
  year,
  level,
  region: "estonian"
});

const F = (title, artist, year, level = 2) => ({
  title,
  artist,
  year,
  level,
  region: "foreign"
});

/*
  level:
  1 = peo-/klassikahitt, lihtsam
  2 = tavaline
  3 = raskem / vähem ilmne
*/

const ESTONIAN = [
  E("Saaremaa valss", "Georg Ots", 1951, 1),
  E("Muinaslugu muusikas", "Georg Ots", 1960, 2),
  E("Ei me ette tea", "Heli Lääts", 1964, 3),
  E("Horoskoop", "Heidy Tamme", 1968, 2),
  E("Vana klaver", "Heidy Tamme", 1969, 2),
  E("Korraks vaid", "Vello Orumets", 1970, 2),
  E("Vana vaksal", "Vello Orumets", 1972, 1),
  E("Mis värvi on armastus", "Uno Loop", 1972, 2),
  E("Karikakar", "Marju Kuut", 1976, 2),
  E("Nii kuum on tunne", "Marju Kuut", 1977, 3),
  E("Aeg ei peatu", "Fix", 1980, 1),
  E("Põhjamaa", "Ruja", 1980, 1),
  E("Suudlus läbi jäätunud klaasi", "Ruja", 1980, 1),
  E("Mere lapsed", "Ruja", 1981, 2),
  E("Tsirkus", "Anne Veski", 1983, 1),
  E("Roosiaia kuninganna", "Anne Veski", 1984, 1),
  E("Jätke võtmed väljapoole", "Anne Veski", 1986, 1),
  E("Kikilips", "Ivo Linna", 1987, 1),
  E("Eestlane olen ja eestlaseks jään", "Ivo Linna", 1988, 1),
  E("Koit", "Tõnis Mägi", 1988, 1),
  E("Sind surmani", "Tõnis Mägi", 1988, 2),
  E("Valged roosid", "Anne Veski", 1989, 2),
  E("Oma laulu ei leia ma üles", "Vennaskond", 1991, 2),
  E("Insener Garini hüperboloid", "Vennaskond", 1993, 2),
  E("Mäng", "2 Quick Start", 1994, 1),
  E("Juulikuu lumi", "Terminaator", 1995, 1),
  E("Neiu mustas kleidis", "2 Quick Start", 1995, 1),
  E("Kaelakee hääl", "Maarja-Liis Ilus & Ivo Linna", 1996, 1),
  E("Kingitus", "2 Quick Start", 1996, 2),
  E("Keelatud maa", "Maarja-Liis Ilus", 1997, 2),
  E("Carmen", "Terminaator", 1997, 2),
  E("Romula", "Terminaator", 1997, 2),
  E("17", "Smilers", 1998, 1),
  E("Mõistus on kadunud", "Smilers", 1999, 1),
  E("Ajateenija", "Terminaator", 1999, 2),
  E("Once in a Lifetime", "Ines", 2000, 1),
  E("Everybody", "Tanel Padar, Dave Benton & 2XL", 2001, 1),
  E("Tantsin sinuga taevas", "Smilers", 2001, 2),
  E("Club Kung Fu", "Vanilla Ninja", 2003, 1),
  E("Tough Enough", "Vanilla Ninja", 2003, 2),
  E("Käime katuseid mööda", "Smilers", 2003, 1),
  E("Kuu", "Terminaator", 2003, 2),
  E("Nii vaikseks kõik on jäänud", "Jaan Tätte & Marko Matvere", 2004, 2),
  E("See on see", "Smilers", 2004, 2),
  E("Vihm", "Metsatöll", 2004, 3),
  E("Lendame valguskiirusel", "Traffic", 2007, 2),
  E("Depressiivsed Eesti väikelinnad", "HU?", 2008, 1),
  E("Absoluutselt", "HU?", 2008, 2),
  E("Rändajad", "Urban Symphony", 2009, 1),
  E("Mina jään", "Lenna", 2010, 1),
  E("Rapunzel", "Lenna", 2010, 2),
  E("Siren", "Malcolm Lincoln", 2010, 2),
  E("Kosmos", "Iiris", 2010, 3),
  E("Rockefeller Street", "Getter Jaani", 2011, 1),
  E("Kuula", "Ott Lepland", 2012, 1),
  E("Päästke noored hinged", "Grete Paia", 2013, 2),
  E("Supernoova", "Lenna", 2014, 2),
  E("Parmupillihullus", "Trad.Attack!", 2014, 2),
  E("Für Elise", "Traffic", 2014, 2),
  E("Goodbye to Yesterday", "Elina Born & Stig Rästa", 2015, 1),
  E("Sõit", "Trad.Attack!", 2015, 2),
  E("Sädemed", "Karl-Erik Taukar", 2015, 1),
  E("Sekundiga", "Traffic", 2015, 2),
  E("Young Boy", "NOËP", 2016, 1),
  E("Supersonic", "Laura", 2016, 2),
  E("Segased lood", "Karl-Erik Taukar", 2016, 2),
  E("Verona", "Koit Toome & Laura", 2017, 1),
  E("Lähedal", "Karl-Erik Taukar", 2017, 2),
  E("Miljon sammu", "Karl-Erik Taukar", 2017, 2),
  E("Mina ka", "nublu feat. Reket", 2018, 1),
  E("Tiiu talu tütreke", "nublu", 2018, 1),
  E("Magad vä?", "5MIINUST", 2018, 1),
  E("Rooftop", "NOËP", 2018, 2),
  E("Üks kord veel", "NOËP", 2019, 2),
  E("für Oksana", "nublu feat. gameboy tetris", 2019, 1),
  E("Storm", "Victor Crone", 2019, 1),
  E("Aluspükse", "5MIINUST", 2019, 2),
  E("Paaristõuked", "5MIINUST", 2019, 2),
  E("Universum", "nublu", 2020, 2),
  E(
    "(nendest) narkootikumidest ei tea me (küll) midagi",
    "5MIINUST & Puuluup",
    2024,
    1
  )
];

const FOREIGN = [
  F("Stand by Me", "Ben E. King", 1961, 1),
  F("Be My Baby", "The Ronettes", 1963, 2),
  F("House of the Rising Sun", "The Animals", 1964, 1),
  F("California Dreamin'", "The Mamas & the Papas", 1965, 1),
  F("Paint It, Black", "The Rolling Stones", 1966, 1),
  F("Respect", "Aretha Franklin", 1967, 1),
  F("Mrs. Robinson", "Simon & Garfunkel", 1968, 2),
  F("Space Oddity", "David Bowie", 1969, 1),
  F("Paranoid", "Black Sabbath", 1970, 1),
  F("Imagine", "John Lennon", 1971, 1),
  F("Superstition", "Stevie Wonder", 1972, 1),
  F("Dream On", "Aerosmith", 1973, 2),
  F("Killer Queen", "Queen", 1974, 2),
  F("Bohemian Rhapsody", "Queen", 1975, 1),
  F("Dancing Queen", "ABBA", 1976, 1),
  F("Dreams", "Fleetwood Mac", 1977, 1),
  F("Stayin' Alive", "Bee Gees", 1977, 1),
  F("Heroes", "David Bowie", 1977, 2),
  F("Heart of Glass", "Blondie", 1978, 1),
  F("I Will Survive", "Gloria Gaynor", 1978, 1),
  F("Another Brick in the Wall, Pt. 2", "Pink Floyd", 1979, 1),
  F("Another One Bites the Dust", "Queen", 1980, 1),
  F("Call Me", "Blondie", 1980, 2),
  F("Tainted Love", "Soft Cell", 1981, 1),
  F("Eye of the Tiger", "Survivor", 1982, 1),
  F("Billie Jean", "Michael Jackson", 1983, 1),
  F("Girls Just Want to Have Fun", "Cyndi Lauper", 1983, 1),
  F("Sweet Dreams (Are Made of This)", "Eurythmics", 1983, 1),
  F("Wake Me Up Before You Go-Go", "Wham!", 1984, 1),
  F("Take on Me", "a-ha", 1985, 1),
  F("Kiss", "Prince", 1986, 1),
  F("Faith", "George Michael", 1987, 1),
  F("Like a Prayer", "Madonna", 1989, 1),
  F("Enjoy the Silence", "Depeche Mode", 1990, 1),
  F("Nothing Compares 2 U", "Sinéad O’Connor", 1990, 1),
  F("Smells Like Teen Spirit", "Nirvana", 1991, 1),
  F("Rhythm Is a Dancer", "Snap!", 1992, 1),
  F("Creep", "Radiohead", 1992, 2),
  F("What's Up?", "4 Non Blondes", 1993, 1),
  F("Zombie", "The Cranberries", 1994, 1),
  F("Wonderwall", "Oasis", 1995, 1),
  F("Freed from Desire", "Gala", 1996, 1),
  F("Wannabe", "Spice Girls", 1996, 1),
  F("Torn", "Natalie Imbruglia", 1997, 1),
  F("...Baby One More Time", "Britney Spears", 1998, 1),
  F("No Scrubs", "TLC", 1999, 2),
  F("Yellow", "Coldplay", 2000, 1),
  F("Can't Get You Out of My Head", "Kylie Minogue", 2001, 1),
  F("Complicated", "Avril Lavigne", 2002, 1),
  F("Crazy in Love", "Beyoncé feat. Jay-Z", 2003, 1),
  F("Mr. Brightside", "The Killers", 2003, 1),
  F("Toxic", "Britney Spears", 2003, 1),
  F("Seven Nation Army", "The White Stripes", 2003, 1),
  F("Yeah!", "Usher feat. Lil Jon & Ludacris", 2004, 1),
  F("Feel Good Inc.", "Gorillaz", 2005, 1),
  F("Crazy", "Gnarls Barkley", 2006, 1),
  F("Hips Don't Lie", "Shakira feat. Wyclef Jean", 2006, 1),
  F("Rehab", "Amy Winehouse", 2006, 1),
  F("Umbrella", "Rihanna feat. Jay-Z", 2007, 1),
  F("Poker Face", "Lady Gaga", 2008, 1),
  F("Viva la Vida", "Coldplay", 2008, 1),
  F("Bad Romance", "Lady Gaga", 2009, 1),
  F("Rolling in the Deep", "Adele", 2010, 1),
  F("Somebody That I Used to Know", "Gotye feat. Kimbra", 2011, 1),
  F("Call Me Maybe", "Carly Rae Jepsen", 2011, 1),
  F("Get Lucky", "Daft Punk feat. Pharrell Williams", 2013, 1),
  F("Royals", "Lorde", 2013, 1),
  F("Take Me to Church", "Hozier", 2013, 1),
  F("Happy", "Pharrell Williams", 2013, 1),
  F("Chandelier", "Sia", 2014, 1),
  F("Uptown Funk", "Mark Ronson feat. Bruno Mars", 2014, 1),
  F("Hello", "Adele", 2015, 1),
  F("One Dance", "Drake feat. Wizkid & Kyla", 2016, 1),
  F("Shape of You", "Ed Sheeran", 2017, 1),
  F("Havana", "Camila Cabello feat. Young Thug", 2017, 1),
  F("Shallow", "Lady Gaga & Bradley Cooper", 2018, 1),
  F("bad guy", "Billie Eilish", 2019, 1),
  F("Blinding Lights", "The Weeknd", 2019, 1),
  F("Watermelon Sugar", "Harry Styles", 2019, 1),
  F("Levitating", "Dua Lipa", 2020, 1),
  F("drivers license", "Olivia Rodrigo", 2021, 1),
  F("As It Was", "Harry Styles", 2022, 1),
  F("Flowers", "Miley Cyrus", 2023, 1),
  F("Lose Control", "Teddy Swims", 2023, 2),
  F("Espresso", "Sabrina Carpenter", 2024, 1),
  F("Birds of a Feather", "Billie Eilish", 2024, 1)
];

function now() {
  return Date.now();
}

function cleanName(value) {
  return String(value || "")
    .trim()
    .slice(0, 24);
}

function cleanCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .slice(0, 4);
}

function safeAck(ack, payload) {
  if (typeof ack === "function") {
    ack(payload);
  }
}

function randomToken() {
  return crypto
    .randomBytes(18)
    .toString("base64url");
}

function shuffle(array) {
  const copy = array.slice();

  for (
    let i = copy.length - 1;
    i > 0;
    i -= 1
  ) {
    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      copy[i],
      copy[j]
    ] = [
      copy[j],
      copy[i]
    ];
  }

  return copy;
}

function roomCode() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  do {
    code =
      Array.from(
        { length: 4 },
        () =>
          chars[
            Math.floor(
              Math.random() *
              chars.length
            )
          ]
      ).join("");
  } while (
    rooms.has(code)
  );

  return code;
}

function modePool(
  mode,
  difficulty
) {
  let pool;

  if (
    mode === "estonian"
  ) {
    pool = ESTONIAN;
  } else if (
    mode === "mixed"
  ) {
    pool = [
      ...ESTONIAN,
      ...FOREIGN
    ];
  } else {
    pool = FOREIGN;
  }

  if (
    difficulty === "easy"
  ) {
    return pool.filter(
      song =>
        song.level === 1
    );
  }

  if (
    difficulty === "hard"
  ) {
    return pool.filter(
      song =>
        song.level >= 2
    );
  }

  return pool;
}

function canonicalSong(song) {
  return {
    title:
      song.title,

    artist:
      song.artist,

    year:
      song.year,

    region:
      song.region
  };
}

function songSearchLinks(song) {
  const q =
    encodeURIComponent(
      `${song.title} ${song.artist}`
    );

  return {
    spotify:
      `https://open.spotify.com/search/${q}`,

    youtube:
      `https://www.youtube.com/results?search_query=${q}`
  };
}

function playerByToken(
  room,
  token
) {
  return room.players.find(
    player =>
      player.token === token
  );
}

function connectedPlayers(room) {
  return room.players.filter(
    player =>
      player.connected
  );
}

function chooseHost(room) {
  if (
    room.players.some(
      player =>
        player.token ===
          room.hostToken &&
        player.connected
    )
  ) {
    return;
  }

  const replacement =
    room.players.find(
      player =>
        player.connected
    );

  room.hostToken =
    replacement
      ? replacement.token
      : null;
}

function currentClassicPlayer(room) {
  if (
    !room.players.length
  ) {
    return null;
  }

  for (
    let step = 0;
    step < room.players.length;
    step += 1
  ) {
    const index =
      (
        room.turnIndex +
        step
      ) %
      room.players.length;

    const player =
      room.players[index];

    if (
      player.connected
    ) {
      room.turnIndex =
        index;

      return player;
    }
  }

  return null;
}

function djPlayer(room) {
  const connected =
    connectedPlayers(room);

  if (
    connected.length < 2
  ) {
    return null;
  }

  const active =
    room.gameMode === "classic"
      ? currentClassicPlayer(room)
      : null;

  const start =
    room.roundNumber %
    room.players.length;

  for (
    let step = 0;
    step < room.players.length;
    step += 1
  ) {
    const player =
      room.players[
        (
          start +
          step
        ) %
        room.players.length
      ];

    if (
      !player.connected
    ) {
      continue;
    }

    if (
      active &&
      player.token ===
        active.token
    ) {
      continue;
    }

    return player;
  }

  return connected[0];
}

function eligibleGuessers(room) {
  const dj =
    djPlayer(room);

  if (
    room.gameMode ===
    "classic"
  ) {
    const active =
      currentClassicPlayer(room);

    return (
      active &&
      active.connected
    )
      ? [active]
      : [];
  }

  return connectedPlayers(room)
    .filter(
      player =>
        !dj ||
        player.token !==
          dj.token
    );
}

function timelineSlotCorrect(
  timeline,
  slot,
  year
) {
  const index =
    Math.max(
      0,
      Math.min(
        Number(slot),
        timeline.length
      )
    );

  if (
    !Number.isInteger(index)
  ) {
    return false;
  }

  const left =
    index === 0
      ? -Infinity
      : timeline[
          index - 1
        ].year;

  const right =
    index ===
      timeline.length
      ? Infinity
      : timeline[index].year;

  return (
    year >= left &&
    year <= right
  );
}

function insertSongSortedAt(
  timeline,
  slot,
  song
) {
  const index =
    Math.max(
      0,
      Math.min(
        Number(slot),
        timeline.length
      )
    );

  timeline.splice(
    index,
    0,
    canonicalSong(song)
  );
}

function makeDeck(room) {
  const pool =
    modePool(
      room.musicMode,
      room.difficulty
    );

  const recent =
    new Set(
      room.recentSongKeys
        .slice(-20)
    );

  const fresh =
    pool.filter(
      song =>
        !recent.has(
          `${song.artist}|${song.title}`
        )
    );

  return shuffle(
    fresh.length >= 10
      ? fresh
      : pool
  );
}

function drawSong(room) {
  if (
    !room.deck.length
  ) {
    room.deck =
      makeDeck(room);
  }

  const song =
    room.deck.pop();

  if (
    !song
  ) {
    throw new Error(
      "Song pool is empty."
    );
  }

  room.recentSongKeys.push(
    `${song.artist}|${song.title}`
  );

  if (
    room.recentSongKeys.length >
    40
  ) {
    room.recentSongKeys.shift();
  }

  return song;
}

function startRound(room) {
  clearTimeout(
    room.autoTimer
  );

  room.autoTimer =
    null;

  room.roundNumber +=
    1;

  room.roundId =
    randomToken();

  room.currentSong =
    drawSong(room);

  room.guesses =
    {};

  room.reveal =
    null;

  room.revealStartedAt =
    null;

  room.phase =
    "guessing";

  room.lastActiveAt =
    now();
}

function startGame(room) {
  clearTimeout(
    room.autoTimer
  );

  room.autoTimer =
    null;

  const pool =
    modePool(
      room.musicMode,
      room.difficulty
    );

  const need =
    room.players.length + 1;

  if (
    pool.length < need
  ) {
    throw new Error(
      "Not enough songs for this configuration."
    );
  }

  room.started =
    true;

  room.finished =
    false;

  room.winnerToken =
    null;

  room.turnIndex =
    0;

  room.roundNumber =
    0;

  room.roundId =
    null;

  room.deck =
    shuffle(pool);

  room.recentSongKeys =
    [];

  room.guesses =
    {};

  room.reveal =
    null;

  room.phase =
    "setup";

  room.players.forEach(
    player => {
      player.timeline = [
        canonicalSong(
          drawSong(room)
        )
      ];
    }
  );

  startRound(room);
}

function revealRound(room) {
  if (
    room.phase !== "guessing" ||
    !room.currentSong
  ) {
    return;
  }

  const guessers =
    eligibleGuessers(room);

  const results =
    [];

  for (
    const player of guessers
  ) {
    const guess =
      room.guesses[
        player.token
      ];

    if (
      !guess
    ) {
      continue;
    }

    const correct =
      timelineSlotCorrect(
        player.timeline,
        guess.slot,
        room.currentSong.year
      );

    if (
      correct
    ) {
      insertSongSortedAt(
        player.timeline,
        guess.slot,
        room.currentSong
      );
    }

    results.push({
      token:
        player.token,

      name:
        player.name,

      correct,

      slot:
        guess.slot
    });
  }

  room.reveal = {
    song:
      canonicalSong(
        room.currentSong
      ),

    results
  };

  room.revealStartedAt =
    now();

  room.phase =
    "reveal";

  const winners =
    room.players
      .filter(
        player =>
          player.timeline.length >=
          room.targetCards
      )
      .sort(
        (a,b) =>
          b.timeline.length -
          a.timeline.length
      );

  if (
    winners.length
  ) {
    room.finished =
      true;

    room.winnerToken =
      winners[0].token;

    room.phase =
      "finished";
  }

  emitRoom(room);

  if (
    room.autoNext &&
    !room.finished
  ) {
    room.autoTimer =
      setTimeout(
        () => {
          advanceRound(room);
        },
        room.revealSeconds *
        1000
      );
  }
}

function advanceRound(room) {
  if (
    room.finished
  ) {
    return;
  }

  clearTimeout(
    room.autoTimer
  );

  room.autoTimer =
    null;

  if (
    room.gameMode ===
    "classic"
  ) {
    room.turnIndex =
      (
        room.turnIndex +
        1
      ) %
      room.players.length;

    currentClassicPlayer(room);
  }

  startRound(room);

  emitRoom(room);
}

function publicState(
  room,
  playerToken
) {
  const me =
    playerByToken(
      room,
      playerToken
    );

  const active =
    room.gameMode ===
      "classic"
      ? currentClassicPlayer(room)
      : null;

  const dj =
    djPlayer(room);

  const guessers =
    eligibleGuessers(room);

  const isGuesser =
    guessers.some(
      player =>
        player.token ===
        playerToken
    );

  const myGuess =
    room.guesses[
      playerToken
    ] || null;

  const djSecret =
    dj &&
    dj.token ===
      playerToken &&
    room.currentSong
      ? {
          song:
            canonicalSong(
              room.currentSong
            ),

          links:
            songSearchLinks(
              room.currentSong
            )
        }
      : null;

  return {
    code:
      room.code,

    started:
      room.started,

    finished:
      room.finished,

    phase:
      room.phase,

    hostToken:
      room.hostToken,

    winnerToken:
      room.winnerToken,

    musicMode:
      room.musicMode,

    difficulty:
      room.difficulty,

    gameMode:
      room.gameMode,

    targetCards:
      room.targetCards,

    autoNext:
      room.autoNext,

    revealSeconds:
      room.revealSeconds,

    roundNumber:
      room.roundNumber,

    roundId:
      room.roundId,

    activePlayerToken:
      active
        ? active.token
        : null,

    djToken:
      dj
        ? dj.token
        : null,

    isGuesser,

    myGuess,

    waitingFor:
      guessers
        .filter(
          player =>
            !room.guesses[
              player.token
            ]
        )
        .map(
          player =>
            player.name
        ),

    reveal:
      room.reveal,

    djSecret,

    players:
      room.players.map(
        player => ({
          token:
            player.token,

          name:
            player.name,

          connected:
            player.connected,

          isHost:
            player.token ===
            room.hostToken,

          timelineCount:
            player.timeline.length
        })
      ),

    me:
      me
        ? {
            token:
              me.token,

            name:
              me.name,

            timeline:
              me.timeline
          }
        : null
  };
}

function emitRoom(room) {
  room.lastActiveAt =
    now();

  for (
    const player of
      room.players
  ) {
    if (
      player.socketId
    ) {
      io
        .to(
          player.socketId
        )
        .emit(
          "state",
          publicState(
            room,
            player.token
          )
        );
    }
  }
}

function joinSocketToPlayer(
  socket,
  room,
  player
) {
  if (
    player.socketId &&
    player.socketId !==
      socket.id
  ) {
    const oldSocket =
      io.sockets.sockets.get(
        player.socketId
      );

    if (
      oldSocket
    ) {
      oldSocket.disconnect(
        true
      );
    }
  }

  player.socketId =
    socket.id;

  player.connected =
    true;

  player.lastSeenAt =
    now();

  socket.data.roomCode =
    room.code;

  socket.data.playerToken =
    player.token;

  socket.join(
    room.code
  );
}

function roomFromSocket(socket) {
  const room =
    rooms.get(
      socket.data.roomCode
    );

  if (
    !room
  ) {
    return null;
  }

  const player =
    playerByToken(
      room,
      socket.data.playerToken
    );

  if (
    !player
  ) {
    return null;
  }

  return {
    room,
    player
  };
}

function maybeAutoReveal(room) {
  if (
    room.phase !==
    "guessing"
  ) {
    return;
  }

  const guessers =
    eligibleGuessers(room);

  if (
    !guessers.length
  ) {
    return;
  }

  const allSubmitted =
    guessers.every(
      player =>
        Boolean(
          room.guesses[
            player.token
          ]
        )
    );

  if (
    allSubmitted
  ) {
    revealRound(room);
  }
}

io.on(
  "connection",
  socket => {

    socket.on(
      "createRoom",
      (
        {
          name,
          playerToken
        } = {},
        ack
      ) => {

        const playerName =
          cleanName(name);

        if (
          !playerName
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Sisesta nimi."
            }
          );
        }

        const code =
          roomCode();

        const token =
          String(
            playerToken || ""
          ).trim() ||
          randomToken();

        const room = {
          code,

          createdAt:
            now(),

          lastActiveAt:
            now(),

          hostToken:
            token,

          started:
            false,

          finished:
            false,

          phase:
            "lobby",

          winnerToken:
            null,

          musicMode:
            "foreign",

          difficulty:
            "normal",

          gameMode:
            "classic",

          targetCards:
            8,

          autoNext:
            false,

          revealSeconds:
            8,

          roundNumber:
            0,

          roundId:
            null,

          turnIndex:
            0,

          currentSong:
            null,

          deck:
            [],

          recentSongKeys:
            [],

          guesses:
            {},

          reveal:
            null,

          revealStartedAt:
            null,

          autoTimer:
            null,

          players:[
            {
              token,

              socketId:
                socket.id,

              name:
                playerName,

              connected:
                true,

              lastSeenAt:
                now(),

              timeline:
                []
            }
          ]
        };

        rooms.set(
          code,
          room
        );

        joinSocketToPlayer(
          socket,
          room,
          room.players[0]
        );

        safeAck(
          ack,
          {
            ok:true,
            code,
            playerToken:
              token
          }
        );

        emitRoom(room);
      }
    );

    socket.on(
      "joinRoom",
      (
        {
          name,
          code,
          playerToken
        } = {},
        ack
      ) => {

        const playerName =
          cleanName(name);

        const room =
          rooms.get(
            cleanCode(code)
          );

        if (
          !playerName
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Sisesta nimi."
            }
          );
        }

        if (
          !room
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Sellist tuba ei leitud."
            }
          );
        }

        const requestedToken =
          String(
            playerToken || ""
          ).trim();

        if (
          requestedToken
        ) {
          const existing =
            playerByToken(
              room,
              requestedToken
            );

          if (
            existing
          ) {
            existing.name =
              playerName ||
              existing.name;

            joinSocketToPlayer(
              socket,
              room,
              existing
            );

            chooseHost(room);

            safeAck(
              ack,
              {
                ok:true,
                code:
                  room.code,
                playerToken:
                  existing.token,
                resumed:true
              }
            );

            return emitRoom(
              room
            );
          }
        }

        if (
          room.started
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Mäng on juba alanud. Kasuta sama seadet või vana liitumislinki, et oma kohta taastada."
            }
          );
        }

        if (
          room.players.length >= 8
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Tuba on täis (max 8)."
            }
          );
        }

        if (
          room.players.some(
            player =>
              player.name
                .toLowerCase() ===
              playerName
                .toLowerCase()
          )
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "See nimi on juba kasutusel."
            }
          );
        }

        const token =
          requestedToken ||
          randomToken();

        const player = {
          token,

          socketId:
            socket.id,

          name:
            playerName,

          connected:
            true,

          lastSeenAt:
            now(),

          timeline:
            []
        };

        room.players.push(
          player
        );

        joinSocketToPlayer(
          socket,
          room,
          player
        );

        chooseHost(room);

        safeAck(
          ack,
          {
            ok:true,
            code:
              room.code,
            playerToken:
              token,
            resumed:false
          }
        );

        emitRoom(room);
      }
    );

    socket.on(
      "resumeRoom",
      (
        {
          code,
          playerToken
        } = {},
        ack
      ) => {

        const room =
          rooms.get(
            cleanCode(code)
          );

        const token =
          String(
            playerToken || ""
          ).trim();

        if (
          !room ||
          !token
        ) {
          return safeAck(
            ack,
            {ok:false}
          );
        }

        const player =
          playerByToken(
            room,
            token
          );

        if (
          !player
        ) {
          return safeAck(
            ack,
            {ok:false}
          );
        }

        joinSocketToPlayer(
          socket,
          room,
          player
        );

        chooseHost(room);

        safeAck(
          ack,
          {
            ok:true,
            name:
              player.name,
            code:
              room.code,
            playerToken:
              player.token
          }
        );

        emitRoom(room);
      }
    );

    socket.on(
      "settings",
      (
        payload = {},
        ack
      ) => {

        const context =
          roomFromSocket(
            socket
          );

        if (
          !context
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Tuba puudub."
            }
          );
        }

        const {
          room,
          player
        } = context;

        if (
          room.hostToken !==
          player.token
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Ainult mängujuht saab seadeid muuta."
            }
          );
        }

        if (
          room.started
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Mäng on juba alanud."
            }
          );
        }

        if (
          [
            "estonian",
            "foreign",
            "mixed"
          ].includes(
            payload.musicMode
          )
        ) {
          room.musicMode =
            payload.musicMode;
        }

        if (
          [
            "easy",
            "normal",
            "hard"
          ].includes(
            payload.difficulty
          )
        ) {
          room.difficulty =
            payload.difficulty;
        }

        if (
          [
            "classic",
            "everyone"
          ].includes(
            payload.gameMode
          )
        ) {
          room.gameMode =
            payload.gameMode;
        }

        const target =
          Number(
            payload.targetCards
          );

        if (
          Number.isInteger(
            target
          )
        ) {
          room.targetCards =
            Math.max(
              5,
              Math.min(
                15,
                target
              )
            );
        }

        room.autoNext =
          Boolean(
            payload.autoNext
          );

        const revealSeconds =
          Number(
            payload.revealSeconds
          );

        if (
          Number.isInteger(
            revealSeconds
          )
        ) {
          room.revealSeconds =
            Math.max(
              5,
              Math.min(
                20,
                revealSeconds
              )
            );
        }

        safeAck(
          ack,
          {ok:true}
        );

        emitRoom(room);
      }
    );

    socket.on(
      "startGame",
      (
        _payload,
        ack
      ) => {

        const context =
          roomFromSocket(
            socket
          );

        if (
          !context
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Tuba puudub."
            }
          );
        }

        const {
          room,
          player
        } = context;

        if (
          room.hostToken !==
          player.token
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Ainult mängujuht saab alustada."
            }
          );
        }

        if (
          connectedPlayers(
            room
          ).length < 2
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Mänguks on vaja vähemalt 2 ühendatud mängijat."
            }
          );
        }

        try {
          startGame(room);

          safeAck(
            ack,
            {ok:true}
          );

          emitRoom(room);
        } catch (
          error
        ) {
          console.error(
            error
          );

          safeAck(
            ack,
            {
              ok:false,
              error:
                "Mängu käivitamine ebaõnnestus."
            }
          );
        }
      }
    );

    socket.on(
      "submitGuess",
      (
        {
          roundId,
          slot
        } = {},
        ack
      ) => {

        const context =
          roomFromSocket(
            socket
          );

        if (
          !context
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Tuba puudub."
            }
          );
        }

        const {
          room,
          player
        } = context;

        if (
          !room.started ||
          room.finished ||
          room.phase !==
            "guessing"
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Praegu ei saa vastata."
            }
          );
        }

        if (
          roundId !==
          room.roundId
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "See voor on juba vahetunud."
            }
          );
        }

        const guessers =
          eligibleGuessers(
            room
          );

        if (
          !guessers.some(
            guesser =>
              guesser.token ===
              player.token
          )
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Selles voorus oled DJ või ootad oma korda."
            }
          );
        }

        if (
          room.guesses[
            player.token
          ]
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Vastus on juba lukustatud."
            }
          );
        }

        const index =
          Number(slot);

        if (
          !Number.isInteger(
            index
          ) ||
          index < 0 ||
          index >
            player.timeline.length
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Vigane koht ajajoonel."
            }
          );
        }

        room.guesses[
          player.token
        ] = {
          slot:
            index,

          submittedAt:
            now()
        };

        safeAck(
          ack,
          {ok:true}
        );

        emitRoom(room);

        maybeAutoReveal(
          room
        );
      }
    );

    socket.on(
      "revealNow",
      (
        _payload,
        ack
      ) => {

        const context =
          roomFromSocket(
            socket
          );

        if (
          !context
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Tuba puudub."
            }
          );
        }

        const {
          room,
          player
        } = context;

        if (
          room.hostToken !==
          player.token
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Ainult mängujuht saab vooru avada."
            }
          );
        }

        if (
          room.phase !==
          "guessing"
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Voor ei ole vastamisfaasis."
            }
          );
        }

        const guessers =
          eligibleGuessers(
            room
          );

        if (
          !guessers.some(
            guesser =>
              room.guesses[
                guesser.token
              ]
          )
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Vähemalt üks vastus peab enne olemas olema."
            }
          );
        }

        revealRound(room);

        safeAck(
          ack,
          {ok:true}
        );
      }
    );

    socket.on(
      "nextRound",
      (
        _payload,
        ack
      ) => {

        const context =
          roomFromSocket(
            socket
          );

        if (
          !context
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Tuba puudub."
            }
          );
        }

        const {
          room,
          player
        } = context;

        if (
          room.hostToken !==
          player.token
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Ainult mängujuht saab jätkata."
            }
          );
        }

        if (
          room.finished
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Mäng on lõppenud."
            }
          );
        }

        if (
          room.phase !==
          "reveal"
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Esmalt tuleb voor avada."
            }
          );
        }

        advanceRound(room);

        safeAck(
          ack,
          {ok:true}
        );
      }
    );

    socket.on(
      "restart",
      (
        _payload,
        ack
      ) => {

        const context =
          roomFromSocket(
            socket
          );

        if (
          !context
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Tuba puudub."
            }
          );
        }

        const {
          room,
          player
        } = context;

        if (
          room.hostToken !==
          player.token
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Ainult mängujuht saab uuesti alustada."
            }
          );
        }

        if (
          connectedPlayers(
            room
          ).length < 2
        ) {
          return safeAck(
            ack,
            {
              ok:false,
              error:
                "Uueks mänguks on vaja vähemalt 2 ühendatud mängijat."
            }
          );
        }

        try {
          startGame(room);

          safeAck(
            ack,
            {ok:true}
          );

          emitRoom(room);
        } catch (
          error
        ) {
          console.error(
            error
          );

          safeAck(
            ack,
            {
              ok:false,
              error:
                "Uue mängu käivitamine ebaõnnestus."
            }
          );
        }
      }
    );

    socket.on(
      "disconnect",
      () => {

        const context =
          roomFromSocket(
            socket
          );

        if (
          !context
        ) {
          return;
        }

        const {
          room,
          player
        } = context;

        if (
          player.socketId ===
          socket.id
        ) {
          player.connected =
            false;

          player.socketId =
            null;

          player.lastSeenAt =
            now();
        }

        chooseHost(room);

        emitRoom(room);
      }
    );
  }
);

setInterval(
  () => {
    const currentTime =
      now();

    for (
      const [
        code,
        room
      ] of rooms.entries()
    ) {
      const noneConnected =
        connectedPlayers(
          room
        ).length === 0;

      const age =
        currentTime -
        room.lastActiveAt;

      if (
        (
          noneConnected &&
          age >
            EMPTY_ROOM_TTL_MS
        ) ||
        age >
          ROOM_TTL_MS
      ) {
        clearTimeout(
          room.autoTimer
        );

        rooms.delete(
          code
        );
      }
    }
  },
  60 * 1000
);

const PORT =
  process.env.PORT ||
  3000;

httpServer.listen(
  PORT,
  () => {
    console.log(
      `kõrva(n)uss v4 running on port ${PORT}`
    );
  }
);
