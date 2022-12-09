import memoizeOne from "memoize-one";

const withClassNamePrefix = memoizeOne((prefix = "ft") => (className: string) =>
  `${prefix}-${className}`
);

export default withClassNamePrefix;
