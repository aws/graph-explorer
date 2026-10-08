import { useId } from "react";
import { z } from "zod";

import {
  CheckboxField,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  FormItem,
  InputField,
  Label,
  RadioGroup,
  RadioGroupItem,
  SelectField,
} from "@/components";

import type {
  ConnectionFormValues,
  SetConnectionFormField,
} from "./connectionFormModel";

import { serviceTypeSchema } from "./connectionFormModel";

const connectionMethodSchema = z.enum(["proxy", "browser"]);
type ConnectionMethod = z.infer<typeof connectionMethodSchema>;

type ConnectionMethodFieldProps = Pick<
  ConnectionFormValues,
  "directConnection" | "awsAuthEnabled" | "awsRegion" | "serviceType"
> & {
  regionError: string | undefined;
  setField: SetConnectionFormField;
};

/**
 * Picks how requests reach the database, then offers IAM authentication. IAM is
 * disabled for a direct connection, since the browser can't sign a request.
 */
export function ConnectionMethodField(props: ConnectionMethodFieldProps) {
  const { directConnection, setField } = props;
  const legendId = useId();
  const method: ConnectionMethod = directConnection ? "browser" : "proxy";

  return (
    <div className="flex flex-col gap-4">
      <FieldSet>
        <FieldLegend
          id={legendId}
          variant="label"
          className="text-muted-foreground"
        >
          Connection method
        </FieldLegend>
        <RadioGroup
          aria-labelledby={legendId}
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
            title="Through the Graph Explorer server"
            description="Recommended for every database, including Amazon Neptune. Add AWS IAM authentication below."
          />
          <MethodCard
            value="browser"
            title="Directly from your browser"
            description="For databases that accept queries from web pages, such as a public SPARQL endpoint."
          />
        </RadioGroup>
      </FieldSet>
      <IamSettings {...props} />
    </div>
  );
}

/**
 * A choice card. The whole card is the radio's label, so clicking anywhere on
 * it selects the method, and it highlights while its radio is checked.
 */
function MethodCard({
  value,
  title,
  description,
}: {
  value: ConnectionMethod;
  title: string;
  description: string;
}) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <FieldLabel htmlFor={id} className="text-foreground cursor-pointer">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle id={titleId}>{title}</FieldTitle>
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        </FieldContent>
        {/* Named by the title alone; the card's whole text would otherwise
            become the radio's name. */}
        <RadioGroupItem
          id={id}
          value={value}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        />
      </Field>
    </FieldLabel>
  );
}

// A direct connection never saves IAM, so while one is chosen the checkbox
// shows unchecked. The stored value is kept, so switching back restores it.
function IamSettings({
  directConnection,
  awsAuthEnabled,
  awsRegion,
  serviceType,
  regionError,
  setField,
}: ConnectionMethodFieldProps) {
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
        <div className="flex flex-col gap-4 pl-7">
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
