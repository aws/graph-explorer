export type SparqlFetch = <TResult = any>(
  queryTemplate: string
) => Promise<TResult>;

export type RawValue = {
  datatype?: string;
  type: string;
  value: string;
};

export type RawResult = {
  __v_id: string;
  __v_type: string;
  attributes: Record<string, string | number>;
};
