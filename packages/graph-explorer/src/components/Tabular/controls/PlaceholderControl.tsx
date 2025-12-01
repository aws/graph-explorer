import type { PropsWithChildren } from "react";

export const PlaceholderControl = ({ children }: PropsWithChildren) => {
  return (
    <div className="text-primary-main text-[1.3rem] italic opacity-70">
      {children}
    </div>
  );
};

export default PlaceholderControl;
