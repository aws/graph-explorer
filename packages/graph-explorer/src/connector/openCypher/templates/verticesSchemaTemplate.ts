const verticesSchemaTemplate = ({ type }: { type: string }) => {

  return `MATCH (v:\`${type}\`) RETURN v AS object LIMIT 1`;
};

export default verticesSchemaTemplate;