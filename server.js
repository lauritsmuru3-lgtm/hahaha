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

app.use(
  express.json({
    limit: "10kb"
  })
);

app.use(
  express.static(
    path.join(
      __dirname,
      "public"
    )
  )
);

const rooms =
  new Map();

const spotifyCache =
  new Map();

const ROOM_TTL_MS =
  6 *
  60 *
  60 *
  1000;

const EMPTY_ROOM_TTL_MS =
  20 *
  60 *
  1000;

let spotifyAccessToken =
  null;

let spotifyAccessTokenExpiresAt =
  0;


/* =========================================================
   SONGS
========================================================= */

const E = (
  title,
  artist,
  year,
  level = 2
) => ({
  title,
  artist,
  year,
  level,
  region: "estonian"
});


const F = (
  title,
  artist,
  year,
  level = 2
) => ({
  title,
  artist,
  year,
  level,
  region: "foreign"
});


const ESTONIAN = [

  E(
    "Saaremaa valss",
    "Georg Ots",
    1951,
    1
  ),

  E(
    "Muinaslugu muusikas",
    "Georg Ots",
    1960,
    2
  ),

  E(
    "Ei me ette tea",
    "Heli Lääts",
    1964,
    3
  ),

  E(
    "Horoskoop",
    "Heidy Tamme",
    1968,
    2
  ),

  E(
    "Vana klaver",
    "Heidy Tamme",
    1969,
    2
  ),

  E(
    "Korraks vaid",
    "Vello Orumets",
    1970,
    2
  ),

  E(
    "Vana vaksal",
    "Vello Orumets",
    1972,
    1
  ),

  E(
    "Mis värvi on armastus",
    "Uno Loop",
    1972,
    2
  ),

  E(
    "Karikakar",
    "Marju Kuut",
    1976,
    2
  ),

  E(
    "Nii kuum on tunne",
    "Marju Kuut",
    1977,
    3
  ),

  E(
    "Aeg ei peatu",
    "Fix",
    1980,
    1
  ),

  E(
    "Põhjamaa",
    "Ruja",
    1980,
    1
  ),

  E(
    "Suudlus läbi jäätunud klaasi",
    "Ruja",
    1980,
    1
  ),

  E(
    "Mere lapsed",
    "Ruja",
    1981,
    2
  ),

  E(
    "Tsirkus",
    "Anne Veski",
    1983,
    1
  ),

  E(
    "Roosiaia kuninganna",
    "Anne Veski",
    1984,
    1
  ),

  E(
    "Jätke võtmed väljapoole",
    "Anne Veski",
    1986,
    1
  ),

  E(
    "Kikilips",
    "Ivo Linna",
    1987,
    1
  ),

  E(
    "Eestlane olen ja eestlaseks jään",
    "Ivo Linna",
    1988,
    1
  ),

  E(
    "Koit",
    "Tõnis Mägi",
    1988,
    1
  ),

  E(
    "Sind surmani",
    "Tõnis Mägi",
    1988,
    2
  ),

  E(
    "Valged roosid",
    "Anne Veski",
    1989,
    2
  ),

  E(
    "Oma laulu ei leia ma üles",
    "Vennaskond",
    1991,
    2
  ),

  E(
    "Insener Garini hüperboloid",
    "Vennaskond",
    1993,
    2
  ),

  E(
    "Mäng",
    "2 Quick Start",
    1994,
    1
  ),

  E(
    "Juulikuu lumi",
    "Terminaator",
    1995,
    1
  ),

  E(
    "Neiu mustas kleidis",
    "2 Quick Start",
    1995,
    1
  ),

  E(
    "Kaelakee hääl",
    "Maarja-Liis Ilus & Ivo Linna",
    1996,
    1
  ),

  E(
    "Kingitus",
    "2 Quick Start",
    1996,
    2
  ),

  E(
    "Keelatud maa",
    "Maarja-Liis Ilus",
    1997,
    2
  ),

  E(
    "Carmen",
    "Terminaator",
    1997,
    2
  ),

  E(
    "Romula",
    "Terminaator",
    1997,
    2
  ),

  E(
    "17",
    "Smilers",
    1998,
    1
  ),

  E(
    "Mõistus on kadunud",
    "Smilers",
    1999,
    1
  ),

  E(
    "Ajateenija",
    "Terminaator",
    1999,
    2
  ),

  E(
    "Once in a Lifetime",
    "Ines",
    2000,
    1
  ),

  E(
    "Everybody",
    "Tanel Padar, Dave Benton & 2XL",
    2001,
    1
  ),

  E(
    "Tantsin sinuga taevas",
    "Smilers",
    2001,
    2
  ),

  E(
    "Club Kung Fu",
    "Vanilla Ninja",
    2003,
    1
  ),

  E(
    "Tough Enough",
    "Vanilla Ninja",
    2003,
    2
  ),

  E(
    "Käime katuseid mööda",
    "Smilers",
    2003,
    1
  ),

  E(
    "Kuu",
    "Terminaator",
    2003,
    2
  ),

  E(
    "Nii vaikseks kõik on jäänud",
    "Jaan Tätte & Marko Matvere",
    2004,
    2
  ),

  E(
    "See on see",
    "Smilers",
    2004,
    2
  ),

  E(
    "Vihm",
    "Metsatöll",
    2004,
    3
  ),

  E(
    "Lendame valguskiirusel",
    "Traffic",
    2007,
    2
  ),

  E(
    "Depressiivsed Eesti väikelinnad",
    "HU?",
    2008,
    1
  ),

  E(
    "Absoluutselt",
    "HU?",
    2008,
    2
  ),

  E(
    "Rändajad",
    "Urban Symphony",
    2009,
    1
  ),

  E(
    "Mina jään",
    "Lenna",
    2010,
    1
  ),

  E(
    "Rapunzel",
    "Lenna",
    2010,
    2
  ),

  E(
    "Siren",
    "Malcolm Lincoln",
    2010,
    2
  ),

  E(
    "Kosmos",
    "Iiris",
    2010,
    3
  ),

  E(
    "Rockefeller Street",
    "Getter Jaani",
    2011,
    1
  ),

  E(
    "Kuula",
    "Ott Lepland",
    2012,
    1
  ),

  E(
    "Päästke noored hinged",
    "Grete Paia",
    2013,
    2
  ),

  E(
    "Supernoova",
    "Lenna",
    2014,
    2
  ),

  E(
    "Parmupillihullus",
    "Trad.Attack!",
    2014,
    2
  ),

  E(
    "Für Elise",
    "Traffic",
    2014,
    2
  ),

  E(
    "Goodbye to Yesterday",
    "Elina Born & Stig Rästa",
    2015,
    1
  ),

  E(
    "Sõit",
    "Trad.Attack!",
    2015,
    2
  ),

  E(
    "Sädemed",
    "Karl-Erik Taukar",
    2015,
    1
  ),

  E(
    "Sekundiga",
    "Traffic",
    2015,
    2
  ),

  E(
    "Young Boy",
    "NOËP",
    2016,
    1
  ),

  E(
    "Supersonic",
    "Laura",
    2016,
    2
  ),

  E(
    "Segased lood",
    "Karl-Erik Taukar",
    2016,
    2
  ),

  E(
    "Verona",
    "Koit Toome & Laura",
    2017,
    1
  ),

  E(
    "Lähedal",
    "Karl-Erik Taukar",
    2017,
    2
  ),

  E(
    "Miljon sammu",
    "Karl-Erik Taukar",
    2017,
    2
  ),

  E(
    "Mina ka",
    "nublu feat. Reket",
    2018,
    1
  ),

  E(
    "Tiiu talu tütreke",
    "nublu",
    2018,
    1
  ),

  E(
    "Magad vä?",
    "5MIINUST",
    2018,
    1
  ),

  E(
    "Rooftop",
    "NOËP",
    2018,
    2
  ),

  E(
    "Üks kord veel",
    "NOËP",
    2019,
    2
  ),

  E(
    "für Oksana",
    "nublu feat. gameboy tetris",
    2019,
    1
  ),

  E(
    "Storm",
    "Victor Crone",
    2019,
    1
  ),

  E(
    "Aluspükse",
    "5MIINUST",
    2019,
    2
  ),

  E(
    "Paaristõuked",
    "5MIINUST",
    2019,
    2
  ),

  E(
    "Universum",
    "nublu",
    2020,
    2
  ),

  E(
    "(nendest) narkootikumidest ei tea me (küll) midagi",
    "5MIINUST & Puuluup",
    2024,
    1
  )
];


