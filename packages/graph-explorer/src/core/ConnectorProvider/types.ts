import type { AbstractConnector } from "../../connector/AbstractConnector";
import LoggerConnector from "../../connector/LoggerConnector";

export type ConnectorContextProps = {
  explorer?: AbstractConnector;
  logger?: LoggerConnector;
};
