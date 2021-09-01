require("dotenv").config();
const express = require("express");
const cors = require("cors");
const minify = require("express-minify");
const minifyHTML = require("express-minify-html");
const multer = require("multer");
const jsonpack = require("jsonpack");
const discordParser = require("./utilities/discordparser");
const discordMarkdown = require("./utilities/discordmarkdown.js");

const Discord = require("discord.js");
const client = new Discord.Client({
	intents: [
		"GUILDS",
		"GUILD_MESSAGES"
	]
});

const GUILD_ID = "790647809460142080";
const CHANNEL_ID = "809135609293307954";

const app = express();
const upload = multer();

const port = 3000;

app.use(express.static("public"));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(upload.array());

app.use(cors());
app.use(minify());
app.use(minifyHTML({
	override:      true,
	exception_url: false,
	htmlMinifier: {
		removeComments:            true,
		collapseWhitespace:        false,
		collapseBooleanAttributes: true,
		removeAttributeQuotes:     true,
		removeEmptyAttributes:     true,
		minifyJS:                  false
	}
}));

app.set("view engine", "ejs");

app.get("/", async (req, res) => {
	res.redirect("/channels/" + GUILD_ID + "/" + CHANNEL_ID);
});

app.get("/channels/:guildId/:channelId", async (req, res) => {
	const guildId = req.params.guildId;
	let channelId = req.params.channelId;

	try {
		const guild = await client.guilds.fetch(guildId);
		let channel;
		if (channelId != 0) {
			channel = await guild.channels.fetch(channelId);
		} else {
			const channels = await guild.channels.fetch();
			const filteredChannels = channels.filter(c => c.type == "GUILD_TEXT");
			channel = filteredChannels.find(c => c.name === "general");
			
			if (!channel) {
				channel = filteredChannels.first();
			}

			channelId = channel.id;
			res.redirect("/channels/" + guildId + "/" + channelId);
			return;
		}

		const canTalk = channel.permissionsFor(client.user).has("SEND_MESSAGES");
		
		res.render("index", { gid: guildId, cid: channelId, talkable: canTalk });
	} catch (error) {
		console.error(error);
		res.sendStatus(404);
	}
});

let listeners = [];

app.get("/events", (req, res) => {
	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		"Connection": "keep-alive"
	});

	res.write("\n");

	req.on("close", () => {
		const index = listeners.findIndex((arr) => {
			return arr[0] == res;
		});

		listeners.splice(index, 1);
	});

	listeners.push([res, {gid: req.query.gid, cid: req.query.cid}]);
});

app.post("/message", async (req, res) => {
	console.log("Sent a message ", req.query);
	if (req.query.message) {
		try {
			await (await (await client.guilds.fetch(req.query.gid)).channels.fetch(req.query.cid)).send(req.query.message);
			res.sendStatus(200);
		} catch {
			res.sendStatus(403);
		}
	}
});

app.get("/chatinfo", async (req, res) => {
	console.log("Requested chatroom details ", req.query);
	if (req.query.gid && req.query.cid) {
		const guild = await client.guilds.fetch(req.query.gid);
		const channel = await guild.channels.fetch(req.query.cid);
		const iconURL = guild.iconURL({ dynamic: false, format: "png", size: 16 });

		res.writeHead(200, {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache"
		});
		res.end(JSON.stringify({
			iconURL: iconURL,
			serverName: guild.name,
			channelName: channel.name
		}));
	} else {
		res.sendStatus(400);
	}
});

app.get("/getservers", async (req, res) => {
	const guilds = await client.guilds.fetch();
	let data = [];

	guilds.forEach((guild) => {
		data.push({
			iconURL: guild.iconURL({ dynamic: false, format: "png", size: 32 }),
			id: guild.id
		});
	});

	res.writeHead(200, {
		"Content-Type": "application/json",
		"Cache-Control": "no-cache"
	});
	res.end(JSON.stringify(data));
});

app.get("/getchannels", async (req, res) => {
	if (req.query.gid) {
		const guildId = req.query.gid;
		const guild = await client.guilds.fetch(guildId);
		const channels = await guild.channels.fetch();

		let data = [];
		
		channels.forEach((channel) => {
			if (channel.type !== "GUILD_TEXT") return;
			let info = { name: channel.name, id: channel.id };
			data.push(info);
		});

		res.writeHead(200, {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache"
		});
		res.end(JSON.stringify(data));
	} else {
		res.sendStatus(400);
	}
});

app.listen(port, () => {
	console.log(`DSiCord listening at port ${port}`);
});

client.on("ready", () => {
	console.log("Discord client is ready.");
});

client.on("messageCreate", (message) => {
	if (message.content == "embedtest") {
		const embed = new Discord.MessageEmbed();
		embed.setAuthor("knoddy", "https://media.discordapp.net/attachments/809135609293307954/875537718321483776/unknown.png");
		embed.setColor("AQUA");
		embed.setDescription("*A*M**ON**__GUS__!!!!");
		embed.addField("T*h*i__s__", "__W__as ~~e~~pic", true);
		embed.addField("This", "Was epic", true);
		embed.addField("This", "Was epic", true);
		embed.addField("This", "Was epic", true);
		embed.setImage("https://media.discordapp.net/attachments/809135609293307954/875537718321483776/unknown.png");
		embed.setThumbnail("https://media.discordapp.net/attachments/809135609293307954/875537718321483776/unknown.png");
		embed.setTitle("**Th**is __is__ an embed");
		embed.setFooter("This is footer", "https://media.discordapp.net/attachments/809135609293307954/875537718321483776/unknown.png");
		
		message.channel.send({ embeds: [embed] });
		return;
	}

	listeners.forEach(async (arr) => {
		const res = arr[0];
		const data = arr[1];

		const guildId = message?.guildId;
		const channelId = message?.channelId;

		if (data.gid == guildId && data.cid == channelId) {
			res.write(`id: ${message.id}\n`);
			res.write("event: message\n");

			const stickers = await discordParser.parseStickers(message);
			const parsedMessage = discordMarkdown.toHTML(message.content, {
				discordCallback: {
					user: async (node) => "@" + (await message.guild.members.fetch(node.id)).displayName
				},
				escapeHTML: false
			}).replace(/(?:\r\n|\r|\n)/g, "<br>");

			const data = {
				author: message.member.displayName,
				content: parsedMessage,
				color: message.member.displayHexColor,
				emojis: discordParser.parseEmojis(parsedMessage),
				attachments: discordParser.parseAttachments(message),
				stickers: stickers,
				embeds: discordParser.parseEmbeds(message)
			};
			res.write("data:" + jsonpack.pack(data));
			res.write("\n\n");
		}
	});
});

client.login(process.env.BOT_TOKEN);