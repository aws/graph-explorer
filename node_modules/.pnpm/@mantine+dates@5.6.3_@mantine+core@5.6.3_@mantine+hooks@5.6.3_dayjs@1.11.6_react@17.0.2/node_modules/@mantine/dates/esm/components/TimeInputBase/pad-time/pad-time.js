function padTime(value) {
  const _val = parseInt(value, 10);
  return _val >= 10 ? _val.toString() : `0${_val}`;
}

export { padTime };
//# sourceMappingURL=pad-time.js.map
