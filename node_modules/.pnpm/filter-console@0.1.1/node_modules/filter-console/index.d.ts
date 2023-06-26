declare namespace filterConsole {
	type Console = Record<
		'log' | 'debug' | 'info' | 'warn' | 'error',
		(message?: unknown, ...optionalParams: unknown[]) => void
	>;

	interface Options {
		/**
		Console methods to filter.

		@default ['log', 'debug', 'info', 'warn', 'error']
		*/
		readonly methods?: ReadonlyArray<
			'log' | 'debug' | 'info' | 'warn' | 'error'
		>;

		/**
		Use a custom `console` object. Can be useful for testing or mocking.

		@default console
		*/
		readonly console?: Console;
	}
}

/**
Filter out unwanted `console.log()` output.

Can be useful when you don't control the output, for example, filtering out PropType warnings from a third-party React component.

@param excludePatterns - Console output that matches any of the given patterns are filtered from being logged.

Filter types:
- `string`: Checks if the string pattern is included in the console output.
- `RegExp`: Checks if the RegExp pattern matches the console output.
- `Function`: Receives the console output as a string and is expected to return a truthy/falsy value of whether to exclude it.
@returns A function, which when called, disables the filter.

@example
```
import filterConsole = require('filter-console');

const disableFilter = filterConsole(['🐼']);

const log = () => {
	console.log('');
	console.log('🦄');
	console.log('🐼');
	console.log('🐶');
};

log();

disableFilter();

log();

// $ node example.js
//
// 🦄
// 🐶
//
// 🦄
// 🐼
// 🐶
```
*/
declare function filterConsole(
	excludePatterns: Array<string | RegExp | ((output: string) => boolean)>,
	options?: filterConsole.Options
): () => void;

export = filterConsole;
