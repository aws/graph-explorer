import { renderHook } from "@testing-library/react-hooks";
import useEntitiesCounts from "./useEntitiesCounts";
import { useConfiguration } from "../core";

jest.mock("../core", () => ({
  __esModule: true,
  useConfiguration: jest.fn(),
}));

describe("useEntitiesCounts", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return total vertices when totalVertices is defined', () => {
    (useConfiguration as jest.Mock).mockReturnValue({
      id: 'some-id',
      totalVertices: 10,
      vertexTypes: ["type1", "type2"],
      edgeTypes: ["edgeType1"],
      getEdgeTypeConfig: jest.fn(() => ({ total: 5 }))
    });

    const { result } = renderHook(() => useEntitiesCounts());

    expect(result.current.totalNodes).toEqual(10);
  });

  it('should return 0 for totalNodes when vertexTypes array is empty', () => {
    (useConfiguration as jest.Mock).mockReturnValue({
      id: 'some-id-two',
      totalVertices: 0,
      totalEdges: 0,
      vertexTypes: [],
      edgeTypes: ["edgeType1"],
    });

    const { result } = renderHook(() => useEntitiesCounts());

    expect(result.current.totalNodes).toBe(0);
  });

  it('should return calculated total nodes when vertexTypes array is not empty and each type has a total', () => {
    (useConfiguration as jest.Mock).mockReturnValue({
      vertexTypes: ['type1', 'type2'],
      edgeTypes: ['edgeType1', 'edgeType2'],
      getVertexTypeConfig: jest.fn(() => ({ total: 5 })),
      getEdgeTypeConfig: jest.fn(() => ({ total: 5 }))
    });
    const { result } = renderHook(() => useEntitiesCounts());

    expect(result.current.totalNodes).toEqual(10);
  });

  it('should return totalNodes when vertexTypes array is not empty and at least one type does not have a total', () => {
    (useConfiguration as jest.Mock).mockReturnValue({
      vertexTypes: ['type1', 'type2'],
      edgeTypes: ['edgeType1', 'edgeType2'],
      getVertexTypeConfig: jest.fn(() => ({ total: 5 })),
      getEdgeTypeConfig: jest.fn(() => ({ total: null }))
    });

    const { result } = renderHook(() => useEntitiesCounts());

    expect(result.current.totalNodes).toBe(10);
  });

});

