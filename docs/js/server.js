const genId = (() => {
	let nextId = 0;
	return (prefix = "id") => {
		nextId++;
		return `${prefix}-${nextId}`;
	}
})();

/**
 * @param {string | URL} url
 */
function getUrlArgs(url) {
	const params = new URLSearchParams(new URL(url, "http://dummy").search);
	/** @type Record<string, string> */
	const ret = {};
	params.forEach((value, key) => {
		ret[key] = value
	});
	return ret;
}

// @ts-ignore
var server = sinon.fakeServer.create();
server.autoRespond = true;
server.fakeHTTPMethods = true;

/** @typedef {"innocent"|"undercover"|"mrWhite"} Role */

const Roles = Object.freeze({
	INNOCENT: "innocent",
	UNDERCOVER: "undercover",
	MRWHITE: "mrWhite"
});

let count = {
	players: 4,
	undercovers: 1,
	mrWhites: 1,
};

const words = ["magic", "mana"];

/**
 * @param {Role} role
 */
function getWord(role) {
	switch (role) {
		case Roles.INNOCENT: return words[0];
		case Roles.UNDERCOVER: return words[1];
		case Roles.MRWHITE: return "You are Mr. White!";
		default: return "Uknown role!!!";
	}
}


let players = null;

const GameState = Object.freeze({
	SETUP: "setup",
	ONGOING: "ongoing",
	FINISHED: "finished",
});

let gameState = GameState.SETUP;

/**
 * @param {any} req
 * @param {string} msg
 * @param {number} code
 * @param {string} type
 */
function respond(req, msg, code, type) {
	req.respond(code, { "Content-Type": type }, msg);
}

/**
 * @param {any} req
 * @param {string} html
 */
function respondHtml(req, html, code = 200) {
	respond(req, html, code, "text/html");
}

/**
 * @param {any} req
 */
function respondBad(req, msg = "Bad request", code = 400) {
	respond(req, "application/json", code, JSON.stringify({ error: msg }));
}

/**
 * @param {any} req
 */
function respondDeny(req, msg = "Not allowed right now", code = 403) {
	respond(req, "application/json", code, JSON.stringify({ error: msg }));
}

server.respondWith("POST", "/start-game", function(req) {
	if (gameState !== GameState.SETUP) { respondDeny(req, "Cant call in setup!"); return; };
	// @ts-ignore
	gameState = GameState.ONGOING;

	const params = new URLSearchParams(req.requestBody);
	count.players = parseInt(params.get("players"))
	count.undercovers = parseInt(params.get("undercovers"));
	count.mrWhites = parseInt(params.get("mrWhites"));

	if (Object.values(count).some(v => typeof v !== "number" || v < 0)) {
		respondBad(req);
	}

	players = new Array(count.players);

	for (var i = 0; i < players.length; i++) {
		if (i < count.undercovers) players[i] = Roles.UNDERCOVER;
		else if (i < count.undercovers + count.mrWhites) players[i] = Roles.MRWHITE;
		else players[i] = Roles.INNOCENT;
	}

	for (let i = players.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[players[i], players[j]] = [players[j], players[i]];
	}

	var html = `
      <p>Assignments: ${players.map(x => getWord(x)).toString()}</p>
    `;
	respondHtml(req, html);
});

const add_player_id = genId("add-player-swap");

console.log("add player id", add_player_id);

const checkUrlGet = (/** @type {string} */ name, /** @type {string} */ url) => {
	return url === name || url.startsWith(name + "?");
};

server.respondWith("GET", function(/** @type {string} */ url) {
	return checkUrlGet("/add-player", url);
}, function(req) {
	if (gameState !== GameState.SETUP) { respondDeny(req, "Cant call in setup!"); return; };

	const params = getUrlArgs(req.url);
	const n = parseInt(params["n"] || "1");
	const hook = params["rm-hook"] || "this.closest(\"li\"').remove()";
	const btn = `
		<button hx-on='click: ` + hook + `'>Remove player</button>`;

	var html = (`
		<li>
			<span draggable="true" style="cursor: grab;">=</span>
			<input type="text" placeholder="Player name">` + btn + `
		</li>`).repeat(n) + `
		<div id="${add_player_id}"></div>`;
	respondHtml(req, html)
});

server.respondWith("GET", (/** @type {string} */ url) => {
	return checkUrlGet("/add-player-button", url);
}, function(req) {
	if (gameState !== GameState.SETUP) { respondDeny(req, "Cant call in setup!"); return; };

	const params = getUrlArgs(req.url);
	const hook = params["rm-hook"];
	const vals = hook ? (" hx-vals='{\"rm-hook\":\"" + hook + "\"}'") : "";

	var html = `
		<button hx-get="/add-player" hx-swap="outerHTML" hx-target="#${add_player_id}"${vals}>Add player</button>`;
	respondHtml(req, html)
});
