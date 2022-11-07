import { FC, useCallback } from "react";
import { useSetRecoilState } from "recoil";
import Button from "../../components/Button";
import {
  useConfiguration,
  useWithTheme,
  withClassNamePrefix,
} from "../../core";
import { userStylingAtom } from "../../core/StateProvider/userPreferences";
import SingleVertexTypeStyling from "./SingleVertexTypeStyling";

import defaultStyles from "./VerticesStylingContent.styles";

type VerticesStylingContentProps = {
  classNamePrefix?: string;
};

export const VerticesStylingContent: FC<VerticesStylingContentProps> = ({
  classNamePrefix = "ft",
}) => {
  const config = useConfiguration();
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const setUserStyling = useSetRecoilState(userStylingAtom);
  const resetVerticesPrefs = useCallback(() => {
    setUserStyling({
      vertices: [],
    });
  }, [setUserStyling]);

  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <div className={pfx("items")}>
        {config?.vertexTypes.map(vertexType => (
          <SingleVertexTypeStyling key={vertexType} vertexType={vertexType} />
        ))}
      </div>
      <div className={pfx("actions")}>
        <Button variant={"filled"} onPress={resetVerticesPrefs}>
          Reset
        </Button>
      </div>
    </div>
  );
};

export default VerticesStylingContentProps;
