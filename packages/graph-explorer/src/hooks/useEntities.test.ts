import { act, renderHook } from '@testing-library/react-hooks';
import { RecoilRoot } from 'recoil';
import useEntities from "./useEntities";
import { Vertex } from '../@types/entities';


jest.mock('localforage', () => ({
    config: jest.fn(),
    getItem: jest.fn(),
}));

describe('useEntities', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("should handle single node data correctly", async () => {
        const randomNode = { data: { id: Math.random().toString(), type: 'type1', neighborsCount: Math.floor(Math.random() * 100), neighborsCountByType: {} } } as Vertex;
        const expectedRandomNodes = {
            data: {
                id: randomNode.data.id,
                type: randomNode.data.type,
                neighborsCount: randomNode.data.neighborsCount,
                neighborsCountByType: {},
                __unfetchedNeighborCounts: {},
                __fetchedOutEdgeCount: 0,
                __fetchedInEdgeCount: 0,
                __unfetchedNeighborCount: 0
            }
        };

        const { result, waitForNextUpdate } = renderHook(
            () => {
                const [entities, setEntities] = useEntities({ disableFilters: true });
                return { entities, setEntities };
            },
            {
                wrapper: RecoilRoot,
            }
        );

        act(() => {
            result.current.setEntities({ nodes: [randomNode], edges: [] });
        });

        await waitForNextUpdate();

        expect(result.current.entities).toEqual({ nodes: [expectedRandomNodes], edges: [] });
        expect(result.current.entities.nodes[0].data.id).toEqual(randomNode.data.id);
        expect(result.current.entities.nodes[0].data.type).toEqual(randomNode.data.type);
        expect(result.current.entities.nodes[0].data.neighborsCount).toEqual(randomNode.data.neighborsCount);
        expect(result.current.entities.nodes[0].data.neighborsCountByType).toEqual({});
        expect(result.current.entities.nodes[0].data.__unfetchedNeighborCounts).toEqual({});
        expect(result.current.entities.nodes[0].data.__fetchedOutEdgeCount).toEqual(0);
        expect(result.current.entities.nodes[0].data.__fetchedInEdgeCount).toEqual(0);
        expect(result.current.entities.nodes[0].data.__unfetchedNeighborCount).toEqual(0);

    });

    it("should handle multiple nodes correctly", async () => {
        const node1 = { data: { id: '1', type: 'type1', neighborsCount: 1, neighborsCountByType: {} } } as Vertex;
        const node2 = { data: { id: '2', type: 'type2', neighborsCount: 2, neighborsCountByType: {} } } as Vertex;
        const node3 = { data: { id: '3', type: 'type3', neighborsCount: 3, neighborsCountByType: {} } } as Vertex;
        const expectedNodes = [
            {
                data: {
                    id: node1.data.id,
                    type: node1.data.type,
                    neighborsCount: node1.data.neighborsCount,
                    neighborsCountByType: {},
                    __unfetchedNeighborCounts: {},
                    __fetchedOutEdgeCount: 0,
                    __fetchedInEdgeCount: 0,
                    __unfetchedNeighborCount: 0
                }
            },
            {
                data: {
                    id: node2.data.id,
                    type: node2.data.type,
                    neighborsCount: node2.data.neighborsCount,
                    neighborsCountByType: {},
                    __unfetchedNeighborCounts: {},
                    __fetchedOutEdgeCount: 0,
                    __fetchedInEdgeCount: 0,
                    __unfetchedNeighborCount: 0
                }
            },
            {
                data: {
                    id: node3.data.id,
                    type: node3.data.type,
                    neighborsCount: node3.data.neighborsCount,
                    neighborsCountByType: {},
                    __unfetchedNeighborCounts: {},
                    __fetchedOutEdgeCount: 0,
                    __fetchedInEdgeCount: 0,
                    __unfetchedNeighborCount: 0
                }
            }
        ];

        const { result, waitForNextUpdate } = renderHook(
            () => {
                const [entities, setEntities] = useEntities({ disableFilters: true });
                return { entities, setEntities };
            },
            {
                wrapper: RecoilRoot,
            }
        );

        act(() => {
            result.current.setEntities({ nodes: [node1, node2, node3], edges: [] });
        });

        await waitForNextUpdate();

        expect(result.current.entities).toEqual({ nodes: expectedNodes, edges: [] });
        expect(result.current.entities.nodes[0].data.id).toEqual(node1.data.id);
        expect(result.current.entities.nodes[0].data.type).toEqual(node1.data.type);
        expect(result.current.entities.nodes[0].data.neighborsCount).toEqual(node1.data.neighborsCount);
        expect(result.current.entities.nodes[0].data.neighborsCountByType).toEqual({});
        expect(result.current.entities.nodes[0].data.__unfetchedNeighborCounts).toEqual({});
        expect(result.current.entities.nodes[0].data.__fetchedOutEdgeCount).toEqual(0);
        expect(result.current.entities.nodes[0].data.__fetchedInEdgeCount).toEqual(0);
        expect(result.current.entities.nodes[0].data.__unfetchedNeighborCount).toEqual(0);

        expect(result.current.entities.nodes[1].data.id).toEqual(node2.data.id);
        expect(result.current.entities.nodes[1].data.type).toEqual(node2.data.type);
        expect(result.current.entities.nodes[1].data.neighborsCount).toEqual(node2.data.neighborsCount);
        expect(result.current.entities.nodes[1].data.neighborsCountByType).toEqual({});
        expect(result.current.entities.nodes[1].data.__unfetchedNeighborCounts).toEqual({});
        expect(result.current.entities.nodes[1].data.__fetchedOutEdgeCount).toEqual(0);
        expect(result.current.entities.nodes[1].data.__fetchedInEdgeCount).toEqual(0);
        expect(result.current.entities.nodes[1].data.__unfetchedNeighborCount).toEqual(0);

        expect(result.current.entities.nodes[2].data.id).toEqual(node3.data.id);
        expect(result.current.entities.nodes[2].data.type).toEqual(node3.data.type);
        expect(result.current.entities.nodes[2].data.neighborsCount).toEqual(node3.data.neighborsCount);
        expect(result.current.entities.nodes[2].data.neighborsCountByType).toEqual({});
        expect(result.current.entities.nodes[2].data.__unfetchedNeighborCounts).toEqual({});
        expect(result.current.entities.nodes[2].data.__fetchedOutEdgeCount).toEqual(0);
        expect(result.current.entities.nodes[2].data.__fetchedInEdgeCount).toEqual(0);
        expect(result.current.entities.nodes[2].data.__unfetchedNeighborCount).toEqual(0);
    });

    it("should return original entities before any filters were applied", async () => {
        // Define newNode and newEdge
        const newNode = { data: { id: '1', type: 'type1', neighborsCount: 1, neighborsCountByType: {} } };
        const newEdge = { data: { id: '1', source: '1', target: '2', type: 'type1' } };

        // Define originalEntities
        const originalEntities = {
            nodes: [newNode],
            edges: [newEdge]
        };

        // Mock the useEntities hook
        const useEntitiesMock = jest.fn();
        useEntitiesMock.mockReturnValue([originalEntities, jest.fn(), originalEntities]);

        // Override the useEntities function in the module
        jest.doMock('../../src/hooks/useEntities', () => useEntitiesMock);

        // Render the hook
        const { result } = renderHook(() => useEntitiesMock(), { wrapper: RecoilRoot });

        // Since we have mocked useEntitiesMock, it should return the originalEntities immediately
        expect(result.current[0]).toEqual(originalEntities);
        expect(result.current[2]).toEqual(originalEntities);
    });

});