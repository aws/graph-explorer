module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      },
    ],
    "@babel/preset-react",
    "@babel/preset-typescript",
  ],
  plugins: [
    [
      "babel-plugin-react-compiler",
      {
        target: "19", // '17' | '18' | '19'
      },
    ],
  ],
};
