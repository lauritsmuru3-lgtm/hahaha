const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map();


/* =========================================================
   VÄLISMAA LOOD
========================================================= */

const FOREIGN = [
  ["Stand by Me", "Ben E. King", 1961],
  ["California Dreamin'", "The Mamas & the Papas", 1965],
  ["Paint It, Black", "The Rolling Stones", 1966],
  ["Respect", "Aretha Franklin", 1967],
  ["Space Oddity", "David Bowie", 1969],
  ["Imagine", "John Lennon", 1971],
  ["Superstition", "Stevie Wonder", 1972],
  ["Bohemian Rhapsody", "Queen", 1975],
  ["Dancing Queen", "ABBA", 1976],
  ["Dreams", "Fleetwood Mac", 1977],
  ["Stayin' Alive", "Bee Gees", 1977],
  ["Heroes", "David Bowie", 1977],
  ["I Will Survive", "Gloria Gaynor", 1978],
  ["Heart of Glass", "Blondie", 1978],
  ["Another One Bites the Dust", "Queen", 1980],
  ["Call Me", "Blondie", 1980],
  ["Billie Jean", "Michael Jackson", 1983],
  ["Girls Just Want to Have Fun", "Cyndi Lauper", 1983],
  ["Sweet Dreams (Are Made of This)", "Eurythmics", 1983],
  ["Take on Me", "a-ha", 1985],
  ["Like a Prayer", "Madonna", 1989],
  ["Enjoy the Silence", "Depeche Mode", 1990],
  ["Nothing Compares 2 U", "Sinéad O’Connor", 1990],
  ["Smells Like Teen Spirit", "Nirvana", 1991],
  ["Rhythm Is a Dancer", "Snap!", 1992],
  ["Zombie", "The Cranberries", 1994],
  ["Wonderwall", "Oasis", 1995],
  ["Freed from Desire", "Gala", 1996],
  ["Torn", "Natalie Imbruglia", 1997],
  ["...Baby One More Time", "Britney Spears", 1998],
  ["Yellow", "Coldplay", 2000],
  ["Can't Get You Out of My Head", "Kylie Minogue", 2001],
  ["Complicated", "Avril Lavigne", 2002],
  ["Crazy in Love", "Beyoncé feat. Jay-Z", 2003],
  ["Mr. Brightside", "The Killers", 2003],
  ["Toxic", "Britney Spears", 2003],
  ["Seven Nation Army", "The White Stripes", 2003],
  ["Crazy", "Gnarls Barkley", 2006],
  ["Hips Don't Lie", "Shakira feat. Wyclef Jean", 2006],
  ["Rehab", "Amy Winehouse", 2006],
  ["Umbrella", "Rihanna feat. Jay-Z", 2007],
  ["Poker Face", "Lady Gaga", 2008],
  ["Viva la Vida", "Coldplay", 2008],
  ["Rolling in the Deep", "Adele", 2010],
  ["Somebody That I Used to Know", "Gotye feat. Kimbra", 2011],
  ["Get Lucky", "Daft Punk feat. Pharrell Williams", 2013],
  ["Royals", "Lorde", 2013],
  ["Take Me to Church", "Hozier", 2013],
  ["Happy", "Pharrell Williams", 2013],
  ["Chandelier", "Sia", 2014],
  ["Uptown Funk", "Mark Ronson feat. Bruno Mars", 2014],
  ["Shape of You", "Ed Sheeran", 2017],
  ["bad guy", "Billie Eilish", 2019],
  ["Blinding Lights", "The Weeknd", 2019],
  ["Watermelon Sugar", "Harry Styles", 2019],
  ["Levitating", "Dua Lipa", 2020],
  ["As It Was", "Harry Styles", 2022],
  ["Flowers", "Miley Cyrus", 2023],
  ["Lose Control", "Teddy Swims", 2023],
  ["Espresso", "Sabrina Carpenter", 2024],
  ["Birds of a Feather", "Billie Eilish", 2024]
];


/* =========================================================
   EESTI LOOD
========================================================= */

