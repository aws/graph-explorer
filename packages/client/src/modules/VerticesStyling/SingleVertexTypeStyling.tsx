import { FileButton } from "@mantine/core";
import debounce from "lodash/debounce";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import {
  IconButton,
  Input,
  RemoteSvgIcon,
  Tooltip,
  UploadIcon,
} from "../../components";
import { useNotification } from "../../components/NotificationProvider";
import {
  useConfiguration,
  useWithTheme,
  withClassNamePrefix,
} from "../../core";
import {
  userStylingAtom,
  VertexPreferences,
} from "../../core/StateProvider/userPreferences";
import fade from "../../core/ThemeProvider/utils/fade";
import useTextTransform from "../../hooks/useTextTransform";
import ColorInput from "./internalComponents/ColorInput";
import defaultStyles from "./SingleVertexTypeStyling.style";

const file2Base64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result?.toString() || "");
    reader.onerror = error => reject(error);
  });
};

type SingleVertexTypeStylingProps = {
  classNamePrefix?: string;
  vertexType: string;
};

export const SingleVertexTypeStyling: FC<SingleVertexTypeStylingProps> = ({
  classNamePrefix = "ft",
  vertexType,
}) => {
  const config = useConfiguration();
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const mounted = useRef(false);
  const [userStyling, setUserStyling] = useRecoilState(userStylingAtom);
  const vtConfig = config?.getVertexTypeConfig(vertexType);
  const vtPrefs = userStyling.vertices?.find(v => v.type === vertexType);

  const textTransform = useTextTransform();
  const [displayLabel, setDisplayLabel] = useState(
    vtConfig?.displayLabel || textTransform(vtConfig?.type)
  );

  const onUserPrefsChange = useCallback(
    (prefs: Omit<VertexPreferences, "type">) => {
      setUserStyling(prev => {
        const vertices = Array.from(prev.vertices || []);
        const updateIndex = vertices.findIndex(v => v.type === vertexType);

        if (updateIndex === -1) {
          return {
            ...prev,
            vertices: [...vertices, { ...prefs, type: vertexType }],
          };
        }

        vertices[updateIndex] = {
          ...vertices[updateIndex],
          ...prefs,
          type: vertexType,
        };
        return {
          ...prev,
          vertices,
        };
      });
    },
    [setUserStyling, vertexType]
  );

  const { enqueueNotification } = useNotification();
  const convertImageToBase64AndSetNewIcon = useCallback(
    async (file: File) => {
      if (file.size > 50 * 1024) {
        enqueueNotification({
          title: "Invalid file",
          message: "File size too large. Maximum 50Kb",
          type: "error",
        });
        return;
      }
      try {
        const result = await file2Base64(file);
        onUserPrefsChange({ iconUrl: result, iconImageType: file.type });
      } catch (error) {
        console.error("Unable to convert uploaded image to base64: ", error);
      }
    },
    [enqueueNotification, onUserPrefsChange]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedChange = useCallback(
    debounce((displayLabel?: string) => {
      onUserPrefsChange({ displayLabel });
    }, 400),
    [onUserPrefsChange]
  );

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    debouncedChange(displayLabel);
  }, [displayLabel, debouncedChange]);

  const vtStart = vertexType.slice(0, vertexType.length / 2);
  const vtEnd = vertexType.slice(vertexType.length / 2, vertexType.length);
  const isSvg =
    (vtPrefs?.iconImageType || vtConfig?.iconImageType) === "image/svg+xml";

  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <Tooltip text={vertexType} placement={"top-center"}>
        <div className={pfx("title")}>
          <span data-content-start={vtStart} data-content-end={vtEnd} />
        </div>
      </Tooltip>
      <div className={pfx("editable-content")}>
        <div className={pfx("label")}>
          <Input
            aria-label={`label for vertex type ${vtConfig?.displayLabel}`}
            classNamePrefix={classNamePrefix}
            className={pfx("input")}
            type={"text"}
            value={displayLabel}
            placeholder={textTransform(vertexType)}
            onChange={setDisplayLabel}
          />
        </div>
        <div className={pfx("color")}>
          <ColorInput
            startColor={vtPrefs?.color || vtConfig?.color || "#128ee5"}
            onChange={(color: string) => onUserPrefsChange({ color })}
          />
        </div>
        <div className={pfx("icon")}>
          <FileButton
            accept={"image/*"}
            onChange={(file: File) => {
              convertImageToBase64AndSetNewIcon(file);
            }}
          >
            {props => (
              <IconButton
                icon={
                  <div>
                    <div className={pfx("upload-icon")}>
                      <UploadIcon />
                    </div>
                    <div
                      className={pfx("vertex-icon")}
                      style={{
                        background: fade(vtConfig?.color, 0.2),
                        color: vtConfig?.color,
                      }}
                    >
                      {isSvg && (
                        <RemoteSvgIcon
                          src={vtPrefs?.iconUrl || vtConfig?.iconUrl || ""}
                        />
                      )}
                      {!isSvg && (
                        <img
                          width={24}
                          height={24}
                          src={vtPrefs?.iconUrl || vtConfig?.iconUrl}
                        />
                      )}
                    </div>
                  </div>
                }
                tooltipText={"Upload New Icon"}
                tooltipPlacement={"bottom-end"}
                onClick={props.onClick}
              />
            )}
          </FileButton>
        </div>
      </div>
    </div>
  );
};

export default SingleVertexTypeStyling;
