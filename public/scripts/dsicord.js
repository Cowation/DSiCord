var eventSource = new EventSource("/events"),
	xhrInfo = new XMLHttpRequest(),
	xhrGetServers = new XMLHttpRequest(),
	xhrSend = new XMLHttpRequest(),
	servericon = null,
	servername = null,
	channelname = null,
	serverlist = null,
	chatwindow = null,
	startmessage = null,
	messageBox = null

function sendMessage() {
	if (messageBox.value) {
		xhrSend.abort()
		xhrSend.open("POST", "/message?message=" + encodeURIComponent(messageBox.value))
		xhrSend.send(null)

		messageBox.value = ""
	}

	return false
}

eventSource.addEventListener("message", function(event) {
	var data = JSON.parse(event.data)

	if (data.color == "#000000") {
		data.color = "#e6e5e3"
	}
	
	var parentSpan = document.createElement("span")
	var nameSpan = document.createElement("span")
	nameSpan.innerText = data.author + ": "
	nameSpan.style.color = data.color
	var messageNode = document.createTextNode(data.content)

	parentSpan.appendChild(nameSpan)
	parentSpan.appendChild(messageNode)

	var chatWindow = document.getElementById("chatwindow")

	var br = document.createElement("br")

	chatWindow.appendChild(parentSpan)
	chatWindow.appendChild(br)

	chatWindow.scrollTop = chatWindow.scrollHeight;
})

xhrInfo.onreadystatechange = function() {
	if (xhrInfo.readyState == 4) {
		if (xhrInfo.responseText) {
			var data = JSON.parse(xhrInfo.responseText)
		
			servericon.src = data.iconURL
			servername.innerText = data.serverName
			channelname.innerText = "#" + data.channelName
			startmessage.innerText = "This is the start of the #" + data.channelName + " channel."
		}
	}
}

xhrGetServers.onreadystatechange = function() {
	if (xhrGetServers.readyState == 4) {
		if (xhrGetServers.responseText) {
			var data = JSON.parse(xhrGetServers.responseText)

			for (var i = 0; i < data.length; i++) {
				var guild = data[i]
				var iconURL = guild.iconURL
				var guildId = guild.id

				var link = document.createElement("a")
				var iconImage = document.createElement("img")

				iconImage.src = iconURL
				link.href = "/" + guildId + "/790647811594518580"

				link.appendChild(iconImage)

				serverlist.appendChild(link)
			}
		}
	}
}

window.onload = function() {
	servericon = document.getElementById("servericon")
	servername = document.getElementById("servername")
	channelname = document.getElementById("channelname")
	serverlist = document.getElementById("serverlist")
	chatwindow = document.getElementById("chatwindow")
	startmessage = document.getElementById("startmessage")
	messageBox = document.getElementById("messagebox")

	xhrInfo.abort()
	xhrInfo.open("GET", "/chatinfo?gid=" + "790647809460142080" + "&cid=" + "809135609293307954")
	xhrInfo.send(null)

	xhrGetServers.abort()
	xhrGetServers.open("GET", "/getservers")
	xhrGetServers.send(null)

	document.body.scrollTop = 176
}