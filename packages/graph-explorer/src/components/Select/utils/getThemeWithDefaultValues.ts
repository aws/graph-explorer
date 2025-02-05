import type { ActiveThemeType } from "@/core";
import { memoize } from "@/utils";

export const getSelectThemeWithDefaults = memoize(
  (activeTheme: ActiveThemeType, validationState: "valid" | "invalid") =>
    (variant: "text" | "default") => {
      const { isDarkTheme, theme } = activeTheme;
      const { palette } = theme;
      const { text, background, primary, error } = palette;
      const baseFormTheme =
        variant === "default" ? theme.forms : ({} as typeof theme.forms);

      const defaultStylesByVariantAndValidationState = {
        default: {
          invalid: {
            background: background.contrast,
            color: text.primary,
            border: `1px solid ${error.main}`,
            placeholder: text.disabled,
            label: error.main,
          },
          valid: {
            background: background.contrast,
            color: text.primary,
            border: `1px solid transparent`,
            placeholder: text.disabled,
            label: text.primary,
          },
        },
        text: {
          invalid: {
            background: "transparent",
            color: error.main,
            border: `1px solid transparent`,
            placeholder: error.light,
            label: error.main,
          },
          valid: {
            background: "transparent",
            color: text.primary,
            border: `1px solid transparent`,
            placeholder: primary.light,
            label: text.primary,
          },
        },
      };

      const defaultValues = defaultStylesByVariantAndValidationState[variant];
      const styleByValidationState = {
        invalid: {
          color:
            baseFormTheme?.error?.labelColor || defaultValues.invalid.label,
          input: {
            background:
              baseFormTheme?.error?.background ||
              defaultValues.invalid.background,
            color: baseFormTheme?.error?.color || defaultValues.invalid.color,
            border:
              baseFormTheme?.error?.border || defaultValues.invalid.border,
            placeholder:
              baseFormTheme?.error?.placeholderColor ||
              baseFormTheme?.placeholderColor ||
              defaultValues.invalid.placeholder,
            focus: {
              shadow: baseFormTheme?.error?.focus?.outlineColor || error.main,
            },
          },
        },
        valid: {
          color: baseFormTheme?.label?.color || defaultValues.valid.label,
          input: {
            background:
              baseFormTheme?.background || defaultValues.valid.background,
            color: baseFormTheme?.color || defaultValues.valid.color,
            border: baseFormTheme?.border || defaultValues.valid.border,
            placeholder:
              baseFormTheme?.placeholderColor ||
              defaultValues.valid.placeholder,
            focus: {
              shadow:
                baseFormTheme?.error?.focus?.outlineColor ||
                (isDarkTheme ? primary.dark : primary.main),
            },
          },
        },
      };

      return {
        background: styleByValidationState[validationState].input.background,
        color: styleByValidationState[validationState].color,
        placeholderColor:
          styleByValidationState[validationState].input.placeholder,
        border: styleByValidationState[validationState].input.border,
        zIndex: activeTheme.theme.zIndex.popover,
        borderRadius: baseFormTheme?.borderRadius || theme.shape.borderRadius,
        disabledOpacity: baseFormTheme?.disabledOpacity || "70%",
        padding: "0",
        paddingSmall: "0",
        focus: {
          outlineColor: `0 0 0 1px
          ${
            styleByValidationState[validationState || "valid"].input.focus
              .shadow
          }`,
          background:
            baseFormTheme?.focus?.background || background.contrastSecondary,
          color: baseFormTheme?.focus?.color || text.primary,
        },
        hover: {
          background:
            baseFormTheme?.hover?.background || background.contrastSecondary,
          color: baseFormTheme?.hover?.color || text.primary,
        },
        label: {
          color: styleByValidationState[validationState].color,
        },
        error: {
          errorColor: baseFormTheme?.error?.errorColor || error.main,
        },
        list: {
          background: activeTheme.isDarkTheme
            ? background.contrast
            : background.default,
          borderColor: "transparent",
          borderRadius: theme.shape.borderRadius,
          search: {
            background: isDarkTheme ? background.secondary : background.default,
          },
          header: {
            title: {
              color: text.primary,
            },
            subtitle: {
              color: text.secondary,
            },
          },
          item: {
            background: isDarkTheme ? background.contrast : background.default,
            color: text.primary,
            selected: {
              background: background.contrastSecondary,
              color: text.primary,
            },
            hover: {
              background: background.secondary,
              color: text.primary,
            },
          },
        },
      };
    }
);

export default getSelectThemeWithDefaults;
