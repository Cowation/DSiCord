const twemojiParser = require("twemoji-parser");
const discordMarkdown = require("./discordmarkdown");
const https = require("https");
const renderLottie = require("puppeteer-lottie");
const fs = require("fs");

function download(sticker) {
	return new Promise((resolve, reject) => {
		const lottie = fs.createWriteStream("./downloads/".concat(sticker.id, ".json"));

		https.get(sticker.url, (response) => {
			response.pipe(lottie);
			lottie.on("finish", () => {
				lottie.end();
				resolve("./downloads/".concat(sticker.id, ".json"));
			});
			lottie.on("error", (error) => {
				reject(error);
			});
		});

	});
}

function exists(path) {
	return new Promise((resolve) => {
		fs.access(path, (error) => {
			if (!error) {
				resolve(true);
			} else {
				resolve(false);
			}
		});
	});
}

module.exports = class DiscordParser {
	static parseEmojis(input) {
		const regex = /<a?:(\w*):(\d*)>/gm;

		let emojis = [];

		let m;
		while ((m = regex.exec(input)) !== null) {
			// This is necessary to avoid infinite loops with zero-width matches
			if (m.index === regex.lastIndex) {
				regex.lastIndex++;
			}
			
			// The result can be accessed through the `m`-variable.
			const full = m[0];
			const id = m[2];
			// const isAnimated = full.indexOf("<a") !== -1;
		
			emojis.push({
				url: "https://cdn.discordapp.com/emojis/".concat(id, ".png", "?v=1"),
				indices: [m.index, m.index + full.length],
				text: full,
				type: "emoji"
			});
		}

		const twemojis = twemojiParser.parse(input, { assetType: "png" });
		let allEmojis = emojis.concat(twemojis);
		allEmojis.sort((a, b) => a.indices[0] - b.indices[0]);

		return allEmojis;
	}

	static parseAttachments(message) {
		let attachments = [];

		message.attachments.forEach((attachment) => {
			const previewables = ["image/png", "image/jpeg", "image/gif"];
			const canPreview = previewables.indexOf(attachment.contentType) !== -1;

			let width;
			let height;

			if (canPreview) {
				const maxWidth = 170;
				const maxHeight = 100;
				const srcWidth = attachment.width;
				const srcHeight = attachment.height;

				if (srcWidth <= maxWidth && srcHeight <= maxHeight) {
					width = srcWidth;
					height = srcHeight;
				} else {
					const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
					width = Math.floor(srcWidth * ratio);
					height = Math.floor(srcHeight * ratio);
				}
				
			}

			const convertBytes = (bytes) => {
				const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
			
				if (bytes == 0) {
					return "n/a";
				}
			
				const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
			
				if (i == 0) {
					return bytes + " " + sizes[i];
				}
			
				return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
			};

			attachments.push({
				name: attachment.name,
				url: canPreview ? attachment.proxyURL.concat("?format=png&width=", width, "&height=", height) : null,
				size: convertBytes(attachment.size)
			});
		});

		return attachments;
	}

	static async parseStickers(message) {
		let stickers = [];
			
		for (const sticker of Array.from(message.stickers.values())) {
			const stickerFormat = sticker.format;
			let url;

			if (stickerFormat === "PNG" || stickerFormat === "APNG") {
				url = "https://media.discordapp.net/stickers/".concat(sticker.id, ".png?width=90&height=90&passthrough=false");
			} else if (stickerFormat === "LOTTIE") {
				const renderExists = await exists("./public/stickers/".concat(sticker.id, ".png"));
					
				if (!renderExists) {
					const lottiePath = await download(sticker);
						
					await renderLottie({
						path: lottiePath,
						width: 100,
						height: 100,
						output: "./public/stickers/".concat(sticker.id, ".png")
					});
				}

				url = "/stickers/".concat(sticker.id, ".png");
			}

			stickers.push(url);
		}

		return stickers;
	}

	static parseEmbeds(message) {
		let embeds = [];

		message.embeds.forEach((embed) => {
			let fields = [];
			for (const field of embed.fields) {
				fields.push({
					name: (field?.name ? discordMarkdown.toHTML(field?.name)?.replace(/(?:\r\n|\r|\n)/g, "<br>") : null),
					value: (field?.value ? discordMarkdown.toHTML(field?.value)?.replace(/(?:\r\n|\r|\n)/g, "<br>") : null),
					inline: field?.inline
				});
			}

			let compressed = {
				author: embed?.author?.name?.replace(/(?:\r\n|\r|\n)/g, "<br>"),
				authorIcon: embed?.author?.iconURL,
				color: embed?.hexColor,
				description: (embed?.provider ? null : (embed?.description ? discordMarkdown.toHTML(embed?.description)?.replace(/(?:\r\n|\r|\n)/g, "<br>") : null)),
				fields: fields,
				footer: embed?.footer?.text?.replace(/(?:\r\n|\r|\n)/g, "<br>"),
				footerIcon: embed?.footer?.iconURL,
				image: embed?.image?.url,
				thumbnail: embed?.thumbnail?.url,
				title: (embed?.title ? discordMarkdown.toHTML(embed?.title)?.replace(/(?:\r\n|\r|\n)/g, "<br>") : null),
				url: embed?.url,
				// Video is not included here due to DSi browser limitations
			};

			embeds.push(compressed);
		});

		return embeds;
	}
};