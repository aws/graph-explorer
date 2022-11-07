const edgeSchemaTemplate = ({ type }: { type: string }) => {
  const labels = type.split("::");
  let template = "g.E()";

  for (const label of labels) {
    template += `.hasLabel("${label}")`;
  }

  template += ".limit(1)";

  return template;
};

export default edgeSchemaTemplate;
