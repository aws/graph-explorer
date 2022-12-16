import { ErrorResponse } from "../AbstractConnector";

const isErrorResponse = (value: any): value is ErrorResponse => {
  return !!(value.code && value.detailedMessage);
};

export default isErrorResponse;
