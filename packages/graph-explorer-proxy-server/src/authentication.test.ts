import { signRequest } from "./authentication.js";
import aws4 from "aws4";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

// Mock the AWS SDK credential provider
vi.mock("@aws-sdk/credential-providers", () => ({
  fromNodeProviderChain: vi.fn(),
}));

// Mock aws4
vi.mock("aws4", () => ({
  default: {
    sign: vi.fn(),
  },
}));

const mockCredentialProvider = vi.mocked(fromNodeProviderChain);
const mockAws4Sign = vi.mocked(aws4.sign);

describe("signRequest", () => {
  const mockCredentials = {
    accessKeyId: "test-access-key",
    secretAccessKey: "test-secret-key",
    sessionToken: "test-session-token",
  };

  const testUrl = new URL("https://example.com/path?query=value");
  const testRequest = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ test: "data" }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when IAM options are not provided", () => {
    it("should return the original request unchanged", async () => {
      const result = await signRequest(testUrl, testRequest);

      expect(result).toBe(testRequest);
      expect(mockCredentialProvider).not.toHaveBeenCalled();
      expect(mockAws4Sign).not.toHaveBeenCalled();
    });
  });

  describe("when IAM options are provided", () => {
    const iamOptions = {
      service: "neptune-db",
      region: "us-east-1",
    };

    beforeEach(() => {
      const mockProvider = vi.fn().mockResolvedValue(mockCredentials);
      mockCredentialProvider.mockReturnValue(mockProvider);

      mockAws4Sign.mockReturnValue({
        headers: {
          Authorization: "AWS4-HMAC-SHA256 Credential=...",
          "X-Amz-Date": "20231201T120000Z",
        },
      });
    });

    it("should sign the request with AWS credentials", async () => {
      mockAws4Sign.mockReturnValue({
        body: '{"test":"data"}', // Mock the transformed body
        headers: {
          Authorization: "AWS4-HMAC-SHA256 Credential=...",
          "X-Amz-Date": "20231201T120000Z",
        },
      });

      const result = await signRequest(testUrl, testRequest, iamOptions);

      expect(mockCredentialProvider).toHaveBeenCalled();
      expect(mockAws4Sign).toHaveBeenCalledWith(
        {
          host: "example.com",
          path: "/path?query=value",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"test":"data"}',
          service: "neptune-db",
          region: "us-east-1",
        },
        {
          accessKeyId: "test-access-key",
          secretAccessKey: "test-secret-key",
          sessionToken: "test-session-token",
        }
      );

      expect(result).toEqual({
        ...testRequest,
        body: '{"test":"data"}', // Should return the transformed body
        headers: {
          "Content-Type": "application/json",
          Authorization: "AWS4-HMAC-SHA256 Credential=...",
          "X-Amz-Date": "20231201T120000Z",
        },
      });
    });

    it("should handle credentials without session token", async () => {
      const credsWithoutToken = {
        accessKeyId: "test-access-key",
        secretAccessKey: "test-secret-key",
      };

      const mockProvider = vi.fn().mockResolvedValue(credsWithoutToken);
      mockCredentialProvider.mockReturnValue(mockProvider);

      await signRequest(testUrl, testRequest, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(expect.any(Object), {
        accessKeyId: "test-access-key",
        secretAccessKey: "test-secret-key",
      });
    });

    it("should handle GET requests without body", async () => {
      const getRequest = {
        method: "GET",
        headers: { Accept: "application/json" },
      };

      await signRequest(testUrl, getRequest, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          body: undefined,
        }),
        expect.any(Object)
      );
    });

    it("should handle requests without headers", async () => {
      const requestWithoutHeaders = {
        method: "POST",
        body: "test body",
      };

      await signRequest(testUrl, requestWithoutHeaders, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: undefined,
        }),
        expect.any(Object)
      );
    });

    it("should throw error when credentials cannot be found", async () => {
      const mockProvider = vi.fn().mockResolvedValue(undefined);
      mockCredentialProvider.mockReturnValue(mockProvider);

      await expect(
        signRequest(testUrl, testRequest, iamOptions)
      ).rejects.toThrow(
        "IAM is enabled but credentials cannot be found on the credential provider chain."
      );
    });
  });

  describe("body transformation and return", () => {
    const iamOptions = { service: "neptune-db", region: "us-east-1" };

    beforeEach(() => {
      const mockProvider = vi.fn().mockResolvedValue(mockCredentials);
      mockCredentialProvider.mockReturnValue(mockProvider);
    });

    it("should return transformed URLSearchParams body", async () => {
      const params = new URLSearchParams();
      params.append("key", "value");
      const request = { method: "POST", body: params };

      mockAws4Sign.mockReturnValue({
        body: "key=value",
        headers: { Authorization: "test" },
      });

      const result = await signRequest(testUrl, request, iamOptions);

      expect(result.body).toBe("key=value");
    });

    it("should return transformed FormData body", async () => {
      const formData = new FormData();
      formData.append("key1", "value1");
      formData.append("key2", "value2");
      const request = { method: "POST", body: formData };

      mockAws4Sign.mockReturnValue({
        body: "key1=value1&key2=value2",
        headers: { Authorization: "test" },
      });

      const result = await signRequest(testUrl, request, iamOptions);

      expect(result.body).toBe("key1=value1&key2=value2");
    });

    it("should return transformed Blob body", async () => {
      const blob = new Blob(["blob content"], { type: "text/plain" });
      const request = { method: "POST", body: blob };

      mockAws4Sign.mockReturnValue({
        body: "blob content",
        headers: { Authorization: "test" },
      });

      const result = await signRequest(testUrl, request, iamOptions);

      expect(result.body).toBe("blob content");
    });
  });

  describe("mapToCompatibleBody", () => {
    // We need to test the private function indirectly through signRequest
    const iamOptions = { service: "neptune-db", region: "us-east-1" };

    beforeEach(() => {
      const mockProvider = vi.fn().mockResolvedValue(mockCredentials);
      mockCredentialProvider.mockReturnValue(mockProvider);
      mockAws4Sign.mockReturnValue({ headers: {} });
    });

    it("should handle string body", async () => {
      const request = { method: "POST", body: "string body" };

      await signRequest(testUrl, request, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(
        expect.objectContaining({ body: "string body" }),
        expect.any(Object)
      );
    });

    it("should handle URLSearchParams body", async () => {
      const params = new URLSearchParams();
      params.append("key", "value");
      const request = { method: "POST", body: params };

      await signRequest(testUrl, request, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(
        expect.objectContaining({ body: "key=value" }),
        expect.any(Object)
      );
    });

    it("should handle Buffer body", async () => {
      const buffer = Buffer.from("buffer content");
      const request = { method: "POST", body: buffer };

      await signRequest(testUrl, request, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(
        expect.objectContaining({ body: buffer }),
        expect.any(Object)
      );
    });

    it("should handle Blob body", async () => {
      const blob = new Blob(["blob content"], { type: "text/plain" });
      const request = { method: "POST", body: blob };

      await signRequest(testUrl, request, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(
        expect.objectContaining({ body: "blob content" }),
        expect.any(Object)
      );
    });

    it("should handle null body", async () => {
      const request = { method: "POST", body: null };

      await signRequest(testUrl, request, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(
        expect.objectContaining({ body: undefined }),
        expect.any(Object)
      );
    });

    it("should handle undefined body", async () => {
      const request = { method: "GET" };

      await signRequest(testUrl, request, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(
        expect.objectContaining({ body: undefined }),
        expect.any(Object)
      );
    });

    it("should handle FormData body", async () => {
      const formData = new FormData();
      formData.append("key1", "value1");
      formData.append("key2", "value2");
      const request = { method: "POST", body: formData };

      await signRequest(testUrl, request, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(
        expect.objectContaining({ body: "key1=value1&key2=value2" }),
        expect.any(Object)
      );
    });

    it("should throw error for FormData with File", async () => {
      const formData = new FormData();
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      formData.append("file", file);
      const request = { method: "POST", body: formData };

      await expect(signRequest(testUrl, request, iamOptions)).rejects.toThrow(
        "File uploads are not supported."
      );
    });

    it("should handle object body with JSON.stringify fallback", async () => {
      const objectBody = { key: "value", nested: { prop: 123 } };
      const request = { method: "POST", body: objectBody as any };

      await signRequest(testUrl, request, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(
        expect.objectContaining({
          body: '{"key":"value","nested":{"prop":123}}',
        }),
        expect.any(Object)
      );
    });
  });

  describe("URL handling", () => {
    const iamOptions = { service: "neptune-db", region: "us-east-1" };

    beforeEach(() => {
      const mockProvider = vi.fn().mockResolvedValue(mockCredentials);
      mockCredentialProvider.mockReturnValue(mockProvider);
      mockAws4Sign.mockReturnValue({ headers: {} });
    });

    it("should handle URL with query parameters", async () => {
      const urlWithQuery = new URL(
        "https://example.com/path?param1=value1&param2=value2"
      );

      await signRequest(urlWithQuery, { method: "GET" }, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "example.com",
          path: "/path?param1=value1&param2=value2",
        }),
        expect.any(Object)
      );
    });

    it("should handle URL without query parameters", async () => {
      const urlWithoutQuery = new URL("https://example.com/path");

      await signRequest(urlWithoutQuery, { method: "GET" }, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "example.com",
          path: "/path",
        }),
        expect.any(Object)
      );
    });

    it("should handle URL with port", async () => {
      const urlWithPort = new URL("https://example.com:8182/gremlin");

      await signRequest(urlWithPort, { method: "POST" }, iamOptions);

      expect(mockAws4Sign).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "example.com:8182",
          path: "/gremlin",
        }),
        expect.any(Object)
      );
    });
  });
});
