import { prompt, length } from "./prompt";
import { getEnv } from "./env";

/** @param string[][] */
export async function request() {
	const payload = {
		model: 'command-a-03-2025',
		messages: [
			{ role: 'system', content: 'You are a tiny word-pair generator. Output only a JSON array with pairs (arrays of length 2) with the specified length.' },
			{ role: 'user', content: prompt }
		],
		max_tokens: 300, // estimate is length*4, *6 for leeway
		temperature: 0.9,
		frequency_penalty: 0.8,     // try something between 0.2 and 1
		presence_penalty: 0.5,      // a bit lower maybe
		seed: Math.floor(Math.random() * 1000000)
	}

	const llmResp = await fetch('https://api.cohere.com/v2/chat', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${getEnv().API_KEY}`
		},
		body: JSON.stringify(payload)
	})

	let out = []
	let str = "";
	const parsed = await llmResp.json()
	if (!(str = parsed.message?.content?.[0]?.text?.trim())) {
		// throw new Error("Returned json response not formated correctly!")
		throw new Error("Returned json response not formated correctly\nResponse: " + JSON.stringify(parsed));
	}
	var match = str.match(/\[(?:[\s\S]*)\]/);
	match = match ? match[0] : str;

	if (match[match.length - 2] !== ']') {
		match += ']'
	}

	try {
		out = JSON.parse(match);
	} catch (e) {
		throw new Error(`ERROR: ${e.message}\nINFO: ${match}`);
	}

	const seen = new Map();
	/** @type {string[][]} */
	const uniquePairs = [];

	for (const [a, b] of out) {
		const key = a < b ? `${a}|${b}` : `${b}|${a}`; // normalize without sorting
		if (!seen.has(key)) {
			seen.set(key, true);
			uniquePairs.push([a, b]);
		}
	}

	return {
		resp: uniquePairs, debug: {
			response: parsed,
			og: { str: str, len: str.match(/\[/g).length - 1 },
			parsed: { str: JSON.stringify(out), len: out.length },
			filtered: { str: JSON.stringify(uniquePairs), len: uniquePairs.length, num_filtered: out.length - uniquePairs.length },
		}
	};
}
