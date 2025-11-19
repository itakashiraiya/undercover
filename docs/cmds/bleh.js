async function main(clientId) {
	const data = await state.get(clientId) ?? {};
	// return data;
	// return JSON.stringify(data);
	data.counter = data.counter ?? 0
	data.counter++;
	/** @type {Response} */
	const err = await state.set(clientId, data);
	if (err) return await err.text();
	return `<p>hello from bar — ${new Date().toISOString()} counter = ${data.counter}</p>
<p>clientId: ${clientId}</p>`;
}

return main
