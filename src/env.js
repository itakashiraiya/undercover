let env;

/**
 * @param {any} envInit
 */
export function initEnv(envInit) {
	env = envInit;
}

export function getEnv() {
	if (!env) throw new Error("Env is not initialized!");
	return env;
}