const FOREIGN = [

  F(
    "Stand by Me",
    "Ben E. King",
    1961,
    1
  ),

  F(
    "Be My Baby",
    "The Ronettes",
    1963,
    2
  ),

  F(
    "House of the Rising Sun",
    "The Animals",
    1964,
    1
  ),

  F(
    "California Dreamin'",
    "The Mamas & the Papas",
    1965,
    1
  ),

  F(
    "Paint It, Black",
    "The Rolling Stones",
    1966,
    1
  ),

  F(
    "Respect",
    "Aretha Franklin",
    1967,
    1
  ),

  F(
    "Mrs. Robinson",
    "Simon & Garfunkel",
    1968,
    2
  ),

  F(
    "Space Oddity",
    "David Bowie",
    1969,
    1
  ),

  F(
    "Paranoid",
    "Black Sabbath",
    1970,
    1
  ),

  F(
    "Imagine",
    "John Lennon",
    1971,
    1
  ),

  F(
    "Superstition",
    "Stevie Wonder",
    1972,
    1
  ),

  F(
    "Dream On",
    "Aerosmith",
    1973,
    2
  ),

  F(
    "Killer Queen",
    "Queen",
    1974,
    2
  ),

  F(
    "Bohemian Rhapsody",
    "Queen",
    1975,
    1
  ),

  F(
    "Dancing Queen",
    "ABBA",
    1976,
    1
  ),

  F(
    "Dreams",
    "Fleetwood Mac",
    1977,
    1
  ),

  F(
    "Stayin' Alive",
    "Bee Gees",
    1977,
    1
  ),

  F(
    "Heroes",
    "David Bowie",
    1977,
    2
  ),

  F(
    "Heart of Glass",
    "Blondie",
    1978,
    1
  ),

  F(
    "I Will Survive",
    "Gloria Gaynor",
    1978,
    1
  ),

  F(
    "Another Brick in the Wall, Pt. 2",
    "Pink Floyd",
    1979,
    1
  ),

  F(
    "Another One Bites the Dust",
    "Queen",
    1980,
    1
  ),

  F(
    "Call Me",
    "Blondie",
    1980,
    2
  ),

  F(
    "Tainted Love",
    "Soft Cell",
    1981,
    1
  ),

  F(
    "Eye of the Tiger",
    "Survivor",
    1982,
    1
  ),

  F(
    "Billie Jean",
    "Michael Jackson",
    1983,
    1
  ),

  F(
    "Girls Just Want to Have Fun",
    "Cyndi Lauper",
    1983,
    1
  ),

  F(
    "Sweet Dreams (Are Made of This)",
    "Eurythmics",
    1983,
    1
  ),

  F(
    "Wake Me Up Before You Go-Go",
    "Wham!",
    1984,
    1
  ),

  F(
    "Take on Me",
    "a-ha",
    1985,
    1
  ),

  F(
    "Kiss",
    "Prince",
    1986,
    1
  ),

  F(
    "Faith",
    "George Michael",
    1987,
    1
  ),

  F(
    "Like a Prayer",
    "Madonna",
    1989,
    1
  ),

  F(
    "Enjoy the Silence",
    "Depeche Mode",
    1990,
    1
  ),

  F(
    "Nothing Compares 2 U",
    "Sinéad O’Connor",
    1990,
    1
  ),

  F(
    "Smells Like Teen Spirit",
    "Nirvana",
    1991,
    1
  ),

  F(
    "Rhythm Is a Dancer",
    "Snap!",
    1992,
    1
  ),

  F(
    "Creep",
    "Radiohead",
    1992,
    2
  ),

  F(
    "What's Up?",
    "4 Non Blondes",
    1993,
    1
  ),

  F(
    "Zombie",
    "The Cranberries",
    1994,
    1
  ),

  F(
    "Wonderwall",
    "Oasis",
    1995,
    1
  ),

  F(
    "Freed from Desire",
    "Gala",
    1996,
    1
  ),

  F(
    "Wannabe",
    "Spice Girls",
    1996,
    1
  ),

  F(
    "Torn",
    "Natalie Imbruglia",
    1997,
    1
  ),

  F(
    "...Baby One More Time",
    "Britney Spears",
    1998,
    1
  ),

  F(
    "No Scrubs",
    "TLC",
    1999,
    2
  ),

  F(
    "Yellow",
    "Coldplay",
    2000,
    1
  ),

  F(
    "Can't Get You Out of My Head",
    "Kylie Minogue",
    2001,
    1
  ),

  F(
    "Complicated",
    "Avril Lavigne",
    2002,
    1
  ),

  F(
    "Crazy in Love",
    "Beyoncé feat. Jay-Z",
    2003,
    1
  ),

  F(
    "Mr. Brightside",
    "The Killers",
    2003,
    1
  ),

  F(
    "Toxic",
    "Britney Spears",
    2003,
    1
  ),

  F(
    "Seven Nation Army",
    "The White Stripes",
    2003,
    1
  ),

  F(
    "Yeah!",
    "Usher feat. Lil Jon & Ludacris",
    2004,
    1
  ),

  F(
    "Feel Good Inc.",
    "Gorillaz",
    2005,
    1
  ),

  F(
    "Crazy",
    "Gnarls Barkley",
    2006,
    1
  ),

  F(
    "Hips Don't Lie",
    "Shakira feat. Wyclef Jean",
    2006,
    1
  ),

  F(
    "Rehab",
    "Amy Winehouse",
    2006,
    1
  ),

  F(
    "Umbrella",
    "Rihanna feat. Jay-Z",
    2007,
    1
  ),

  F(
    "Poker Face",
    "Lady Gaga",
    2008,
    1
  ),

  F(
    "Viva la Vida",
    "Coldplay",
    2008,
    1
  ),

  F(
    "Bad Romance",
    "Lady Gaga",
    2009,
    1
  ),

  F(
    "Rolling in the Deep",
    "Adele",
    2010,
    1
  ),

  F(
    "Somebody That I Used to Know",
    "Gotye feat. Kimbra",
    2011,
    1
  ),

  F(
    "Call Me Maybe",
    "Carly Rae Jepsen",
    2011,
    1
  ),

  F(
    "Get Lucky",
    "Daft Punk feat. Pharrell Williams",
    2013,
    1
  ),

  F(
    "Royals",
    "Lorde",
    2013,
    1
  ),

  F(
    "Take Me to Church",
    "Hozier",
    2013,
    1
  ),

  F(
    "Happy",
    "Pharrell Williams",
    2013,
    1
  ),

  F(
    "Chandelier",
    "Sia",
    2014,
    1
  ),

  F(
    "Uptown Funk",
    "Mark Ronson feat. Bruno Mars",
    2014,
    1
  ),

  F(
    "Hello",
    "Adele",
    2015,
    1
  ),

  F(
    "One Dance",
    "Drake feat. Wizkid & Kyla",
    2016,
    1
  ),

  F(
    "Shape of You",
    "Ed Sheeran",
    2017,
    1
  ),

  F(
    "Havana",
    "Camila Cabello feat. Young Thug",
    2017,
    1
  ),

  F(
    "Shallow",
    "Lady Gaga & Bradley Cooper",
    2018,
    1
  ),

  F(
    "bad guy",
    "Billie Eilish",
    2019,
    1
  ),

  F(
    "Blinding Lights",
    "The Weeknd",
    2019,
    1
  ),

  F(
    "Watermelon Sugar",
    "Harry Styles",
    2019,
    1
  ),

  F(
    "Levitating",
    "Dua Lipa",
    2020,
    1
  ),

  F(
    "drivers license",
    "Olivia Rodrigo",
    2021,
    1
  ),

  F(
    "As It Was",
    "Harry Styles",
    2022,
    1
  ),

  F(
    "Flowers",
    "Miley Cyrus",
    2023,
    1
  ),

  F(
    "Lose Control",
    "Teddy Swims",
    2023,
    2
  ),

  F(
    "Espresso",
    "Sabrina Carpenter",
    2024,
    1
  ),

  F(
    "Birds of a Feather",
    "Billie Eilish",
    2024,
    1
  )
];


