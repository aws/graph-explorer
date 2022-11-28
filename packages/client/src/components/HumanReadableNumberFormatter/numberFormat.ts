import isNumber from "lodash/isNumber";

const PREFIXES: { [key: string]: string } = {
  "24": "Y",
  "21": "Z",
  "18": "E",
  "15": "P",
  "12": "T",
  "9": "G",
  "6": "M",
  "3": "k",
  "0": "",
  "-3": "m",
  "-6": "µ",
  "-9": "n",
  "-12": "p",
  "-15": "f",
  "-18": "a",
  "-21": "z",
  "-24": "y",
};

function getExponent(n: number) {
  if (n === 0) {
    return 0;
  }
  return Math.floor(Math.log10(Math.abs(n)));
}

const toPrecision = (num: number, digits: number) => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
};

function precise(num: number, digits: number) {
  return Number.parseFloat(toPrecision(num, digits));
}

export const getSymbolForNumber = (num: number) => {
  const e = Math.max(Math.min(3 * Math.floor(getExponent(num) / 3), 24), -24);
  return PREFIXES[e];
};

export const formatWithoutSymbol = (num: number, digits = 2) => {
  const exponent = Math.max(
    Math.min(3 * Math.floor(getExponent(num) / 3), 24),
    -24
  );
  return precise(num / Math.pow(10, exponent), digits).toString();
};

export const toHumanString = (num: number | string, digits = 2) => {
  const asNumber = isNumber(num) ? num : Number.parseFloat(num);
  return formatWithoutSymbol(asNumber, digits) + getSymbolForNumber(asNumber);
};
