function html(player, undercovers, mr_whites) {
	const bla = `<form hx-post="/sync" hx-trigger="input from:#a,#b" hx-target="#a,#b" hx-include="#a,#b" hx-vals='{"changed":"this.id"}'>
  <input type="number" id="a" name="a" value="2" placeholder="A">
  <input type="number" id="b" name="b" value="2" placeholder="B">
</form>`;
	return bla
}

function main(clientId) {
	return html();
}

return main
