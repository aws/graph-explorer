import type { AbstractConnector } from "../../connector/useGEFetch";
import LoggerConnector from "../../connector/LoggerConnector";

export type ConnectorContextProps = {
  explorer?: AbstractConnector;
  logger?: LoggerConnector;
};
