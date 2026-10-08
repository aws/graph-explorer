import { useId } from "react";
import { z } from "zod";

import {
  CheckboxField,
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
 * Picks how requests reach the database, then offers IAM authentication. IAM is
 * disabled for a direct connection, since the browser can't sign a request.
 */
export function ConnectionMethodField({
  directConnection,
  setField,
  ...iamSettings
}: ConnectionMethodFieldProps) {
  const labelId = useId();
  const method: ConnectionMethod = directConnection ? "browser" : "proxy";

  return (
    <div className="flex flex-col gap-4">
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
            title="Through the Graph Explorer server"
            description="Recommended for every database, including Amazon Neptune. Add AWS IAM authentication below."
          />
          <MethodCard
            value="browser"
            selected={method === "browser"}
            title="Directly from your browser"
            description="For databases that accept queries from web pages, such as a public SPARQL endpoint."
          />
        </RadioGroup>
      </FormItem>
      <IamSettings
        {...iamSettings}
        directConnection={directConnection}
        setField={setField}
      />
    </div>
  );
}

/** A choice card. Clicking anywhere on it selects the method. */
function MethodCard({
  value,
  selected,
  title,
  description,
}: {
  value: ConnectionMethod;
  selected: boolean;
  title: string;
  description: string;
}) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start justify-between gap-3 rounded-md border p-4",
        selected && "border-primary bg-primary/5",
      )}
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
  );
}

type IamSettingsProps = Pick<
  ConnectionFormValues,
  "awsAuthEnabled" | "awsRegion" | "serviceType"
> & {
  regionError: string | undefined;
  setField: SetConnectionFormField;
};

// A direct connection never saves IAM, so while one is chosen the checkbox
// shows unchecked. The stored value is kept, so switching back restores it.
function IamSettings({
  directConnection,
  awsAuthEnabled,
  awsRegion,
  serviceType,
  regionError,
  setField,
}: IamSettingsProps & Pick<ConnectionFormValues, "directConnection">) {
  const iamInEffect = awsAuthEnabled && !directConnection;

  return (
    <div className="flex flex-col gap-4">
      <CheckboxField
        label="Use AWS IAM authentication"
        description="The Graph Explorer server signs requests with its own AWS credentials, not yours."
        checked={iamInEffect}
        disabled={directConnection}
        onCheckedChange={setField("awsAuthEnabled")}
      />
      {iamInEffect && (
        <div className="flex flex-col gap-4 pl-6">
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
        </div>
      )}
    </div>
  );
}
