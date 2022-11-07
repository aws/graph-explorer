const vertexSchemaTemplate = ({ type }: { type: string }) => {
  const labels = type.split("::");
  let template = "g.V()";

  for (const label of labels) {
    template += `.hasLabel("${label}")`;
  }

  template += ".limit(1)";

  return template;
};

export default vertexSchemaTemplate;
