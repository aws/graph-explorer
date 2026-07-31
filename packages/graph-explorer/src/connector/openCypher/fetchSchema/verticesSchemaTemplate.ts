import { fragment } from "../fragments";

const verticesSchemaTemplate = ({ type }: { type: string }) => {
  return `MATCH (v:${fragment.identifier(type)}) RETURN v AS object LIMIT 1`;
};

export default verticesSchemaTemplate;
