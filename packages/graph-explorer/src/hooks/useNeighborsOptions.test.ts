import 'jest-localstorage-mock';
import { renderHook } from '@testing-library/react-hooks';
import { useConfiguration } from '../core';
import useTextTransform from './useTextTransform';
import useNeighborsOptions from './useNeighborsOptions';
import { Vertex } from '../@types/entities';

jest.mock('../core/ConfigurationProvider/useConfiguration');
jest.mock('localforage');
jest.mock('./useTextTransform');

jest.mock('../core/ConfigurationProvider/ConfigurationProvider.tsx', () => ({
    ConfigurationProvider: ({ children }: any) => children,
}));

jest.mock('../core/ConnectedProvider/ConnectedProvider.tsx', () => ({
    ConnectedProvider: ({ children }: any) => children,
}));

describe('useNeighborsOptions', () => {
    const vertex = {
        data: {
            neighborsCountByType: { nodeType1: 5, nodeType2: 3 },
            __unfetchedNeighborCounts: { nodeType1: 0, nodeType2: 1 },
        },
    } as unknown as Vertex;

    it('should return neighbors options correctly', () => {
        (useConfiguration as jest.Mock).mockReturnValue({
            getVertexTypeConfig: (type: any) => {
                return { displayLabel: `Label ${type}` };
            },
        });
        (useTextTransform as jest.Mock).mockReturnValue((str: string) => str.toUpperCase());

        const { result } = renderHook(() => useNeighborsOptions(vertex),);

        expect(result.current).toEqual([
            {
                label: 'Label nodeType1',
                value: 'nodeType1',
                isDisabled: true,
                config: { displayLabel: 'Label nodeType1' },
            },
            {
                label: 'Label nodeType2',
                value: 'nodeType2',
                isDisabled: false,
                config: { displayLabel: 'Label nodeType2' },
            },
        ]);
    });
});
