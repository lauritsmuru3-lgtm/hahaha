const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map();

const SONGS = [
  ["Dancing Queen","ABBA",1976],
  ["I Will Survive","Gloria Gaynor",1978],
  ["Call Me","Blondie",1980],
  ["Billie Jean","Michael Jackson",1983],
  ["Girls Just Want to Have Fun","Cyndi Lauper",1983],
  ["Take on Me","a-ha",1985],
  ["Like a Prayer","Madonna",1989],
  ["Nothing Compares 2 U","Sinéad O’Connor",1990],
  ["Smells Like Teen Spirit","Nirvana",1991],
  ["Zombie","The Cranberries",1994],
  ["Wonderwall","Oasis",1995],
  ["Torn","Natalie Imbruglia",1997],
  ["...Baby One More Time","Britney Spears",1998],
  ["Yellow","Coldplay",2000],
  ["Complicated","Avril Lavigne",2002],
  ["Crazy in Love","Beyoncé feat. Jay-Z",2003],
  ["Mr. Brightside","The Killers",2003],
  ["Rehab","Amy Winehouse",2006],
  ["Umbrella","Rihanna feat. Jay-Z",2007],
  ["Poker Face","Lady Gaga",2008],
  ["Viva la Vida","Coldplay",2008],
  ["Rolling in the Deep","Adele",2010],
  ["Somebody That I Used to Know","Gotye feat. Kimbra",2011],
  ["Get Lucky","Daft Punk feat. Pharrell Williams",2013],
  ["Royals","Lorde",2013],
  ["Take Me to Church","Hozier",2013],
  ["Chandelier","Sia",2014],
  ["Uptown Funk","Mark Ronson feat. Bruno Mars",2014],
  ["Shape of You","Ed Sheeran",2017],
  ["bad guy","Billie Eilish",2019],
  ["Blinding Lights","The Weeknd",2019],
  ["Levitating","Dua Lipa",2020],
  ["As It Was","Harry Styles",2022],
  ["Flowers","Miley Cyrus",2023],
  ["Espresso","Sabrina Carpenter",2024],
  ["Birds of a Feather","Billie Eilish",2024],
  ["Lose Control","Teddy Swims",2023],
  ["Watermelon Sugar","Harry Styles",2019],
  ["Happy","Pharrell Williams",2013],
  ["Crazy","Gnarls Barkley",2006],
  ["Hips Don't Lie","Shakira feat. Wyclef Jean",2006],
  ["Toxic","Britney Spears",2003],
  ["Seven Nation Army","The White Stripes",2003],
  ["Can't Get You Out of My Head","Kylie Minogue",2001],
  ["Freed from Desire","Gala",1996],
  ["Rhythm Is a Dancer","Snap!",1992],
  ["Enjoy the Silence","Depeche Mode",1990],
  ["Sweet Dreams (Are Made of This)","Eurythmics",1983],
  ["Another One Bites the Dust","Queen",1980],
  ["Heart of Glass","Blondie",1978],
  ["Stayin' Alive","Bee Gees",1977],
  ["Dreams","Fleetwood Mac",1977],
  ["Bohemian Rhapsody","Queen",1975],
  ["Heroes","David Bowie",1977],
  ["Superstition","Stevie Wonder",1972],
  ["Imagine","John Lennon",1971],
  ["Paint It, Black","The Rolling Stones",1966],
  ["Respect","Aretha Franklin",1967],
  ["California Dreamin'","The Mamas & the Papas",1965],
  ["Stand by Me","Ben E. King",1961]
];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function roomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({length: 4}, () => chars[Math.floor(Math.random()*chars.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function publicState(room, socketId) {
  const me = room.players.find(p => p.id === socketId);
  return {
    code: room.code,
    hostId: room.hostId,
    started: room.started,
    finished: room.finished,
    winnerId: room.winnerId || null,
    turnIndex: room.turnIndex,
    currentPlayerId: room.started && room.players.length ? room.players[room.turnIndex % room.players.length].id : null,
    currentSong: room.currentSong ? { title: room.currentSong[0], artist: room.currentSong[1] } : null,
    reveal: room.reveal ? {
      year: room.currentSong[2],
      correct: room.reveal.correct,
      guessedSlot: room.reveal.guessedSlot
    } : null,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      timelineCount: p.timeline.length,
      connected: p.connected,
      isHost: p.id === room.hostId
    })),
    me: me ? {
      id: me.id,
      name: me.name,
      timeline: me.timeline.map(s => ({ title: s[0], artist: s[1], year: s[2] }))
    } : null,
    targetCards: room.targetCards
  };
}

function emitRoom(room) {
  for (const p of room.players) {
    io.to(p.id).emit("state", publicState(room, p.id));
  }
}

function startRound(room) {
  if (room.deck.length === 0) room.deck = shuffle(SONGS);
  room.currentSong = room.deck.pop();
  room.reveal = null;
}

