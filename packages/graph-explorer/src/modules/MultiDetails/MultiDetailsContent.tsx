import { useCallback, useMemo, useState } from "react";
import type { Edge, Vertex } from "../../@types/entities";
import { ModuleContainerFooter, VertexIcon } from "../../components";
import Button from "../../components/Button";
import { useWithTheme, withClassNamePrefix } from "../../core";
import defaultStyles from "../CreateConnection/CreateConnection.styles";

export type MultiDetailsContentProps = {
    classNamePrefix?: string,
    vertex?: string;
};

const MultiDetailsContent = ({
    classNamePrefix = "ft",
    vertex,
}: MultiDetailsContentProps) => {
    const styleWithTheme = useWithTheme();
    const pfx = withClassNamePrefix(classNamePrefix)

    return(
        <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
        </div>
    );
};

export default MultiDetailsContent;