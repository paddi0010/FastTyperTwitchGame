const tmi = require("tmi.js");
const config = require("./secret_data/config.json");
const channel = config.channels[0];
const fs = require('fs');
const cooldownData = JSON.parse(fs.readFileSync('data/cooldown.json', 'utf8'));

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
  client.say(channel, `FastTyperTwitchGame wurde hochgefahren. ✅ Tippt !start typer in den Chat ein, um das Spiel zu starten!`);
});

// File Request
const wordData = JSON.parse(fs.readFileSync('data/words.json', 'utf8'));

//variables
let typingGameActive = false;
let startTime;
let cooldownTime = cooldownData.cooldown;
let targetWord; // Hier global initialisieren

// Commands
client.on("message", (channel, tags, message, self) => {
  if (self) return;

  if (message.toLowerCase() === "!start typer") {
    startTypingGame(channel, tags);
  } else if (message.toLowerCase() === "!stop typer") {
    stopTypingGame(channel);
  } else if (message.toLowerCase().startsWith("!setcooldown") && (tags.mod || tags.username.toLowerCase() === channel.replace("#", ""))) {
    setCooldown(channel, tags, message);
  }
}); 

function startTypingGame(channel, tags) {
  if (!typingGameActive) {
    typingGameActive = true;
    startTime = Date.now();

    setTimeout(() => {
      typingGameActive = false;
    }, cooldownTime * 1000);

    const randomIndex = Math.floor(Math.random() * wordData.words.length);
    targetWord = wordData.words[randomIndex];

    client.say(channel, 'Schnell, tippe diesen Text ab: ' + targetWord);
  } else {
    client.say(channel, 'Ein Spiel läuft bereits!');
  }
}

function stopTypingGame(channel) {
  if (typingGameActive) {
    typingGameActive = false;
    client.say(channel, `Das Spiel wurde gestoppt.`);
  } else {
    client.say(channel, `Es läuft kein Spiel, das gestoppt werden kann.`);
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

function setCooldown(channel, tags, message) {

  const newCooldown = parseInt(message.split(' ')[1]);
 
  if (isNaN(newCooldown) || newCooldown <= 0) {
    client.say(channel, "Ungültige Eingabe. Bitte geben Sie eine positive Zahl ein.");
    return;
  }
  cooldownData.cooldown = newCooldown;
  fs.writeFileSync('data/cooldown.json', JSON.stringify(cooldownData, null, 2));
  cooldownTime = newCooldown;
  client.say(channel, `Cooldown wurde auf ${newCooldown} Sekunden gesetzt.`);
}

client.connect().catch(console.error);
