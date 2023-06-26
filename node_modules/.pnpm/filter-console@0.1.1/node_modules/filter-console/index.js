'use strict';
const util = require('util');

module.exports = (excludePatterns, options) => {
	options = {
		console,
		methods: [
			'log',
			'debug',
			'info',
			'warn',
			'error'
		],
		...options
	};

	const {console: consoleObject, methods} = options;
	const originalMethods = methods.map(method => consoleObject[method]);

	const check = string => {
		for (const pattern of excludePatterns) {
			if (typeof pattern === 'string') {
				if (string.includes(pattern)) {
					return true;
				}
			} else if (typeof pattern === 'function') {
				if (pattern(string)) {
					return true;
				}
			} else if (pattern.test(string)) {
				return true;
			}
		}

		return false;
	};

	for (const method of methods) {
		const originalMethod = consoleObject[method];

		consoleObject[method] = (...args) => {
			if (check(util.format(...args))) {
				return;
			}

			originalMethod(...args);
		};

		// Exposed for testing
		if (process.env.NODE_ENV === 'test') {
			consoleObject[method].original = originalMethod;
		}
	}

	return () => {
		for (const [index, method] of methods.entries()) {
			consoleObject[method] = originalMethods[index];
		}
	};
};
