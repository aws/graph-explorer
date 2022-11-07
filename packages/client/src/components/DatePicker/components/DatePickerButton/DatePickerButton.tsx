import format from "date-fns/format";

import Button from "../../../Button";

export type DateRangeSelection = {
  startDate?: Date | null;
  endDate?: Date | null;
};

interface DatePickerButtonProps {
  mode: "calendar" | "range";
  dateFormat?: string;
  classNamePrefix?: string;
  className?: string;
  state?: Date | DateRangeSelection;
  onClick: () => void;
  disabled?: boolean;
  buttonVariant?: "filled" | "text" | "default";
}

export const DatePickerButton = ({
  classNamePrefix = "ft-datepickerInput-button",
  className,
  mode,
  state,
  dateFormat = "MM/dd/yyyy",
  onClick,
  buttonVariant,
  disabled = false,
}: DatePickerButtonProps) => {
  const startDate = (state as DateRangeSelection).startDate;
  const endDate = (state as DateRangeSelection).endDate;

  return (
    <div className={className}>
      <Button
        className={`${classNamePrefix}-button`}
        onPress={onClick}
        isDisabled={disabled}
        variant={buttonVariant}
      >
        {mode !== "calendar" ? (
          <>
            {state && startDate ? (
              format(startDate, dateFormat)
            ) : (
              <span style={{ opacity: 0.5 }}>--/--/----</span>
            )}
            {<span style={{ opacity: 0.5, padding: "0 4px" }}>-</span>}
            {state && endDate ? (
              format(endDate, dateFormat)
            ) : (
              <span style={{ opacity: 0.5 }}>--/--/----</span>
            )}
          </>
        ) : (
          <>
            {(state as Date) ? (
              format(state as Date, dateFormat)
            ) : (
              <span style={{ opacity: 0.5 }}>--/--/----</span>
            )}
          </>
        )}
      </Button>
    </div>
  );
};

export default DatePickerButton;
