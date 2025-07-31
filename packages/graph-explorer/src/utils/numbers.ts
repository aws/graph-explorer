export function isEven(n: number) {
  return n % 2 === 0;
}

export function isOdd(n: number) {
  return !isEven(n);
}