/* =========================================================
   BASIC HELPERS
========================================================= */

function now() {
  return Date.now();
}


function cleanName(value) {

  return String(
    value || ""
  )
    .trim()
    .slice(
      0,
      24
    );
}


function cleanCode(value) {

  return String(
    value || ""
  )
    .trim()
    .toUpperCase()
    .slice(
      0,
      4
    );
}


function safeAck(
  ack,
  payload
) {

  if (
    typeof ack ===
    "function"
  ) {

    ack(
      payload
    );

  }
}


function randomToken() {

  return crypto
    .randomBytes(
      18
    )
    .toString(
      "base64url"
    );
}


function shuffle(array) {

  const copy =
    array.slice();


  for (
    let i =
      copy.length - 1;

    i > 0;

    i -= 1
  ) {

    const j =
      Math.floor(
        Math.random() *
        (
          i + 1
        )
      );


    [
      copy[i],
      copy[j]
    ] =
    [
      copy[j],
      copy[i]
    ];

  }


  return copy;
}


function newRoomCode() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


  let code =
    "";


  do {

    code =
      Array.from(

        {
          length:
            4
        },

        () =>
          chars[
            Math.floor(
              Math.random() *
              chars.length
            )
          ]

      )
        .join(
          ""
        );

  } while (
    rooms.has(
      code
    )
  );


  return code;
}


