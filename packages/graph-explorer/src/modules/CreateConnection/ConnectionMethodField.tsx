import { useId } from "react";
import { z } from "zod";

import {
  Checkbox,
  FormItem,
  InputField,
  Label,
  RadioGroup,
  RadioGroupItem,
  SelectField,
} from "@/components";
import { cn } from "@/utils";

import type {
  ConnectionFormValues,
  SetConnectionFormField,
} from "./connectionFormModel";

import { serviceTypeSchema } from "./connectionFormModel";

const connectionMethodSchema = z.enum(["proxy", "browser"]);
type ConnectionMethod = z.infer<typeof connectionMethodSchema>;

type ConnectionMethodFieldProps = IamSettingsProps &
  Pick<ConnectionFormValues, "directConnection">;

/**
 * Picks how requests reach the database. IAM authentication is offered only on
 * the proxy method, since the browser can't sign a request.
 */
export function ConnectionMethodField({
  directConnection,
  setField,
  ...iamSettings
}: ConnectionMethodFieldProps) {
  const labelId = useId();
  const method: ConnectionMethod = directConnection ? "browser" : "proxy";

  return (
    <FormItem>
      <Label id={labelId}>Connection method</Label>
      <RadioGroup
        aria-labelledby={labelId}
        value={method}
        onValueChange={value =>
          setField("directConnection")(
            connectionMethodSchema.parse(value) === "browser",
          )
        }
        className="gap-3"
      >
        <MethodCard
          value="proxy"
          selected={method === "proxy"}
          title="Via proxy server"
          description="Works with Amazon Neptune, supports IAM authentication and query cancellation, and needs no CORS setup."
          footer={<IamSettings {...iamSettings} setField={setField} />}
        />
        <MethodCard
          value="browser"
          selected={method === "browser"}
          title="Directly via browser"
          description="Reaches databases only your browser can. The database must allow CORS, and IAM, cancellation and logging are unavailable."
        />
      </RadioGroup>
    </FormItem>
  );
}

function MethodCard({
  value,
  selected,
  title,
  description,
  footer,
}: {
  value: ConnectionMethod;
  selected: boolean;
  title: string;
  description: string;
  footer?: React.ReactNode;
}) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-md border p-4",
        selected && "border-primary bg-primary/5",
      )}
    >
      {/* The label's pseudo-element stretches over the card so any part of it
          selects the method, while the footer stays above to remain usable. */}
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start justify-between gap-3 after:absolute after:inset-0 after:rounded-md"
      >
        <span className="flex flex-col gap-1">
          <span id={titleId} className="font-medium">
            {title}
          </span>
          <span id={descriptionId} className="text-muted-foreground text-sm">
            {description}
          </span>
        </span>
        <RadioGroupItem
          id={id}
          value={value}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="mt-0.5"
        />
      </label>
      {selected && footer && <div className="relative pt-1">{footer}</div>}
    </div>
  );
}

type IamSettingsProps = Pick<
  ConnectionFormValues,
  "awsAuthEnabled" | "awsRegion" | "serviceType"
> & {
  regionError: string | undefined;
  setField: SetConnectionFormField;
};

function IamSettings({
  awsAuthEnabled,
  awsRegion,
  serviceType,
  regionError,
  setField,
}: IamSettingsProps) {
  return (
    <div className="flex flex-col gap-4 border-t pt-4">
      <Label className="cursor-pointer">
        <Checkbox
          value="awsAuthEnabled"
          checked={awsAuthEnabled}
          onCheckedChange={checked =>
            setField("awsAuthEnabled")(checked === true)
          }
        />
        Use AWS IAM authentication
      </Label>
      {awsAuthEnabled && (
        <>
          <p className="text-muted-foreground text-sm">
            The Graph Explorer server signs requests with its own AWS
            credentials, not yours.
          </p>
          <FormItem>
            <Label>AWS Region</Label>
            <InputField
              aria-label="AWS Region"
              data-autofocus={true}
              value={awsRegion}
              onChange={setField("awsRegion")}
              errorMessage={regionError}
              placeholder="us-east-1"
              validationState={regionError ? "invalid" : "valid"}
            />
          </FormItem>
          <FormItem>
            <Label>Service Type</Label>
            <SelectField
              aria-label="Service Type"
              options={[
                { label: "Neptune DB", value: "neptune-db" },
                { label: "Neptune Analytics", value: "neptune-graph" },
              ]}
              value={serviceType}
              onValueChange={value =>
                setField("serviceType")(serviceTypeSchema.parse(value))
              }
            />
          </FormItem>
        </>
      )}
    </div>
  );
}
