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
		max_tokens: length * 6, // estimate is length*4, *6 for leeway
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
	try {
		let str = "";
		const parsed = await llmResp.json()
		if (!(str = parsed.message?.content?.[0]?.text?.trim())) {
			throw new Error("Returned json response not formated correctly!")
		}
		const match = str.match(/\[(?:[\s\S]*)\]/);
		str = match ? match[0] : str;

		if (str[str.length - 2] !== ']') {
			str += ']'
		}

		out = JSON.parse(str);

		const seen = new Map();
		const uniquePairs = [[""]];
		uniquePairs.pop()

		for (const [a, b] of out) {
			const key = a < b ? `${a}|${b}` : `${b}|${a}`; // normalize without sorting
			if (!seen.has(key)) {
				seen.set(key, true);
				uniquePairs.push([a, b]);
			}
		}

		return {
			resp: uniquePairs, debug: {
				og: { str: str, len: str.match(/\[/g).length - 1 },
				parsed: { str: JSON.stringify(out), len: out.length },
				filtered: { str: JSON.stringify(uniquePairs), len: uniquePairs.length },
			}
		};
	}
	catch (e) { throw e }
}