const ESTONIAN = [
  ["Saaremaa valss", "Georg Ots", 1961],
  ["Horoskoop", "Heidy Tamme", 1968],
  ["Vana klaver", "Heidy Tamme", 1969],

  ["Korraks vaid", "Vello Orumets", 1970],
  ["Vana vaksal", "Vello Orumets", 1972],
  ["Mis värvi on armastus", "Uno Loop", 1974],
  ["Karikakar", "Marju Kuut", 1976],
  ["Nii kuum on tunne", "Marju Kuut", 1977],

  ["Aeg ei peatu", "Fix", 1980],
  ["Põhjamaa", "Ruja", 1980],
  ["Suudlus läbi jäätunud klaasi", "Ruja", 1980],
  ["Mere lapsed", "Ruja", 1981],
  ["Tsirkus", "Anne Veski", 1983],
  ["Roosiaia kuninganna", "Anne Veski", 1984],
  ["Jätke võtmed väljapoole", "Anne Veski", 1986],
  ["Kikilips", "Ivo Linna", 1987],
  ["Eestlane olen ja eestlaseks jään", "Ivo Linna", 1988],
  ["Koit", "Tõnis Mägi", 1988],
  ["Sind surmani", "Tõnis Mägi", 1988],
  ["Valged roosid", "Anne Veski", 1989],

  ["Oma laulu ei leia ma üles", "Vennaskond", 1991],
  ["Insener Garini hüperboloid", "Vennaskond", 1993],
  ["Mäng", "2 Quick Start", 1994],
  ["Juulikuu lumi", "Terminaator", 1995],
  ["Neiu mustas kleidis", "2 Quick Start", 1995],
  ["Kaelakee hääl", "Maarja-Liis Ilus & Ivo Linna", 1996],
  ["Kingitus", "2 Quick Start", 1996],
  ["Keelatud maa", "Maarja-Liis Ilus", 1997],
  ["Carmen", "Terminaator", 1997],
  ["Romula", "Terminaator", 1997],
  ["17", "Smilers", 1998],
  ["Mõistus on kadunud", "Smilers", 1999],
  ["Ajateenija", "Terminaator", 1999],

  ["Once in a Lifetime", "Ines", 2000],
  ["Everybody", "Tanel Padar, Dave Benton & 2XL", 2001],
  ["Tantsin sinuga taevas", "Smilers", 2001],
  ["Club Kung Fu", "Vanilla Ninja", 2003],
  ["Tough Enough", "Vanilla Ninja", 2003],
  ["Käime katuseid mööda", "Smilers", 2003],
  ["Kuu", "Terminaator", 2003],
  ["Nii vaikseks kõik on jäänud", "Jaan Tätte & Marko Matvere", 2004],
  ["See on see", "Smilers", 2004],
  ["Vihm", "Metsatöll", 2004],
  ["Lendame valguskiirusel", "Traffic", 2007],
  ["Depressiivsed Eesti väikelinnad", "HU?", 2008],
  ["Absoluutselt", "HU?", 2008],
  ["Rändajad", "Urban Symphony", 2009],

  ["Mina jään", "Lenna", 2010],
  ["Rapunzel", "Lenna", 2010],
  ["Siren", "Malcolm Lincoln", 2010],
  ["Kosmos", "Iiris", 2010],
  ["Rockefeller Street", "Getter Jaani", 2011],
  ["Kuula", "Ott Lepland", 2012],
  ["Päästke noored hinged", "Grete Paia", 2013],
  ["Supernoova", "Lenna", 2014],
  ["Parmupillihullus", "Trad.Attack!", 2014],
  ["Für Elise", "Traffic", 2014],
  ["Goodbye to Yesterday", "Elina Born & Stig Rästa", 2015],
  ["Sõit", "Trad.Attack!", 2015],
  ["Sädemed", "Karl-Erik Taukar", 2015],
  ["Sekundiga", "Traffic", 2015],
  ["Young Boy", "NOËP", 2016],
  ["Supersonic", "Laura", 2016],
  ["Segased lood", "Karl-Erik Taukar", 2016],
  ["Verona", "Koit Toome & Laura", 2017],
  ["Lähedal", "Karl-Erik Taukar", 2017],
  ["Miljon sammu", "Karl-Erik Taukar", 2017],
  ["Mina ka", "nublu feat. Reket", 2018],
  ["Tiiu talu tütreke", "nublu", 2018],
  ["Magad vä?", "5MIINUST", 2018],
  ["Rooftop", "NOËP", 2018],
  ["Üks kord veel", "NOËP", 2019],
  ["für Oksana", "nublu feat. gameboy tetris", 2019],
  ["Storm", "Victor Crone", 2019],
  ["Aluspükse", "5MIINUST", 2019],
  ["Paaristõuked", "5MIINUST", 2019],
  ["Universum", "nublu", 2020],

  [
    "(nendest) narkootikumidest ei tea me (küll) midagi",
    "5MIINUST & Puuluup",
    2024
  ]
];


/* =========================================================
   ABIFUNKTSIOONID
========================================================= */

