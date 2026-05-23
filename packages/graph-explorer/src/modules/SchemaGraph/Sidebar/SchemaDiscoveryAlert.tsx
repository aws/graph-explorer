import { Alert, AlertDescription, AlertTitle } from "@/components";

/** Informs the user that the schema was implicitly discovered and may be incomplete. */
export function SchemaDiscoveryAlert() {
  return (
    <Alert>
      <AlertTitle>Schema Discovery</AlertTitle>
      <AlertDescription>
        This schema was implicitly discovered by sampling the structure of the
        data and may not represent the complete schema.
      </AlertDescription>
    </Alert>
  );
}
