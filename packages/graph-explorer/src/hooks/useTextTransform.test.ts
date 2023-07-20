import 'jest-localstorage-mock';
import useTextTransform from "./useTextTransform";
import { renderHook } from '@testing-library/react-hooks';
import { useConfiguration } from '../core';

jest.mock('localforage');

jest.mock('../core/ConnectedProvider/ConnectedProvider.tsx', () => ({
    ConnectedProvider: ({ children }: any) => children,
}));

jest.mock("../core", () => ({
    __esModule: true,
    useConfiguration: jest.fn(),
}));


describe("useTextTransform", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });
    it("should replace prefixes in URIs", () => {
        const text = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
        const expected = "rdf:type";
        (useConfiguration as jest.Mock).mockReturnValue({
            connection: {
                queryEngine: "sparql",
            },
            schema: {
                prefixes: [
                    {
                        prefix: "rdf",
                        uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                    },
                ],
            },
        });
        const { result } = renderHook(() => useTextTransform());
        expect(result.current(text)).toEqual(expected);
    });

    it("should sanitize text", () => {
        const text = "this is a test";
        const expected = "This Is A Test";
        const { result } = renderHook(() => useTextTransform());
        expect(result.current(text)).toBe(expected);
    });

    it("should return the original text if no transformation is needed", () => {
        const text = "This Is A Test";
        const { result } = renderHook(() => useTextTransform());
        expect(result.current(text)).toBe(text);
    });

    it("should handle empty string", () => {
        const input = '';
        const { result } = renderHook(() => useTextTransform());
        expect(result.current(input)).toBe(input);
    });

    it("should handle strings with invalid characters", () => {
        const input = 'str\u{1F600}';
        const expected = 'Str\u{1F600}';
        const { result } = renderHook(() => useTextTransform());
        expect(result.current(input)).toBe(expected);
    });

    // Boundary cases
    it("should return original input if it's a URI not in schema.prefixes", () => {
        const input = "http://www.some-uri.com/";
        (useConfiguration as jest.Mock).mockReturnValue({
            connection: {
                queryEngine: "sparql",
            },
            schema: {
                prefixes: [
                    {
                        prefix: "rdf",
                        uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                    },
                ],
            },
        });
        const { result } = renderHook(() => useTextTransform());
        expect(result.current(input)).toBe(input);
    });

    it("should return original input if the connection.queryEngine is 'sparql' and input doesn't contain a URI", () => {
        const input = "Some Text Without URI";
        (useConfiguration as jest.Mock).mockReturnValue({
            connection: {
                queryEngine: "sparql",
            },
            schema: {
                prefixes: [
                    {
                        prefix: "rdf",
                        uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                    },
                ],
            },
        });
        const { result } = renderHook(() => useTextTransform());
        expect(result.current(input)).toBe(input);
    });

    // Random data
    it("should handle random data", () => {
        const input = 'str\u{1F600}abcdef';
        const expected = 'Str\u{1F600}abcdef';
        const { result } = renderHook(() => useTextTransform());
        expect(result.current(input)).toBe(expected);
    });
});
