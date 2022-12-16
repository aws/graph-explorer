import type { ActiveThemeType, ProcessedTheme } from "../../../core";
import { memoize } from "../../../utils";
import type { SelectTheme } from "../Select.model";

export const getSelectThemeWithDefaults = memoize(
  (
    activeTheme: ActiveThemeType<ProcessedTheme<SelectTheme>>,
    validationState: "valid" | "invalid"
  ) => (variant: "text" | "default") => {
    const { isDarkTheme, theme } = activeTheme;
    const { palette } = theme;
    const { text, background, primary, error } = palette;
    const baseFormTheme =
      variant === "default" ? theme.forms : ({} as typeof theme.forms);
    const selectTheme =
      variant === "default"
        ? theme?.select
        : theme?.select?.variants?.[variant];

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
          selectTheme?.error?.labelColor ||
          baseFormTheme?.error?.labelColor ||
          defaultValues.invalid.label,
        input: {
          background:
            selectTheme?.error?.background ||
            baseFormTheme?.error?.background ||
            defaultValues.invalid.background,
          color:
            selectTheme?.error?.color ||
            baseFormTheme?.error?.color ||
            defaultValues.invalid.color,
          border:
            selectTheme?.error?.border ||
            baseFormTheme?.error?.border ||
            defaultValues.invalid.border,
          placeholder:
            selectTheme?.error?.placeholderColor ||
            baseFormTheme?.error?.placeholderColor ||
            selectTheme?.placeholderColor ||
            baseFormTheme?.placeholderColor ||
            defaultValues.invalid.placeholder,
          focus: {
            shadow:
              selectTheme?.error?.focus?.outlineColor ||
              baseFormTheme?.error?.focus?.outlineColor ||
              error.main,
          },
        },
      },
      valid: {
        color:
          selectTheme?.label?.color ||
          baseFormTheme?.label?.color ||
          defaultValues.valid.label,
        input: {
          background:
            selectTheme?.background ||
            baseFormTheme?.background ||
            defaultValues.valid.background,
          color:
            selectTheme?.color ||
            baseFormTheme?.color ||
            defaultValues.valid.color,
          border:
            selectTheme?.border ||
            baseFormTheme?.border ||
            defaultValues.valid.border,
          placeholder:
            selectTheme?.placeholderColor ||
            baseFormTheme?.placeholderColor ||
            defaultValues.valid.placeholder,
          focus: {
            shadow:
              selectTheme?.error?.focus?.outlineColor ||
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
      borderRadius:
        selectTheme?.borderRadius ||
        baseFormTheme?.borderRadius ||
        theme.shape.borderRadius,
      disabledOpacity:
        selectTheme?.disabledOpacity || baseFormTheme?.disabledOpacity || "70%",
      padding: "0",
      paddingSmall: "0",
      focus: {
        outlineColor: `0 0 0 1px
          ${
            styleByValidationState[validationState || "valid"].input.focus
              .shadow
          }`,
        background:
          selectTheme?.focus?.background ||
          baseFormTheme?.focus?.background ||
          background.contrastSecondary,
        color:
          selectTheme?.focus?.color ||
          baseFormTheme?.focus?.color ||
          text.primary,
      },
      hover: {
        background:
          selectTheme?.hover?.background ||
          baseFormTheme?.hover?.background ||
          background.contrastSecondary,
        color:
          selectTheme?.hover?.color ||
          baseFormTheme?.hover?.color ||
          text.primary,
      },
      label: {
        color: styleByValidationState[validationState].color,
      },
      error: {
        errorColor:
          selectTheme?.error?.errorColor ||
          baseFormTheme?.error?.errorColor ||
          error.main,
      },
      list: {
        background:
          selectTheme?.list?.background || activeTheme.isDarkTheme
            ? background.contrast
            : background.default,
        borderColor: selectTheme?.list?.borderColor || "transparent",
        borderRadius:
          selectTheme?.list?.borderRadius || theme.shape.borderRadius,
        boxShadow: selectTheme?.list?.boxShadow || theme.shadow.md,
        search: {
          background:
            selectTheme?.list?.search?.background ||
            (isDarkTheme ? background.secondary : background.default),
        },
        header: {
          title: {
            color: selectTheme?.list?.header?.title?.color || text.primary,
          },
          subtitle: {
            color: selectTheme?.list?.header?.subtitle?.color || text.secondary,
          },
        },
        item: {
          background:
            selectTheme?.list?.item?.background ||
            (isDarkTheme ? background.contrast : background.default),
          color: selectTheme?.list?.item?.color || text.primary,
          selected: {
            background:
              selectTheme?.list?.item?.selected?.background ||
              background.contrastSecondary,
            color: selectTheme?.list?.item?.selected?.color || text.primary,
          },
          hover: {
            background:
              selectTheme?.list?.item?.hover?.background ||
              background.secondary,
            color: selectTheme?.list?.item?.hover?.color || text.primary,
          },
        },
      },
    };
  }
);

export default getSelectThemeWithDefaults;
