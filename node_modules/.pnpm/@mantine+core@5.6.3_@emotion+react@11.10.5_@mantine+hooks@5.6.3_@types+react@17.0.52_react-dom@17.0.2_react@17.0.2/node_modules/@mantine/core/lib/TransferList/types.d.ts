/// <reference types="react" />
import { MantineNumberSize } from '@mantine/styles';
export interface TransferListItem {
    value: string;
    label: string;
    group?: string;
    [key: string]: any;
}
export declare type TransferListData = [TransferListItem[], TransferListItem[]];
export interface TransferListItemComponentProps {
    data: TransferListItem;
    selected: boolean;
    radius: MantineNumberSize;
}
export declare type TransferListItemComponent = React.FC<TransferListItemComponentProps>;
//# sourceMappingURL=types.d.ts.map