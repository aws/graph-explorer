import { waitFor } from "@testing-library/react";

// NOTE:
// Replaces functionality that was previously available through testing-library/react-hooks
//
// https://github.com/testing-library/react-hooks-testing-library/blob/chore/migration-guide/MIGRATION_GUIDE.md#waitforvaluetochange

export async function waitForValueToChange<T>(getValue: () => T) {
  const original = getValue();

  await waitFor(() => {
    expect(original).not.toBe(getValue());
  });
}
