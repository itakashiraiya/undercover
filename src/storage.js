const path = require("path")

const data_root = "data"

export const active_data = init();

export function test() {
	return getStoragePath();
}

function init() {
	return getJsonData();
}

export function save() {
	storeJsonData(active_data);
}

/**
 * @param {string} [category]
 */
function getStoragePath(category) {
	const root = path.join(data_root, "storage");
	if (category == null) {
		return path.join(root, "universal");
	} else {
		return path.join(root, "categories", category);
	}
}

/**
 * @returns {{ [key: string]: any }?}
 */
function getJsonData() {
	return null;
}

/**
 * @param {{ [key: string]: any }} data
 */
function storeJsonData(data) {
}
