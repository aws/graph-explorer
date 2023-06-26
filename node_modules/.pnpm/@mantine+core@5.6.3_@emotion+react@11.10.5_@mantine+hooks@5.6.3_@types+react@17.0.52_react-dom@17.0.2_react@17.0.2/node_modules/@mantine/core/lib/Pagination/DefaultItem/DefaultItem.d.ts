import React from 'react';
export interface PaginationItemProps extends React.ComponentPropsWithoutRef<'button'> {
    page: number | 'dots' | 'prev' | 'next' | 'first' | 'last';
    active?: boolean;
    onClick?: () => void;
}
export declare function DefaultItem({ page, active, onClick, ...others }: PaginationItemProps): JSX.Element;
export declare namespace DefaultItem {
    var displayName: string;
}
//# sourceMappingURL=DefaultItem.d.ts.map