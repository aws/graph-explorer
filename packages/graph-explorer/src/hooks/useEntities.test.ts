import 'jest-localstorage-mock';
import { renderHook } from '@testing-library/react-hooks';
import { RecoilRoot, useSetRecoilState } from 'recoil';
import { useEffect } from 'react';
import useEntities from './useEntities';
import { nodesSelector } from '../core/StateProvider/nodes';
import { edgesSelector } from '../core/StateProvider/edges';
import { Edge, Vertex } from '../@types/entities';

jest.mock('localforage', () => ({
    config: jest.fn(),
    getItem: jest.fn(),
}));

const mockNode1 = {
    data: {
        id: 'node1',
        type: 'Person',
        neighborsCount: 2,
        neighborsCountByType: {},
    }
} as Vertex;

const mockNode2 = {
    data: {
        id: 'node2',
        type: 'Organization',
        neighborsCount: 1,
        neighborsCountByType: {},
    }
} as Vertex;

const mockEdge1 = {
    data: {
        id: "edge1",
        type: "FRIEND",
        source: "node1",
        target: "node2",
    }
} as Edge;

describe('useEntities', () => {
    it('returns expected values with default options', () => {
        const nodes = [mockNode1, mockNode2];
        const edges = [mockEdge1];

        const { result } = renderHook(
            () => {
                // Set Recoil state to mock values
                const setNodes = useSetRecoilState(nodesSelector);
                const setEdges = useSetRecoilState(edgesSelector);

                useEffect(() => {
                    setNodes(nodes);
                    setEdges(edges);
                }, [setNodes, setEdges]);

                return useEntities({ disableFilters: true });
            },
            {
                wrapper: RecoilRoot,
            }
        );

        expect(result.current[0]).toEqual({
            nodes: [mockNode1, mockNode2],
            edges: [mockEdge1],
        });
    });

});