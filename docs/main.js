navigator.serviceWorker.addEventListener("message", event => {
	const msg = event.data;
	const type = msg?.type;

	if (type === "REQUEST_STATE") {
		const stateString = sessionStorage.getItem("myState");
		const stateObj = stateString ? JSON.parse(stateString) : {};
		event.source.postMessage({
			type: "STATE_RESPONSE",
			requestId: msg.requestId,
			state: stateObj
		});
	} else if (type === "UPDATE_SESSION_STATE") {
		// store as JSON string
		sessionStorage.setItem("myState", JSON.stringify(event.data.state));
	}
});

navigator.serviceWorker.register('/service-worker.js')
	.then(reg => console.log('SW registered, scope:', reg.scope))
	.catch(err => console.error('SW registration failed:', err));