function shuffle(arr) {

  const copy = arr.slice();

  for (let i = copy.length - 1; i > 0; i -= 1) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
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


function newCode() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code;

  do {

    code = Array
      .from(
        { length: 4 },
        () =>
          chars[
            Math.floor(
              Math.random() *
              chars.length
            )
          ]
      )
      .join("");

  } while (
    rooms.has(code)
  );

  return code;

}


function poolFor(mode) {

  if (
    mode === "estonian"
  ) {
    return ESTONIAN;
  }

  if (
    mode === "mixed"
  ) {
    return [
      ...ESTONIAN,
      ...FOREIGN
    ];
  }

  return FOREIGN;

}


function songLinks(song) {

  const query =
    encodeURIComponent(
      `${song[0]} ${song[1]}`
    );

  return {

    spotify:
      `https://open.spotify.com/search/${query}`,

    youtube:
      `https://www.youtube.com/results?search_query=${query}`

  };

}


/* =========================================================
   MÄNGUSEIS, MIS TELEFONILE SAADETAKSE
========================================================= */

function publicState(
  room,
  socketId
) {

  const me =
    room.players.find(
      player =>
        player.id === socketId
    );


  const currentPlayer =

    room.started &&
    room.players.length > 0

      ? room.players[
          room.turnIndex %
          room.players.length
        ]

      : null;


  return {

    code:
      room.code,

    hostId:
      room.hostId,

    started:
      room.started,

    finished:
      room.finished,

    winnerId:
      room.winnerId || null,

    turnIndex:
      room.turnIndex,

    currentPlayerId:

      currentPlayer
        ? currentPlayer.id
        : null,


    listening:

      room.currentSong
        ? songLinks(
            room.currentSong
          )
        : null,


    reveal:

      room.reveal &&
      room.currentSong

        ? {

            correct:
              room.reveal.correct,

            guessedSlot:
              room.reveal.guessedSlot,

            title:
              room.currentSong[0],

            artist:
              room.currentSong[1],

            year:
              room.currentSong[2]

          }

        : null,


    musicMode:
      room.musicMode,

    targetCards:
      room.targetCards,

    autoNext:
      room.autoNext,


    players:

      room.players.map(
        player => ({

          id:
            player.id,

          name:
            player.name,

          timelineCount:
            player.timeline.length,

          connected:
            player.connected,

          isHost:
            player.id ===
            room.hostId

        })
      ),


    me:

      me
        ? {

            id:
              me.id,

            name:
              me.name,

            timeline:

              me.timeline.map(
                song => ({

                  title:
                    song[0],

                  artist:
                    song[1],

                  year:
                    song[2]

                })
              )

          }

        : null

  };

}


/* =========================================================
   SAADETAKSE SEIS KÕIGILE MÄNGIJATELE
========================================================= */

function emitRoom(room) {

  room.players
    .forEach(
      player => {

        io
          .to(player.id)
          .emit(
            "state",
            publicState(
              room,
              player.id
            )
          );

      }
    );

}


/* =========================================================
   UUS VOOR
========================================================= */

function startRound(room) {

  if (
    room.deck.length === 0
  ) {

    room.deck =
      shuffle(
        poolFor(
          room.musicMode
        )
      );

  }


  room.currentSong =
    room.deck.pop();


  room.reveal =
    null;

}


/* =========================================================
   UUS MÄNG
========================================================= */

function startGame(room) {

  clearTimeout(
    room.autoTimer
  );


  room.autoTimer =
    null;


  room.started =
    true;


  room.finished =
    false;


  room.winnerId =
    null;


  room.turnIndex =
    0;


  room.deck =
    shuffle(
      poolFor(
        room.musicMode
      )
    );


  room.players
    .forEach(
      player => {

        player.timeline = [
          room.deck.pop()
        ];

      }
    );


  startRound(room);

}


/* =========================================================
   JÄRGMINE MÄNGIJA
========================================================= */

function nextRound(room) {

  if (
    room.finished ||
    room.players.length === 0
  ) {
    return;
  }


  clearTimeout(
    room.autoTimer
  );


  room.autoTimer =
    null;


  room.turnIndex =

    (
      room.turnIndex + 1
    ) %
    room.players.length;


  startRound(room);


  emitRoom(room);

}


/* =========================================================
   SOCKET.IO
========================================================= */

