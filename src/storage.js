const path = require("path")

const data_root = "data"

export function test() {
	return getStoragePath();
}

/**
 * @param {string} [user]
 */
function getStoragePath(user) {
	const root = path.join(data_root, "storage");
	if (user == null) {
		return path.join(root, "universal");
	} else {
		return path.join(root, "users", user);
	}
}
