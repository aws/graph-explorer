import { useCallback, useMemo, useState } from "react";
import type { Edge, Vertex } from "../../@types/entities";
import { ModuleContainerFooter, VertexIcon } from "../../components";
import Button from "../../components/Button";
import { useConfiguration, useWithTheme, withClassNamePrefix } from "../../core";
import defaultStyles from "../CreateConnection/CreateConnection.styles";
import useTextTransform from "../../hooks/useTextTransform";

export type MultiDetailsContentProps = {
    classNamePrefix?: string,
    vertex?: string;
};

const MultiDetailsContent = ({
    classNamePrefix = "ft",
    vertex,
}: MultiDetailsContentProps) => {
    const config = useConfiguration
    const styleWithTheme = useWithTheme();
    const pfx = withClassNamePrefix(classNamePrefix)

    const textTransform = useTextTransform();

    return(
        <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
            <div className={pfx("header")}>
            </div>
        </div>
    );
};

export default MultiDetailsContent;