function startGame(room) {
  room.started = true;
  room.finished = false;
  room.turnIndex = 0;
  room.winnerId = null;
  room.deck = shuffle(SONGS);
  room.players.forEach(p => {
    p.timeline = [room.deck.pop()];
  });
  startRound(room);
}

function cleanupRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  if (room.players.every(p => !p.connected)) {
    rooms.delete(code);
  }
}

io.on("connection", socket => {
  socket.on("createRoom", ({name}, cb) => {
    const cleanName = String(name || "").trim().slice(0, 24);
    if (!cleanName) return cb?.({ok:false, error:"Sisesta nimi."});
    const code = roomCode();
    const room = {
      code,
      hostId: socket.id,
      players: [{id:socket.id, name:cleanName, timeline:[], connected:true}],
      started:false,
      finished:false,
      winnerId:null,
      turnIndex:0,
      deck:[],
      currentSong:null,
      reveal:null,
      targetCards:8
    };
    rooms.set(code, room);
    socket.data.roomCode = code;
    socket.join(code);
    cb?.({ok:true, code});
    emitRoom(room);
  });

  socket.on("joinRoom", ({name, code}, cb) => {
    const cleanName = String(name || "").trim().slice(0,24);
    const cleanCode = String(code || "").trim().toUpperCase();
    if (!cleanName) return cb?.({ok:false, error:"Sisesta nimi."});
    const room = rooms.get(cleanCode);
    if (!room) return cb?.({ok:false, error:"Sellist tuba ei leitud."});
    if (room.started) return cb?.({ok:false, error:"Mäng on juba alanud."});
    if (room.players.length >= 4) return cb?.({ok:false, error:"Tuba on täis."});
    if (room.players.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
      return cb?.({ok:false, error:"See nimi on juba kasutusel."});
    }
    room.players.push({id:socket.id, name:cleanName, timeline:[], connected:true});
    socket.data.roomCode = cleanCode;
    socket.join(cleanCode);
    cb?.({ok:true, code:cleanCode});
    emitRoom(room);
  });

  socket.on("startGame", cb => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb?.({ok:false, error:"Tuba puudub."});
    if (room.hostId !== socket.id) return cb?.({ok:false, error:"Ainult mängujuht saab alustada."});
    if (room.players.length !== 4) return cb?.({ok:false, error:"Mänguks peab olema täpselt 4 mängijat."});
    startGame(room);
    cb?.({ok:true});
    emitRoom(room);
  });

  socket.on("guessSlot", ({slot}, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.started || room.finished) return cb?.({ok:false, error:"Mäng ei käi."});
    const current = room.players[room.turnIndex % room.players.length];
    if (!current || current.id !== socket.id) return cb?.({ok:false, error:"Praegu pole sinu kord."});
    if (room.reveal) return cb?.({ok:false, error:"See voor on juba vastatud."});

    let index = Number(slot);
    if (!Number.isInteger(index)) return cb?.({ok:false, error:"Vigane valik."});
    index = Math.max(0, Math.min(index, current.timeline.length));

    const year = room.currentSong[2];
    const left = index === 0 ? -Infinity : current.timeline[index - 1][2];
    const right = index === current.timeline.length ? Infinity : current.timeline[index][2];
    const correct = year >= left && year <= right;

    room.reveal = {correct, guessedSlot:index};

    if (correct) {
      current.timeline.splice(index, 0, room.currentSong);
      if (current.timeline.length >= room.targetCards) {
        room.finished = true;
        room.winnerId = current.id;
      }
    }
    cb?.({ok:true});
    emitRoom(room);
  });

  socket.on("nextRound", cb => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.started) return cb?.({ok:false, error:"Mäng ei käi."});
    if (room.hostId !== socket.id) return cb?.({ok:false, error:"Ainult mängujuht saab jätkata."});
    if (!room.reveal) return cb?.({ok:false, error:"Esmalt peab mängija vastama."});
    if (room.finished) return cb?.({ok:false, error:"Mäng on lõppenud."});
    room.turnIndex = (room.turnIndex + 1) % room.players.length;
    startRound(room);
    cb?.({ok:true});
    emitRoom(room);
  });

  socket.on("restart", cb => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb?.({ok:false, error:"Tuba puudub."});
    if (room.hostId !== socket.id) return cb?.({ok:false, error:"Ainult mängujuht saab uut mängu alustada."});
    startGame(room);
    cb?.({ok:true});
    emitRoom(room);
  });

  socket.on("disconnect", () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room) return;
    const p = room.players.find(p => p.id === socket.id);
    if (p) p.connected = false;
    emitRoom(room);
    setTimeout(() => cleanupRoom(code), 15 * 60 * 1000);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Hitster 4 running on port ${PORT}`));
