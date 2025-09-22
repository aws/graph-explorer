import aws4 from "aws4";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import type { HeadersInit, RequestInit } from "node-fetch";

type IamOptions = Pick<aws4.Request, "service" | "region">;

/**
 * Signs an HTTP request using AWS IAM credentials for authentication.
 *
 * This function takes a URL and request configuration, and if IAM options are provided,
 * it signs the request using AWS Signature Version 4 (SigV4) authentication. The signing
 * process adds the necessary authentication headers to make authenticated requests to
 * AWS services or other services that support AWS IAM authentication.
 *
 * @param url - The target URL for the HTTP request
 * @param request - The request configuration object containing method, headers, body, etc.
 * @param iamOptions - Optional IAM configuration specifying the AWS service and region.
 *                     If not provided, the request is returned unmodified.
 * @returns A promise that resolves to a new RequestInit object with AWS authentication
 *          headers added (if IAM options were provided)
 *
 * @example
 * ```typescript
 * const url = new URL('https://my-service.us-east-1.amazonaws.com/api/data');
 * const request = {
 *   method: 'POST',
 *   body: JSON.stringify({ key: 'value' }),
 *   headers: { 'Content-Type': 'application/json' }
 * };
 * const iamOptions = { service: 'execute-api', region: 'us-east-1' };
 *
 * const signedRequest = await signRequest(url, request, iamOptions);
 * // signedRequest now contains AWS authentication headers
 * ```
 *
 * @throws {Error} When IAM options are provided but credentials cannot be retrieved
 * @throws {Error} When the request body contains unsupported File uploads in FormData
 */
export async function signRequest(
  url: URL,
  request: RequestInit,
  iamOptions?: IamOptions
): Promise<RequestInit> {
  if (!iamOptions) {
    // Don't modify the request if not using IAM credentials
    return request;
  }

  // Convert the node-fetch RequestInit body to an aws4.Request body
  const body = await mapToCompatibleBody(request.body);

  // Create the AWS signing compatible request object
  const requestOptions: aws4.Request = {
    host: url.host,
    path: url.pathname + url.search,
    method: request.method || "GET",
    headers: request.headers ? { ...request.headers } : undefined,
    body: body,
    service: iamOptions.service,
    region: iamOptions.region,
  };

  // Sign the request
  const creds = await getIamCredentials();
  const signedRequest = aws4.sign(requestOptions, {
    accessKeyId: creds.accessKeyId,
    secretAccessKey: creds.secretAccessKey,
    ...(creds.sessionToken && { sessionToken: creds.sessionToken }),
  });

  // Combine the original request with the headers from the signed request
  return {
    ...request,
    body: signedRequest.body,
    headers: {
      ...request.headers,
      ...signedRequest.headers,
    } as unknown as HeadersInit,
  };
}

/**
 * Retrieves IAM credentials from the AWS credential provider chain.
 *
 * This function uses the AWS SDK's fromNodeProviderChain() to automatically
 * discover credentials from various sources in the following order:
 * 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * 2. Shared credentials file (~/.aws/credentials)
 * 3. EC2 instance metadata service
 * 4. ECS task metadata service
 * 5. Other configured credential sources
 *
 * @returns A promise that resolves to AWS credentials containing accessKeyId,
 *          secretAccessKey, and optionally sessionToken
 * @throws {Error} When IAM is enabled but no credentials can be found in the
 *                 credential provider chain
 */
async function getIamCredentials() {
  const credentialProvider = fromNodeProviderChain();
  const creds = await credentialProvider();
  if (creds === undefined) {
    throw new Error(
      "IAM is enabled but credentials cannot be found on the credential provider chain."
    );
  }
  return creds;
}

/**
 * Converts a node-fetch RequestInit body to a format compatible with aws4.Request body.
 *
 * @param body - The request body from node-fetch RequestInit
 * @returns A promise that resolves to a string representation of the body or undefined
 */
async function mapToCompatibleBody(
  body: RequestInit["body"]
): Promise<aws4.Request["body"]> {
  // Return undefined for null or undefined bodies
  if (!body) {
    return undefined;
  }

  // String bodies can be used directly
  if (typeof body === "string") {
    return body;
  }

  // Convert URLSearchParams to string representation
  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (body instanceof FormData) {
    const params = new URLSearchParams();
    for (const [key, value] of body.entries()) {
      if (value instanceof File) {
        throw new Error("File uploads are not supported.");
      }
      params.append(key, value);
    }
    return params.toString();
  }

  // Convert Buffer to string
  if (body instanceof Buffer) {
    return body;
  }

  // Convert Blob to text string
  if (body instanceof Blob) {
    return await body.text();
  }

  // Fallback: stringify any other object as JSON
  return JSON.stringify(body);
}
