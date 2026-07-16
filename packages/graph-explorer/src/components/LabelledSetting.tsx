import type { PropsWithChildren } from "react";

export function LabelledSetting({
  label,
  description,
  htmlFor,
  children,
}: PropsWithChildren<{
  label: string;
  description?: string;
  htmlFor?: string;
}>) {
  return (
    <div className="group/labelled-setting flex flex-row items-center gap-8">
      <label
        htmlFor={htmlFor}
        className="block flex-1 space-y-1 group-has-disabled/labelled-setting:cursor-not-allowed group-has-disabled/labelled-setting:opacity-70"
      >
        <p className="text-text-primary text-base leading-none font-medium text-pretty">
          {label}
        </p>
        {description ? (
          <p className="text-text-secondary text-sm leading-normal font-normal text-pretty">
            {description}
          </p>
        ) : null}
      </label>
      {children}
    </div>
  );
}
