// Entry point only. The logic lives in `pnpm-pin.ts` so the tests can import it
// without an is-this-the-entry-point guard here, which would exit 0 having
// checked nothing whenever it guessed wrong.
import { main } from "./pnpm-pin.ts";

try {
  main();
} catch (error) {
  console.error(
    `packageManager pin check failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
