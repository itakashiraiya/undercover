var counter = 0;

function main() {
	counter++;
	return `<p>hello from bar — ${new Date().toISOString()}
counter = ${counter}</p>`;
}

return main
