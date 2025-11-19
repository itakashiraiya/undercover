navigator.serviceWorker.addEventListener("message", event => {
	const msg = event.data;
	const type = msg?.type;
	if (type === "REQUEST_STATE") {
		event.source.postMessage({
			type: "STATE_RESPONSE",
			requestId: msg.requestId,
			state: sessionStorage.getItem("myState")
		});
	} else if (type === "UPDATE_SESSION_STATE") {
		sessionStorage.setItem("myState", event.data.state);
	}
});

navigator.serviceWorker.register('/service-worker.js')
	.then(reg => console.log('SW registered, scope:', reg.scope))
	.catch(err => console.error('SW registration failed:', err));
