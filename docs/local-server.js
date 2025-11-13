// some fake state
// let clickCount = 0;

/**
 * @param {string} path
 * @returns {Promise<string>}
 */
function runscript(path) {
	return import(path + '.js').then(module => {
		if (module.default) return module.default()
		else throw new Error("Not able to run script")
	})
}

// intercept htmx requests
document.body.addEventListener('htmx:configRequest', (evt) => {
	// @ts-ignore
	const path = evt.detail.path;
	// @ts-ignore
	const target = evt.detail.target || document.querySelector(evt.detail.targetSelector);
	const swap = target.getAttribute('hx-swap') || 'innerHTML'; // default innerHTML

	if (path.startsWith('/server')) {
		evt.preventDefault(); // stop actual network request

		console.log("wow");
		return new Response("<p>testing</p>", {
			status: 200
		})
		// target.dispatchEvent(
		// 	new CustomEvent("htmx:afterOnLoad", {
		// 		detail: { xhr: { responseText: html, status: 200 } }
		// 	})
		// );
		const html = `<p>testing</p>`; // pretend this came from the backend

		// build a fake xhr-like object so htmx thinks it got a response
		const fakeXHR = {
			status: 200,
			responseText: html,
			getAllResponseHeaders: () => "",
			getResponseHeader: () => null,
		};
		// fire the correct htmx event to trigger swap etc.
		evt.detail.target.dispatchEvent(
			new CustomEvent('htmx:afterOnLoad', { detail: { xhr: fakeXHR } })
		);

		// // tell htmx “the request finished successfully”
		// htmx.trigger(evt.detail.target, "htmx:afterRequest", { xhr: fakeXHR });
		// htmx.trigger(evt.detail.target, "htmx:afterOnLoad", { xhr: fakeXHR });
		//
		// // let htmx process + swap normally
		// htmx.processResponse(html, fakeXHR, evt.detail.target);
		// runscript(path)
		// 	.then(ret => {
		// 		swap.innerHTML = ret; // update with script result
		// 	})
		// 	.catch(err => {
		// 		console.error(err);
		// 		swap.innerHTML = `<p style="color:red">Script failed: ${err.message}</p>`;
		// 	});
	}
});

