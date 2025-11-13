// service-worker.js
self.addEventListener('install', _event => {
	console.error('SW install triggered'); // use error to make it pop
	// @ts-ignore activate immediately (useful for dev)
	self.skipWaiting();
});

self.addEventListener('activate', event => {
	// @ts-ignore
	for (let key in functions) delete functions[key];
	event.waitUntil(self.clients.claim());
});

/**
 * @param {string} path
 * @returns {Promise<string>}
 */
async function runscript(path) {
	// const module = await import(path + '.js');
	const module = await import('/serve/bleh.js');
	if (module.default) return module.default();
	else throw new Error("Not able to run script");
}

/**
 * @param {string} path
 */
async function runmodule(path) {
	if (!functions[path]) {
		const res = await fetch("/cmds/bleh.js", { cache: "no-store" }).catch(err => {
			throw new Error("Fetch error: " + err.message);
		});
		const text = await res.text();
		functions[path] = (0, eval)("(()=> {" + text + "})()");
	}
	return functions[path]();
}

/**
 * @param {number} code
 * @param {BodyInit} html
 */
function respond(code, html) {
	return new Response(html, {
		status: code,
		// headers: { 'Content-Type': 'text/html; charset=utf-8' }
		headers: { 'Content-Type': 'application/javascript' }
	});
}

/**
 * @param {string} errMsg
 */
function errorRespond(errMsg) {
	return respond(200, `<p style="color:red">SW error: ${errMsg}</p>`)
}

function devHandling(url) {
	if (url.searchParams.has('dev')) {
		for (let key in functions) delete functions[key];
	}
}

const functions = {
}

self.addEventListener('fetch', event => {
	// @ts-ignore
	const url = new URL(event.request.url);
	const path = url.pathname;

	devHandling(url);

	// intercept requests that start with /server (adjust as needed)
	if (path.startsWith('/server')) {
		// Prevent the request from going to network and respond with our HTML
		// @ts-ignore
		event.respondWith((async () => {
			try {
				const ret = await runmodule(path);
				// const ret = text;

				return new Response(ret, {
					status: 200,
					headers: { 'Content-Type': 'text/html; charset=utf-8' }
				});
			} catch (err) {
				return errorRespond(err.message)
			}

		})());
	}

	// otherwise, let the request go to network as usual
	return; // let default fetch proceed
});
