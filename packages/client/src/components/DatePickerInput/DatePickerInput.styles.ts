import { css } from "@emotion/css";
import { ThemeStyleFn } from "../../core";

const inputCalendar = css`
  padding: 0;

  &:hover {
    background-color: transparent;
  }
`;

const dateInputStyles = (prefix: string): ThemeStyleFn => ({ theme }) => {
  const {
    iconButton,
    palette: { primary },
  } = theme;
  return css`
    .${prefix}-datepicker-input {
      height: auto;
      .${prefix}-datepicker-calendar-button {
        color: ${iconButton?.variants?.text?.color || primary.main};
      }
    }

    &.${prefix}-datepicker-input-disabled {
    }
    .${prefix}-input-container:hover:not(.${prefix}-datepicker-input-disabled) {
      .${prefix}-datepicker-calendar-button {
        color: ${iconButton?.variants?.text?.hover?.color || primary.light};
      }
    }

    .${prefix}-input-container:hover {
      .${prefix}-datepicker-clear-button:hover {
        & ~ .${prefix}-datepicker-calendar-button {
          color: ${iconButton?.variants?.text?.color || primary.light};
        }
      }
    }
  `;
};

const pickerStyles = css`
  .ft-datepicker-calendar {
    position: static;
    box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.25);
  }
`;

const styles = {
  inputCalendar,
  dateInputStyles,
  pickerStyles,
};
export default styles;
