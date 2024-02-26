const tmi = require("tmi.js");
const config = require("./secret_data/config.json");
const channel = config.channels[0];
const fs = require('fs');

const client = new tmi.Client({
  options: {
    debug: true,
  },
  connection: {
    reconnect: true,
    secure: true,
  },
  identity: config.identify,
  channels: config.channels,
});

client.on("connected", (address, port) => {
  console.log("Connected", "Adresse: " + address + " Port: " + port);
  client.say(channel, `FastTyperTwitchGame wurde hochgefahren. ✅ Tippt !start typer in den Chat ein, um das Spiel zu starten!`); // EN --> Message, when the Bot started / DE --> Nachricht, wenn der Bot gestartet ist. /
});


// File Request
const wordData = JSON.parse(fs.readFileSync('words.json', 'utf8'));

const randomIndex = Math.floor(Math.random() * wordData.words.length);
const targetWord = wordData.words[randomIndex];

console.log("Zufälliges Wort:", targetWord);

//variables
let typingGameActive = false;
let startTime;


// Commands
client.on("message", (channel, tags, message, self) => {
  if (self) return;

  if (message.toLowerCase() === "!start typer") {
    startTypingGame(channel, tags);
  }
});

function startTypingGame(channel, tags) {
  if (!typingGameActive) {
    typingGameActive = true;
    startTime = Date.now();

    client.say(channel, 'Schnell, tippe diesen Text ab: ' + targetWord);
  } else {
    client.say(channel, 'Ein Spiel läuft bereits!');
  }
}

function checkTyping(inputText, channel, tags) {
  if (inputText.trim() === targetWord) {
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000;
    client.say(channel, `Gratuliere ${tags.username}! Du hast den Text richtig in ${elapsedTime} Sekunden abgetippt.`);
    typingGameActive = false;
  }
}

client.on("message", (channel, tags, message, self) => {
  if (self) return;

  if (typingGameActive) {
    checkTyping(message, channel, tags);
  }
});



client.connect().catch(console.error);

