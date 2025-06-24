import {
  createRandomBoolean,
  createRandomDate,
  createRandomDouble,
  createRandomInteger,
  createRandomName,
} from "@shared/utils/testing";
import mapApiVertex from "./mapApiVertex";
import { createVertex } from "@/core";
import { OCVertex } from "../types";

test("maps empty vertex", () => {
  const input = {
    "~labels": [],
    "~entityType": "node",
    "~id": "",
    "~properties": {},
  };
  const result = mapApiVertex(input);

  expect(result).toEqual(
    createVertex({
      id: "",
      types: [],
      attributes: {},
    })
  );
});

test("maps known property types", () => {
  const input = {
    "~id": "1",
    "~entityType": "node",
    "~labels": ["airport"],
    "~properties": {
      stringValue: createRandomName("stringValue"),
      integerValue: createRandomInteger(),
      booleanValue: createRandomBoolean(),
      doubleValue: createRandomDouble(),
      dateValue: createRandomDate().toISOString(),
    },
  } satisfies OCVertex;
  const result = mapApiVertex(input);
  expect(result).toEqual(
    createVertex({
      id: "1",
      types: ["airport"],
      attributes: {
        stringValue: input["~properties"].stringValue,
        integerValue: input["~properties"].integerValue,
        booleanValue: input["~properties"].booleanValue,
        doubleValue: input["~properties"].doubleValue,
        dateValue: input["~properties"].dateValue,
      },
    })
  );
});

test("maps airport node", () => {
  const input = {
    "~id": "1",
    "~entityType": "node",
    "~labels": ["airport"],
    "~properties": {
      code: "ATL",
      type: "airport",
      desc: "Hartsfield - Jackson Atlanta International Airport",
      country: "US",
      longest: 12390,
      city: "Atlanta",
      lon: -84.4281005859375,
      elev: 1026,
      icao: "KATL",
      region: "US-GA",
      runways: 5,
      lat: 33.6366996765137,
    },
  };

  const result = mapApiVertex(input);

  expect(result).toEqual(
    createVertex({
      id: "1",
      types: ["airport"],
      attributes: {
        city: "Atlanta",
        code: "ATL",
        country: "US",
        desc: "Hartsfield - Jackson Atlanta International Airport",
        elev: 1026,
        icao: "KATL",
        lat: 33.6366996765137,
        lon: -84.4281005859375,
        longest: 12390,
        region: "US-GA",
        runways: 5,
        type: "airport",
      },
    })
  );
});
