async function main(clientId) {
	const data = await state.get(clientId) ?? {};
	data.counter = (data.counter ?? 0) + 1;
	await state.set(clientId, data);

	return `<p>hello — counter = ${data.counter}</p>
          <p>clientId: ${clientId}</p>
          <p>STATE: ${JSON.stringify(data)}</p>`;
}

return main
