const addItems = <T>(state: Set<T>, value: T | T[]) => {
  const actualValues = Array.isArray(value) ? value : [value];
  const newState = new Set(state);
  actualValues.forEach(value => {
    if (!state.has(value)) {
      newState.add(value);
    }
  });
  return newState;
};

export default addItems;
