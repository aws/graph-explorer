import {
  type ConnectionConfig,
  type NeptuneServiceType,
  neptuneServiceTypeOptions,
  type QueryEngine,
  queryEngineOptions,
} from "@shared/types";
import { z } from "zod";

import { isDirectConnection, type RawConfiguration } from "@/connections";
import { formatDate, isAbsoluteHttpUrl } from "@/utils";
import {
  DEFAULT_FETCH_TIMEOUT,
  DEFAULT_NODE_EXPAND_LIMIT,
} from "@/utils/constants";

/** Parses the query language a select reports as a plain string. */
export const queryEngineSchema = z.enum(queryEngineOptions);

/** Parses the Neptune service type a select reports as a plain string. */
export const serviceTypeSchema = z.enum(neptuneServiceTypeOptions);

/** The values the connection form edits, one per control. */
export type ConnectionFormValues = {
  name: string;
  graphDbUrl: string;
  queryEngine: QueryEngine;
  directConnection: boolean;
  awsAuthEnabled: boolean;
  serviceType: NeptuneServiceType;
  awsRegion: string;
  fetchTimeoutEnabled: boolean;
  fetchTimeoutMs: number | undefined;
  nodeExpansionLimitEnabled: boolean;
  nodeExpansionLimit: number | undefined;
};

/** The message to show beside each field that failed validation. */
export type ConnectionFormErrors = {
  name?: string;
  graphDbUrl?: string;
  awsRegion?: string;
};

/** Either the normalized values, ready to save, or the errors that block them. */
export type ConnectionFormValidation =
  | { valid: true; values: ConnectionFormValues }
  | { valid: false; errors: ConnectionFormErrors };

/** Form values for a new connection, named after when it was started. */
export function createNewConnectionForm(now: Date): ConnectionFormValues {
  return mapToConnectionForm(
    `Connection (${formatDate(now, "yyyy-MM-dd HH:mm")})`,
    undefined,
  );
}

/**
 * Maps a connection into form values under the given name. The caller picks the
 * name because only it knows the fallback: a stored connection falls back to
 * its id, and a connection that hasn't been saved has no id.
 */
export function mapToConnectionForm(
  name: string,
  connection: ConnectionConfig | undefined,
): ConnectionFormValues {
  return {
    name,
    graphDbUrl: connection?.graphDbUrl || "",
    queryEngine: connection?.queryEngine || "gremlin",
    directConnection: isDirectConnection(connection),
    awsAuthEnabled: connection?.awsAuthEnabled || false,
    serviceType: connection?.serviceType || "neptune-db",
    awsRegion: connection?.awsRegion || "",
    fetchTimeoutEnabled: Boolean(connection?.fetchTimeoutMs),
    fetchTimeoutMs: connection?.fetchTimeoutMs,
    nodeExpansionLimitEnabled: Boolean(connection?.nodeExpansionLimit),
    nodeExpansionLimit: connection?.nodeExpansionLimit,
  };
}

/**
 * Maps a stored connection into form values, named the way the rest of the app
 * shows it: by its label, or by its id when it has none.
 */
export function mapConfigurationToConnectionForm(
  config: RawConfiguration,
): ConnectionFormValues {
  return mapToConnectionForm(
    config.displayLabel || config.id,
    config.connection,
  );
}

/** Maps form values into the connection they describe. */
export function mapToConnection(
  values: ConnectionFormValues,
): ConnectionConfig {
  // A direct request never reaches the Proxy Server that would sign it.
  const routing = values.directConnection
    ? { proxyConnection: false }
    : {
        awsAuthEnabled: values.awsAuthEnabled,
        serviceType: values.serviceType,
        awsRegion: values.awsRegion,
      };
  return {
    graphDbUrl: values.graphDbUrl,
    queryEngine: values.queryEngine,
    ...routing,
    fetchTimeoutMs: values.fetchTimeoutEnabled
      ? values.fetchTimeoutMs
      : undefined,
    nodeExpansionLimit: values.nodeExpansionLimitEnabled
      ? values.nodeExpansionLimit
      : undefined,
  };
}

/** Normalizes the form values and reports any field that blocks saving them. */
export function validateConnectionForm(
  form: ConnectionFormValues,
): ConnectionFormValidation {
  const values = { ...form, graphDbUrl: normalizeUrlField(form.graphDbUrl) };

  const errors: ConnectionFormErrors = {};
  if (!values.name) {
    errors.name = "Name is required";
  }
  const graphDbUrlError = validateGraphDbUrl(values);
  if (graphDbUrlError) {
    errors.graphDbUrl = graphDbUrlError;
  }
  if (!values.directConnection && values.awsAuthEnabled && !values.awsRegion) {
    errors.awsRegion = "Region is required";
  }

  return Object.keys(errors).length > 0
    ? { valid: false, errors }
    : { valid: true, values };
}

/**
 * Sets one field, along with the fields that depend on it: Neptune Analytics
 * only runs openCypher, and enabling an override fills in its default.
 */
export function updateConnectionForm<Field extends keyof ConnectionFormValues>(
  form: ConnectionFormValues,
  field: Field,
  value: ConnectionFormValues[Field],
): ConnectionFormValues {
  const updated: ConnectionFormValues = { ...form, [field]: value };
  if (field === "serviceType" && value === "neptune-graph") {
    updated.queryEngine = "openCypher";
  }
  if (field === "fetchTimeoutEnabled") {
    updated.fetchTimeoutMs = value ? DEFAULT_FETCH_TIMEOUT : undefined;
  }
  if (field === "nodeExpansionLimitEnabled") {
    updated.nodeExpansionLimit = value ? DEFAULT_NODE_EXPAND_LIMIT : undefined;
  }
  return updated;
}

/**
 * Whether the advanced disclosure should start open. A connection that already
 * overrides one of these settings would otherwise hide that fact behind a
 * collapsed section, so editing it looks like the defaults are in force.
 */
export function hasAdvancedOverrides(form: ConnectionFormValues): boolean {
  return (
    form.fetchTimeoutEnabled ||
    form.nodeExpansionLimitEnabled ||
    form.directConnection
  );
}

function normalizeUrlField(value: string) {
  return value.replace(/[\r\n]/g, "").trim();
}

function validateGraphDbUrl(values: ConnectionFormValues): string | undefined {
  if (!values.graphDbUrl) {
    return "URL is required";
  }
  // The browser resolves anything else against this page or as a scheme.
  if (values.directConnection && !isAbsoluteHttpUrl(values.graphDbUrl)) {
    return "A direct connection needs a full URL starting with http:// or https://";
  }
}
