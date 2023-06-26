import { ConfigurationContextProps } from "../core";
import useEntitiesCounts from "./useEntitiesCounts";


// Test cases
describe('useEntitiesCounts', () => {
  it('should return null for totalNodes if config is null', () => {
    const config = { totalNodes: null, totalEdges: null, id: '1', vertexTypes: [], edgeTypes: [], getVertexTypeConfig: () => null, getEdgeTypeConfig: () => null, };
    const { totalNodes, totalEdges } = useEntitiesCounts({ config: config as unknown as ConfigurationContextProps });
    //  mock ConfigurationContext
    expect(totalNodes).toBeNull();
    expect(totalEdges).toBeNull();
  });


  it('should return null for totalNodes if totalVertices is null and vertexTypes is empty', () => {
    const config = { totalVertices: null, vertexTypes: [] };
    const { totalNodes } = useEntitiesCounts({ config: config as unknown as ConfigurationContextProps });
    expect(totalNodes).toBeNull();
  });

  it('should return the correct totalNodes if totalVertices is not null', () => {
    const config = { totalVertices: 10 };
    const { totalNodes } = useEntitiesCounts({ config: config as ConfigurationContextProps });
    expect(totalNodes).toEqual(10);
  });

  it('should return the correct totalNodes if vertexTypes are defined', () => {
    const config = {
      vertexTypes: ['Person', 'Organization'],
      getVertexTypeConfig: (vt: string) => {
        if (vt === 'Person') {
          return { total: 5 };
        }
        if (vt === 'Organization') {
          return { total: 3 };
        }
        return null;
      },
    };
    const { totalNodes } = useEntitiesCounts({ config: config as ConfigurationContextProps });
    expect(totalNodes).toEqual(8);
  });

  it('should return null for totalEdges if config is null', () => {
    const config = null;
    const { totalEdges } = useEntitiesCounts({ config: config as unknown as ConfigurationContextProps });
    expect(totalEdges).toBeNull();
  });

  it('should return null for totalEdges if totalEdges is null and edgeTypes is empty', () => {
    const config = { totalEdges: null, edgeTypes: [] };
    const { totalEdges } = useEntitiesCounts({ config: config as unknown as ConfigurationContextProps });
    expect(totalEdges).toBeNull();
  });

  it('should return the correct totalEdges if totalEdges is not null', () => {
    const config = { totalEdges: 20, };
    const { totalEdges } = useEntitiesCounts({ config: config as ConfigurationContextProps });
    expect(totalEdges).toEqual(20);
  });

  it('should return the correct totalEdges if edgeTypes are defined', () => {
    const config = {
      edgeTypes: ['Friend', 'WorksWith'],
      getEdgeTypeConfig: (et: string) => {
        if (et === 'Friend') {
          return { total: 10 };
        }
        if (et === 'WorksWith') {
          return { total: 5 };
        }
        return null;
      },
    };
    const { totalEdges } = useEntitiesCounts({ config: config as ConfigurationContextProps });
    expect(totalEdges).toEqual(15);
  });
});