function modePool(
  mode,
  difficulty
) {

  let pool;


  if (
    mode ===
    "estonian"
  ) {

    pool =
      ESTONIAN;

  } else if (
    mode ===
    "mixed"
  ) {

    pool = [
      ...ESTONIAN,
      ...FOREIGN
    ];

  } else {

    pool =
      FOREIGN;

  }


  if (
    difficulty ===
    "easy"
  ) {

    return pool.filter(
      song =>
        song.level ===
        1
    );

  }


  if (
    difficulty ===
    "hard"
  ) {

    return pool.filter(
      song =>
        song.level >=
        2
    );

  }


  return pool;
}


function canonicalSong(
  song
) {

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


function playerByToken(
  room,
  token
) {

  return room.players.find(
    player =>
      player.token ===
      token
  );
}


function connectedPlayers(
  room
) {

  return room.players.filter(
    player =>
      player.connected
  );
}


function chooseHost(
  room
) {

  const currentHost =
    playerByToken(
      room,
      room.hostToken
    );


  if (
    currentHost
      ?.connected
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


  if (
    room.djMode ===
      "fixed" &&

    room.fixedDjToken &&

    !playerByToken(
      room,
      room.fixedDjToken
    )?.connected
  ) {

    room.fixedDjToken =
      null;

  }
}


function permanentDj(
  room
) {

  if (
    room.djMode ===
    "host"
  ) {

    const host =
      playerByToken(
        room,
        room.hostToken
      );


    if (
      host?.connected
    ) {

      return host;

    }


    return (
      connectedPlayers(
        room
      )[0] ||
      null
    );

  }


  if (
    room.djMode ===
    "fixed"
  ) {

    const fixed =
      playerByToken(
        room,
        room.fixedDjToken
      );


    if (
      fixed?.connected
    ) {

      return fixed;

    }


    if (
      !room.started
    ) {

      return null;

    }


    const host =
      playerByToken(
        room,
        room.hostToken
      );


    if (
      host?.connected
    ) {

      return host;

    }


    return (
      connectedPlayers(
        room
      )[0] ||
      null
    );

  }


  return null;
}


function isPermanentDj(
  room,
  player
) {

  const dj =
    permanentDj(
      room
    );


  return Boolean(

    dj &&

    room.djMode !==
      "rotating" &&

    dj.token ===
      player.token

  );
}


function currentClassicPlayer(
  room
) {

  if (
    !room.players.length
  ) {

    return null;

  }


  const permDj =
    permanentDj(
      room
    );


  for (
    let step = 0;

    step <
      room.players.length;

    step += 1
  ) {

    const index =
      (
        room.turnIndex +
        step
      )
      %
      room.players.length;


    const player =
      room.players[
        index
      ];


    if (
      !player.connected
    ) {

      continue;

    }


    if (
      room.djMode !==
        "rotating" &&

      permDj &&

      player.token ===
        permDj.token
    ) {

      continue;

    }


    room.turnIndex =
      index;


    return player;

  }


  return null;
}


function djPlayer(
  room
) {

  const permDj =
    permanentDj(
      room
    );


  if (
    room.djMode !==
    "rotating"
  ) {

    return permDj;

  }


  const connected =
    connectedPlayers(
      room
    );


  if (
    connected.length <
    2
  ) {

    return null;

  }


  const active =

    room.gameMode ===
    "classic"

      ? currentClassicPlayer(
          room
        )

      : null;


  const start =

    room.roundNumber %

    room.players.length;


  for (
    let step = 0;

    step <
      room.players.length;

    step += 1
  ) {

    const player =
      room.players[
        (
          start +
          step
        )
        %
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


  return (
    connected[0] ||
    null
  );
}


function eligibleGuessers(
  room
) {

  const dj =
    djPlayer(
      room
    );


  if (
    room.gameMode ===
    "classic"
  ) {

    const active =
      currentClassicPlayer(
        room
      );


    return (
      active?.connected
        ? [active]
        : []
    );

  }


  return connectedPlayers(
    room
  )
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
    Number(
      slot
    );


  if (
    !Number.isInteger(
      index
    ) ||

    index < 0 ||

    index >
      timeline.length
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

      : timeline[
          index
        ].year;


  return (
    year >=
      left &&

    year <=
      right
  );
}


function insertSongAt(
  timeline,
  slot,
  song
) {

  const index =
    Math.max(
      0,
      Math.min(
        Number(
          slot
        ),
        timeline.length
      )
    );


  timeline.splice(
    index,
    0,
    canonicalSong(
      song
    )
  );
}


function makeDeck(
  room
) {

  const pool =
    modePool(
      room.musicMode,
      room.difficulty
    );


  const recent =
    new Set(
      room.recentSongKeys
        .slice(
          -20
        )
    );


  const fresh =
    pool.filter(
      song =>
        !recent.has(
          `${song.artist}|${song.title}`
        )
    );


  return shuffle(

    fresh.length >=
      10

      ? fresh

      : pool

  );
}


function drawSong(
  room
) {

  if (
    !room.deck.length
  ) {

    room.deck =
      makeDeck(
        room
      );

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


/* =========================================================
   GAME LOGIC
========================================================= */

function startRound(
  room
) {

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
    drawSong(
      room
    );


  room.guesses =
    {};


  room.reveal =
    null;


  room.phase =
    "guessing";


  room.lastActiveAt =
    now();
}


function startGame(
  room
) {

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


  const competitors =
    room.players.filter(
      player =>
        !isPermanentDj(
          room,
          player
        )
    );


  if (
    !competitors.length
  ) {

    throw new Error(
      "No competing players."
    );

  }


  if (
    pool.length <
    competitors.length +
    1
  ) {

    throw new Error(
      "Not enough songs."
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
    shuffle(
      pool
    );


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

      if (
        isPermanentDj(
          room,
          player
        )
      ) {

        player.timeline =
          [];

      } else {

        player.timeline = [
          canonicalSong(
            drawSong(
              room
            )
          )
        ];

      }

    }
  );


  startRound(
    room
  );
}


function revealRound(
  room
) {

  if (
    room.phase !==
      "guessing" ||

    !room.currentSong
  ) {

    return;

  }


  const guessers =
    eligibleGuessers(
      room
    );


  const results =
    [];


  for (
    const player
    of guessers
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

      insertSongAt(

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


  room.phase =
    "reveal";


  const winners =
    room.players

      .filter(
        player =>
          !isPermanentDj(
            room,
            player
          )
      )

      .filter(
        player =>
          player.timeline.length >=
          room.targetCards
      )

      .sort(
        (
          a,
          b
        ) =>
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


  emitRoom(
    room
  );


  if (
    room.autoNext &&
    !room.finished
  ) {

    room.autoTimer =
      setTimeout(

        () =>
          advanceRound(
            room
          ),

        room.revealSeconds *
        1000

      );

  }
}


function advanceClassicTurn(
  room
) {

  if (
    !room.players.length
  ) {

    return;

  }


  const permDj =
    permanentDj(
      room
    );


  const start =
    (
      room.turnIndex +
      1
    )
    %
    room.players.length;


  for (
    let step = 0;

    step <
      room.players.length;

    step += 1
  ) {

    const index =
      (
        start +
        step
      )
      %
      room.players.length;


    const player =
      room.players[
        index
      ];


    if (
      !player.connected
    ) {

      continue;

    }


    if (
      room.djMode !==
        "rotating" &&

      permDj &&

      player.token ===
        permDj.token
    ) {

      continue;

    }


    room.turnIndex =
      index;


    return;

  }
}


function advanceRound(
  room
) {

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

    advanceClassicTurn(
      room
    );

  }


  startRound(
    room
  );


  emitRoom(
    room
  );
}


/* =========================================================
   PUBLIC STATE
========================================================= */

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

      ? currentClassicPlayer(
          room
        )

      : null;


  const dj =
    djPlayer(
      room
    );


  const guessers =
    eligibleGuessers(
      room
    );


  return {

    code:
      room.code,

    language:
      room.language,

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

    djMode:
      room.djMode,

    fixedDjToken:
      room.fixedDjToken,

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
      active?.token ||
      null,

    djToken:
      dj?.token ||
      null,

    isGuesser:
      guessers.some(
        player =>
          player.token ===
          playerToken
      ),

    myGuess:
      room.guesses[
        playerToken
      ] ||
      null,

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

    djSecret:

      (
        dj?.token ===
          playerToken &&

        room.currentSong
      )

        ? {

            song:
              canonicalSong(
                room.currentSong
              )

          }

        : null,

    spotifyConfigured:
      Boolean(

        process.env
          .SPOTIFY_CLIENT_ID &&

        process.env
          .SPOTIFY_CLIENT_SECRET

      ),

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

          isPermanentDj:
            isPermanentDj(
              room,
              player
            ),

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


function emitRoom(
  room
) {

  room.lastActiveAt =
    now();


  for (
    const player
    of room.players
  ) {

    if (
      !player.socketId
    ) {

      continue;

    }


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


function roomFromSocket(
  socket
) {

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


function maybeAutoReveal(
  room
) {

  if (
    room.phase !==
    "guessing"
  ) {

    return;

  }


  const guessers =
    eligibleGuessers(
      room
    );


  if (
    !guessers.length
  ) {

    return;

  }


  if (
    guessers.every(
      player =>
        Boolean(
          room.guesses[
            player.token
          ]
        )
    )
  ) {

    revealRound(
      room
    );

  }
}


/* =========================================================
   SPOTIFY AUTH
========================================================= */

async function getSpotifyAccessToken() {

  if (
    spotifyAccessToken &&

    now() <
      spotifyAccessTokenExpiresAt -
      30000
  ) {

    return spotifyAccessToken;

  }


  const clientId =
    process.env
      .SPOTIFY_CLIENT_ID;


  const clientSecret =
    process.env
      .SPOTIFY_CLIENT_SECRET;


  if (
    !clientId ||
    !clientSecret
  ) {

    const error =
      new Error(
        "Spotify is not configured."
      );


    error.code =
      "SPOTIFY_NOT_CONFIGURED";


    throw error;

  }


  const auth =
    Buffer
      .from(
        `${clientId}:${clientSecret}`
      )
      .toString(
        "base64"
      );


  const response =
    await fetch(

      "https://accounts.spotify.com/api/token",

      {

        method:
          "POST",

        headers: {

          Authorization:
            `Basic ${auth}`,

          "Content-Type":
            "application/x-www-form-urlencoded"

        },

        body:
          new URLSearchParams({
            grant_type:
              "client_credentials"
          })

      }

    );


  if (
    !response.ok
  ) {

    throw new Error(
      `Spotify token request failed: ${response.status}`
    );

  }


  const data =
    await response.json();


  spotifyAccessToken =
    data.access_token;


  spotifyAccessTokenExpiresAt =

    now() +

    Number(
      data.expires_in ||
      3600
    )
    *
    1000;


  return spotifyAccessToken;
}


/* =========================================================
   BETTER SPOTIFY SEARCH
========================================================= */

function normalized(
  value
) {

  return String(
    value || ""
  )

    .toLowerCase()

    .normalize(
      "NFD"
    )

    .replace(
      /\p{Diacritic}/gu,
      ""
    )

    .replace(
      /[^a-z0-9]+/g,
      " "
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();
}


function simplifyArtistForSearch(
  value
) {

  return String(
    value || ""
  )

    .replace(
      /\b(feat\.?|ft\.?|featuring|with)\b.*$/i,
      ""
    )

    .replace(
      /\s*[&,/]\s*.*/i,
      ""
    )

    .trim();
}


function tokenSet(
  value
) {

  return new Set(

    normalized(
      value
    )

      .split(
        " "
      )

      .filter(
        Boolean
      )

  );
}


function tokenOverlapScore(
  a,
  b
) {

  const left =
    tokenSet(
      a
    );


  const right =
    tokenSet(
      b
    );


  if (
    !left.size ||
    !right.size
  ) {

    return 0;

  }


  let common =
    0;


  for (
    const token
    of left
  ) {

    if (
      right.has(
        token
      )
    ) {

      common +=
        1;

    }

  }


  return (

    common /

    Math.max(
      left.size,
      right.size
    )

  );
}


function spotifyMatchScore(
  item,
  song
) {

  const wantedTitle =
    normalized(
      song.title
    );


  const wantedArtist =
    normalized(
      song.artist
    );


  const wantedPrimaryArtist =
    normalized(
      simplifyArtistForSearch(
        song.artist
      )
    );


  const itemTitle =
    normalized(
      item.name
    );


  const itemArtistsRaw =
    (
      item.artists ||
      []
    )

      .map(
        artist =>
          artist.name
      )

      .join(
        " "
      );


  const itemArtists =
    normalized(
      itemArtistsRaw
    );


  let score =
    0;


  if (
    itemTitle ===
    wantedTitle
  ) {

    score +=
      100;

  } else if (
    itemTitle.includes(
      wantedTitle
    ) ||

    wantedTitle.includes(
      itemTitle
    )
  ) {

    score +=
      60;

  } else {

    score +=
      Math.round(

        tokenOverlapScore(
          item.name,
          song.title
        )

        *
        45

      );

  }


  if (
    wantedArtist &&

    itemArtists ===
    wantedArtist
  ) {

    score +=
      55;

  } else if (
    wantedArtist &&

    itemArtists.includes(
      wantedArtist
    )
  ) {

    score +=
      45;

  }


  if (
    wantedPrimaryArtist &&

    (
      itemArtists ===
        wantedPrimaryArtist ||

      itemArtists.includes(
        wantedPrimaryArtist
      )
    )
  ) {

    score +=
      35;

  } else {

    score +=
      Math.round(

        tokenOverlapScore(
          itemArtistsRaw,
          song.artist
        )

        *
        30

      );

  }


  if (
    item.is_playable ===
    false
  ) {

    score -=
      20;

  }


  return score;
}


async function spotifySearch(
  token,
  q,
  limit = 10
) {

  const query =
    new URLSearchParams({

      q,

      type:
        "track",

      limit:
        String(
          limit
        )

    });


  const response =
    await fetch(

      `https://api.spotify.com/v1/search?${query.toString()}`,

      {

        headers: {

          Authorization:
            `Bearer ${token}`

        }

      }

    );


  if (
    !response.ok
  ) {

    const body =
      await response
        .text()
        .catch(
          () => ""
        );


    throw new Error(

      `Spotify search failed: ${response.status}${
        body
          ? ` ${body.slice(0,180)}`
          : ""
      }`

    );

  }


  const data =
    await response.json();


  return (
    data
      ?.tracks
      ?.items
    ||
    []
  );
}


async function resolveSpotifyTrack(
  song
) {

  const cacheKey =
    `${song.artist}|${song.title}`;


  if (
    spotifyCache.has(
      cacheKey
    )
  ) {

    return spotifyCache.get(
      cacheKey
    );

  }


  const token =
    await getSpotifyAccessToken();


  const primaryArtist =
    simplifyArtistForSearch(
      song.artist
    );


  const searches = [

    `track:${song.title} artist:${primaryArtist || song.artist}`,

    `${song.title} ${song.artist}`,

    `${song.title} ${primaryArtist}`,

    `track:${song.title}`,

    song.title

  ]
    .filter(
      Boolean
    );


  const seenIds =
    new Set();


  const candidates =
    [];


  for (
    const q
    of searches
  ) {

    try {

      const items =
        await spotifySearch(
          token,
          q,
          10
        );


      for (
        const item
        of items
      ) {

        if (
          !item?.id ||
          seenIds.has(
            item.id
          )
        ) {

          continue;

        }


        seenIds.add(
          item.id
        );


        candidates.push(
          item
        );

      }

    } catch (
      error
    ) {

      console.warn(

        `Spotify search attempt failed for "${q}":`,

        error.message

      );

    }

  }


  if (
    !candidates.length
  ) {

    const error =
      new Error(
        "Track not found."
      );


    error.code =
      "TRACK_NOT_FOUND";


    throw error;

  }


  const ranked =
    candidates

      .map(
        item => ({

          item,

          score:
            spotifyMatchScore(
              item,
              song
            )

        })
      )

      .sort(
        (
          a,
          b
        ) =>
          b.score -
          a.score
      );


  const best =
    ranked[0];


  console.log(

    `Spotify match: "${song.title}" / "${song.artist}" -> ` +

    `"${best.item.name}" / "${
      (
        best.item.artists ||
        []
      )
        .map(
          artist =>
            artist.name
        )
        .join(", ")
    }" ` +

    `(score ${best.score})`

  );


  if (
    best.score <
    45
  ) {

    const error =
      new Error(
        "No confident Spotify match."
      );


    error.code =
      "TRACK_NOT_FOUND";


    throw error;

  }


  const result = {

    uri:
      best.item.uri,

    url:
      best.item
        .external_urls
        ?.spotify
      ||
      null,

    spotifyTitle:
      best.item.name,

    spotifyArtist:
      (
        best.item.artists ||
        []
      )

        .map(
          artist =>
            artist.name
        )

        .join(
          ", "
        )

  };


  spotifyCache.set(
    cacheKey,
    result
  );


  return result;
}


/* =========================================================
   SPOTIFY ENDPOINT
========================================================= */

app.post(
  "/api/spotify/track",
  async (
    req,
    res
  ) => {

    try {

      const room =
        rooms.get(
          cleanCode(
            req.body
              ?.roomCode
          )
        );


      const playerToken =
        String(
          req.body
            ?.playerToken ||
          ""
        )
          .trim();


      const roundId =
        String(
          req.body
            ?.roundId ||
          ""
        )
          .trim();


      if (
        !room ||
        !playerToken ||
        !roundId
      ) {

        return res
          .status(
            404
          )
          .json({

            ok:
              false,

            error:
              "ROOM_NOT_FOUND"

          });

      }


      const dj =
        djPlayer(
          room
        );


      if (
        !dj ||

        dj.token !==
          playerToken ||

        room.roundId !==
          roundId ||

        !room.currentSong
      ) {

        return res
          .status(
            403
          )
          .json({

            ok:
              false,

            error:
              "NOT_CURRENT_DJ"

          });

      }


      const track =
        await resolveSpotifyTrack(
          room.currentSong
        );


      return res.json({

        ok:
          true,

        ...track

      });

    } catch (
      error
    ) {

      console.error(
        "Spotify:",
        error.message
      );


      if (
        error.code ===
        "SPOTIFY_NOT_CONFIGURED"
      ) {

        return res
          .status(
            503
          )
          .json({

            ok:
              false,

            error:
              "SPOTIFY_NOT_CONFIGURED"

          });

      }


      if (
        error.code ===
        "TRACK_NOT_FOUND"
      ) {

        return res
          .status(
            404
          )
          .json({

            ok:
              false,

            error:
              "TRACK_NOT_FOUND"

          });

      }


      return res
        .status(
          502
        )
        .json({

          ok:
            false,

          error:
            "SPOTIFY_ERROR"

        });

    }

  }
);


/* =========================================================
   SOCKET.IO
========================================================= */

io.on(
  "connection",
  socket => {


    socket.on(
      "createRoom",
      (
        {
          name,
          playerToken,
          language
        } = {},
        ack
      ) => {

        const playerName =
          cleanName(
            name
          );


        if (
          !playerName
        ) {

          return safeAck(
            ack,
            {
              ok:
                false,

              error:
                "NAME_REQUIRED"
            }
          );

        }


        const code =
          newRoomCode();


        const token =
          String(
            playerToken ||
            ""
          )
            .trim()

          ||

          randomToken();


        const room = {

          code,

          createdAt:
            now(),

          lastActiveAt:
            now(),

          language:

            language ===
              "en"

              ? "en"

              : "et",

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

          djMode:
            "rotating",

          fixedDjToken:
            null,

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

          autoTimer:
            null,

          players: [

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

            ok:
              true,

            code,

            playerToken:
              token

          }
        );


        emitRoom(
          room
        );

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
          cleanName(
            name
          );


        const room =
          rooms.get(
            cleanCode(
              code
            )
          );


        if (
          !playerName
        ) {

          return safeAck(
            ack,
            {
              ok:
                false,

              error:
                "NAME_REQUIRED"
            }
          );

        }


        if (
          !room
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "ROOM_NOT_FOUND"

            }
          );

        }


        const requestedToken =
          String(
            playerToken ||
            ""
          )
            .trim();


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


            chooseHost(
              room
            );


            safeAck(
              ack,
              {

                ok:
                  true,

                code:
                  room.code,

                playerToken:
                  existing.token,

                resumed:
                  true,

                language:
                  room.language

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

              ok:
                false,

              error:
                "GAME_ALREADY_STARTED"

            }
          );

        }


        if (
          room.players.length >=
          8
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "ROOM_FULL"

            }
          );

        }


        if (
          room.players.some(
            player =>
              player.name
                .toLowerCase()
              ===
              playerName
                .toLowerCase()
          )
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "NAME_TAKEN"

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


        chooseHost(
          room
        );


        safeAck(
          ack,
          {

            ok:
              true,

            code:
              room.code,

            playerToken:
              token,

            resumed:
              false,

            language:
              room.language

          }
        );


        emitRoom(
          room
        );

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
            cleanCode(
              code
            )
          );


        const token =
          String(
            playerToken ||
            ""
          )
            .trim();


        if (
          !room ||
          !token
        ) {

          return safeAck(
            ack,
            {
              ok:
                false
            }
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
            {
              ok:
                false
            }
          );

        }


        joinSocketToPlayer(
          socket,
          room,
          player
        );


        chooseHost(
          room
        );


        safeAck(
          ack,
          {

            ok:
              true,

            name:
              player.name,

            code:
              room.code,

            playerToken:
              player.token,

            language:
              room.language

          }
        );


        emitRoom(
          room
        );

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

              ok:
                false,

              error:
                "ROOM_NOT_FOUND"

            }
          );

        }


        const {
          room,
          player
        } =
          context;


        if (
          room.hostToken !==
          player.token
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "HOST_ONLY"

            }
          );

        }


        if (
          room.started
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "GAME_ALREADY_STARTED"

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


        if (
          [
            "rotating",
            "host",
            "fixed"
          ].includes(
            payload.djMode
          )
        ) {

          room.djMode =
            payload.djMode;

        }


        if (
          payload.fixedDjToken &&

          room.players.some(
            candidate =>
              candidate.token ===
              payload.fixedDjToken
          )
        ) {

          room.fixedDjToken =
            payload.fixedDjToken;

        } else if (
          payload.djMode !==
          "fixed"
        ) {

          room.fixedDjToken =
            null;

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
          {
            ok:
              true
          }
        );


        emitRoom(
          room
        );

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

              ok:
                false,

              error:
                "ROOM_NOT_FOUND"

            }
          );

        }


        const {
          room,
          player
        } =
          context;


        if (
          room.hostToken !==
          player.token
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "HOST_ONLY"

            }
          );

        }


        const connected =
          connectedPlayers(
            room
          );


        if (
          connected.length <
          2
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "NEED_TWO_PLAYERS"

            }
          );

        }


        if (
          room.djMode ===
            "fixed" &&

          !room.fixedDjToken
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "CHOOSE_DJ"

            }
          );

        }


        try {

          startGame(
            room
          );


          safeAck(
            ack,
            {
              ok:
                true
            }
          );


          emitRoom(
            room
          );

        } catch (
          error
        ) {

          console.error(
            error
          );


          safeAck(
            ack,
            {

              ok:
                false,

              error:
                "START_FAILED"

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

              ok:
                false,

              error:
                "ROOM_NOT_FOUND"

            }
          );

        }


        const {
          room,
          player
        } =
          context;


        if (
          !room.started ||

          room.finished ||

          room.phase !==
            "guessing"
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "CANNOT_GUESS_NOW"

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

              ok:
                false,

              error:
                "ROUND_CHANGED"

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

              ok:
                false,

              error:
                "NOT_GUESSER"

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

              ok:
                false,

              error:
                "ALREADY_GUESSED"

            }
          );

        }


        const index =
          Number(
            slot
          );


        if (
          !Number.isInteger(
            index
          ) ||

          index <
            0 ||

          index >
            player.timeline.length
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "INVALID_SLOT"

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
          {
            ok:
              true
          }
        );


        emitRoom(
          room
        );


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

              ok:
                false,

              error:
                "ROOM_NOT_FOUND"

            }
          );

        }


        const {
          room,
          player
        } =
          context;


        if (
          room.hostToken !==
          player.token
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "HOST_ONLY"

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

              ok:
                false,

              error:
                "WRONG_PHASE"

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

              ok:
                false,

              error:
                "NO_GUESSES"

            }
          );

        }


        revealRound(
          room
        );


        safeAck(
          ack,
          {
            ok:
              true
          }
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

              ok:
                false,

              error:
                "ROOM_NOT_FOUND"

            }
          );

        }


        const {
          room,
          player
        } =
          context;


        if (
          room.hostToken !==
          player.token
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "HOST_ONLY"

            }
          );

        }


        if (
          room.finished
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "GAME_FINISHED"

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

              ok:
                false,

              error:
                "REVEAL_FIRST"

            }
          );

        }


        advanceRound(
          room
        );


        safeAck(
          ack,
          {
            ok:
              true
          }
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

              ok:
                false,

              error:
                "ROOM_NOT_FOUND"

            }
          );

        }


        const {
          room,
          player
        } =
          context;


        if (
          room.hostToken !==
          player.token
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "HOST_ONLY"

            }
          );

        }


        if (
          connectedPlayers(
            room
          ).length <
          2
        ) {

          return safeAck(
            ack,
            {

              ok:
                false,

              error:
                "NEED_TWO_PLAYERS"

            }
          );

        }


        try {

          startGame(
            room
          );


          safeAck(
            ack,
            {
              ok:
                true
            }
          );


          emitRoom(
            room
          );

        } catch (
          error
        ) {

          console.error(
            error
          );


          safeAck(
            ack,
            {

              ok:
                false,

              error:
                "START_FAILED"

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
        } =
          context;


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


        chooseHost(
          room
        );


        emitRoom(
          room
        );

      }
    );

  }
);


/* =========================================================
   ROOM CLEANUP
========================================================= */

setInterval(
  () => {

    const currentTime =
      now();


    for (
      const [
        code,
        room
      ]
      of rooms.entries()
    ) {

      const noneConnected =
        connectedPlayers(
          room
        ).length ===
        0;


      const age =
        currentTime -
        room.lastActiveAt;


      if (
        (
          noneConnected &&

          age >
            EMPTY_ROOM_TTL_MS
        )

        ||

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

  60 *
  1000
);


/* =========================================================
   SERVER
========================================================= */

const PORT =
  process.env.PORT ||
  3000;


httpServer.listen(
  PORT,
  () => {

    console.log(
      `kõrva(n)uss v5 running on port ${PORT}`
    );

  }
);