io.on(
  "connection",
  socket => {


    /* -----------------------------------------------------
       LOO TUBA
    ----------------------------------------------------- */

    socket.on(
      "createRoom",
      (
        { name } = {},
        callback
      ) => {


        const cleanName =

          String(
            name || ""
          )
            .trim()
            .slice(
              0,
              24
            );


        if (
          !cleanName
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Sisesta nimi."

          });

        }


        const code =
          newCode();


        const room = {

          code,

          hostId:
            socket.id,


          players: [

            {

              id:
                socket.id,

              name:
                cleanName,

              timeline:
                [],

              connected:
                true

            }

          ],


          started:
            false,

          finished:
            false,

          winnerId:
            null,

          turnIndex:
            0,

          deck:
            [],

          currentSong:
            null,

          reveal:
            null,

          musicMode:
            "foreign",

          targetCards:
            8,

          autoNext:
            true,

          autoTimer:
            null

        };


        rooms.set(
          code,
          room
        );


        socket.data.roomCode =
          code;


        socket.join(
          code
        );


        callback?.({

          ok:
            true,

          code

        });


        emitRoom(
          room
        );

      }
    );



    /* -----------------------------------------------------
       LIITU TOAGA
    ----------------------------------------------------- */

    socket.on(
      "joinRoom",
      (
        {
          name,
          code
        } = {},
        callback
      ) => {


        const cleanName =

          String(
            name || ""
          )
            .trim()
            .slice(
              0,
              24
            );


        const cleanCode =

          String(
            code || ""
          )
            .trim()
            .toUpperCase();


        if (
          !cleanName
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Sisesta nimi."

          });

        }


        const room =
          rooms.get(
            cleanCode
          );


        if (
          !room
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Sellist tuba ei leitud."

          });

        }


        if (
          room.started
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Mäng on juba alanud."

          });

        }


        if (
          room.players.length >= 8
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Tuba on täis (max 8)."

          });

        }


        const sameName =
          room.players.some(
            player =>
              player.name
                .toLowerCase() ===
              cleanName
                .toLowerCase()
          );


        if (
          sameName
        ) {

          return callback?.({

            ok:
              false,

            error:
              "See nimi on juba kasutusel."

          });

        }


        room.players.push({

          id:
            socket.id,

          name:
            cleanName,

          timeline:
            [],

          connected:
            true

        });


        socket.data.roomCode =
          cleanCode;


        socket.join(
          cleanCode
        );


        callback?.({

          ok:
            true,

          code:
            cleanCode

        });


        emitRoom(
          room
        );

      }
    );



    /* -----------------------------------------------------
       SEADED
    ----------------------------------------------------- */

    socket.on(
      "settings",
      (
        {
          musicMode,
          targetCards,
          autoNext
        } = {},
        callback
      ) => {


        const room =
          rooms.get(
            socket.data.roomCode
          );


        if (
          !room
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Tuba puudub."

          });

        }


        if (
          room.hostId !==
          socket.id
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Ainult mängujuht saab seadeid muuta."

          });

        }


        if (
          room.started
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Mäng on juba alanud."

          });

        }


        if (
          [
            "foreign",
            "estonian",
            "mixed"
          ].includes(
            musicMode
          )
        ) {

          room.musicMode =
            musicMode;

        }


        const target =
          Number(
            targetCards
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
            autoNext
          );


        callback?.({

          ok:
            true

        });


        emitRoom(
          room
        );

      }
    );



    /* -----------------------------------------------------
       ALUSTA MÄNGU

       OLULINE:
       browser saadab:
       socket.emit("startGame", {}, callback)

       Seetõttu peab siin olema
       (_data, callback)
    ----------------------------------------------------- */

    socket.on(
      "startGame",
      (
        _data,
        callback
      ) => {


        const room =
          rooms.get(
            socket.data.roomCode
          );


        if (
          !room
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Tuba puudub."

          });

        }


        if (
          room.hostId !==
          socket.id
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Ainult mängujuht saab alustada."

          });

        }


        const connectedPlayers =

          room.players.filter(
            player =>
              player.connected
          );


        if (
          connectedPlayers.length < 2
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Mänguks on vaja vähemalt 2 ühendatud mängijat."

          });

        }


        startGame(
          room
        );


        callback?.({

          ok:
            true

        });


        emitRoom(
          room
        );

      }
    );



    /* -----------------------------------------------------
       MÄNGIJA VALIB KOHA
    ----------------------------------------------------- */

    socket.on(
      "guessSlot",
      (
        { slot } = {},
        callback
      ) => {


        const room =
          rooms.get(
            socket.data.roomCode
          );


        if (
          !room ||
          !room.started ||
          room.finished
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Mäng ei käi."

          });

        }


        if (
          !room.currentSong
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Lugu puudub. Alusta uus voor."

          });

        }


        const currentPlayer =

          room.players[
            room.turnIndex %
            room.players.length
          ];


        if (
          !currentPlayer ||
          currentPlayer.id !==
          socket.id
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Praegu pole sinu kord."

          });

        }


        if (
          room.reveal
        ) {

          return callback?.({

            ok:
              false,

            error:
              "See voor on juba vastatud."

          });

        }


        let index =
          Number(
            slot
          );


        if (
          !Number.isInteger(
            index
          )
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Vigane valik."

          });

        }


        index =

          Math.max(

            0,

            Math.min(
              index,
              currentPlayer.timeline.length
            )

          );


        const year =
          room.currentSong[2];


        const left =

          index === 0

            ? -Infinity

            : currentPlayer
                .timeline[
                  index - 1
                ][2];


        const right =

          index ===
          currentPlayer.timeline.length

            ? Infinity

            : currentPlayer
                .timeline[
                  index
                ][2];


        const correct =

          year >= left &&
          year <= right;


        room.reveal = {

          correct,

          guessedSlot:
            index

        };


        if (
          correct
        ) {


          currentPlayer
            .timeline
            .splice(

              index,

              0,

              room.currentSong

            );


          if (
            currentPlayer
              .timeline
              .length >=
            room.targetCards
          ) {

            room.finished =
              true;


            room.winnerId =
              currentPlayer.id;

          }

        }


        callback?.({

          ok:
            true

        });


        emitRoom(
          room
        );


        if (
          room.autoNext &&
          !room.finished
        ) {


          clearTimeout(
            room.autoTimer
          );


          room.autoTimer =

            setTimeout(
              () =>
                nextRound(
                  room
                ),
              4500
            );

        }

      }
    );



    /* -----------------------------------------------------
       JÄRGMINE VOOR

       browser:
       socket.emit("nextRound", {}, callback)
    ----------------------------------------------------- */

    socket.on(
      "nextRound",
      (
        _data,
        callback
      ) => {


        const room =
          rooms.get(
            socket.data.roomCode
          );


        if (
          !room ||
          !room.started
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Mäng ei käi."

          });

        }


        if (
          room.hostId !==
          socket.id
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Ainult mängujuht saab jätkata."

          });

        }


        if (
          !room.reveal
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Esmalt peab mängija vastama."

          });

        }


        if (
          room.finished
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Mäng on lõppenud."

          });

        }


        nextRound(
          room
        );


        callback?.({

          ok:
            true

        });

      }
    );



    /* -----------------------------------------------------
       MÄNGI UUESTI

       browser:
       socket.emit("restart", {}, callback)
    ----------------------------------------------------- */

    socket.on(
      "restart",
      (
        _data,
        callback
      ) => {


        const room =
          rooms.get(
            socket.data.roomCode
          );


        if (
          !room
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Tuba puudub."

          });

        }


        if (
          room.hostId !==
          socket.id
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Ainult mängujuht saab uut mängu alustada."

          });

        }


        const connectedPlayers =

          room.players.filter(
            player =>
              player.connected
          );


        if (
          connectedPlayers.length < 2
        ) {

          return callback?.({

            ok:
              false,

            error:
              "Uueks mänguks on vaja vähemalt 2 ühendatud mängijat."

          });

        }


        startGame(
          room
        );


        callback?.({

          ok:
            true

        });


        emitRoom(
          room
        );

      }
    );



    /* -----------------------------------------------------
       TELEFON LAHKUB
    ----------------------------------------------------- */

    socket.on(
      "disconnect",
      () => {


        const room =
          rooms.get(
            socket.data.roomCode
          );


        if (
          !room
        ) {
          return;
        }


        const player =

          room.players.find(
            item =>
              item.id ===
              socket.id
          );


        if (
          player
        ) {

          player.connected =
            false;

        }


        emitRoom(
          room
        );


        setTimeout(
          () => {


            const currentRoom =
              rooms.get(
                room.code
              );


            if (
              currentRoom &&
              currentRoom.players
                .every(
                  item =>
                    !item.connected
                )
            ) {


              clearTimeout(
                currentRoom.autoTimer
              );


              rooms.delete(
                room.code
              );

            }

          },

          15 *
          60 *
          1000

        );

      }
    );

  }
);


/* =========================================================
   SERVER
========================================================= */

const PORT =
  process.env.PORT ||
  3000;


server.listen(
  PORT,
  () => {

    console.log(
      `kõrva(n)uss server running on port ${PORT}`
    );

  }
);
