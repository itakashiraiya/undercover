/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
/*
export default {
  async fetch(request, env, ctx) {
    // You can view your logs in the Observability dashboard
    console.info({ message: 'Hello World Worker received a request!' });
    return new Response('Hello World!');
  }
};*/

import * as storage from "./storage.js";
import * as ai from "./ai_request.js";
import { initEnv } from "./env.js";


// @ts-ignore
// addEventListener('fetch', event => event.respondWith(handle(event.request)))

/**
 * Bindings expected:
 * - WORDPAIR_KV (Workers KV namespace)
 * - OPENAI_API_KEY (secret)
 * - FRONTEND_KEY (secret)
 * - ALLOWED_ORIGIN (your GitHub Pages URL)
 */

const RATE_LIMIT_WINDOW = 60 // seconds
const MAX_PER_WINDOW = 20

/**
 * @param {any} origin
 */
function jsonHeaders(origin) {
	return {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': origin,
		'Access-Control-Allow-Methods': 'POST,OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type,x-client-key',
		'Access-Control-Max-Age': '86400'
	}
}

/**
 * @param {{ method: string; headers: { get: (arg0: string) => any; }; }} request
 */
export default {
	/**
	 * @param {{method: string;headers: {get: (arg0: string) => any;};}} request
	 */
	async fetch(request, env) {
		initEnv(env);
		// @ts-ignore
		if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: jsonHeaders(env.ALLOWED_ORIGIN) })

		// Frontend key check
		const key = request.headers.get('x-client-key')
		// @ts-ignore
		if (!key || key !== env.FRONTEND_KEY) {
			// return new Response(JSON.stringify({ error: 'unauthorized :p' }), { status: 401, headers: jsonHeaders(ALLOWED_ORIGIN) })
		}

		// Rate limiting per IP
		const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'anon'
		const rlKey = `rl:${ip}`
		try {
			const raw = await env.WORDPAIR_KV.get(rlKey)
			let val = raw ? JSON.parse(raw) : { count: 0, ts: Date.now() }
			const now = Date.now()
			if (now - val.ts > RATE_LIMIT_WINDOW * 1000) val = { count: 0, ts: now }
			val.count++
			// @ts-ignore
			await env.WORDPAIR_KV.put(rlKey, JSON.stringify(val), { expirationTtl: RATE_LIMIT_WINDOW + 5 })
			if (val.count > MAX_PER_WINDOW) {
				// @ts-ignore
				return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers: jsonHeaders(env.ALLOWED_ORIGIN) })
			}
		} catch (e) {
			console.warn('KV error', e)
		}

		const out = await ai.request();
		return new Response(JSON.stringify(out), { status: 200, headers: jsonHeaders(env.ALLOWED_ORIGIN) })
	},
};
