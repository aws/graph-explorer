/**
 * Creates a subgraph and allows for interaction with the subgraph in other templates
 */
import { forEach } from "lodash";
import { SubGraphRequest } from "../../AbstractConnector";
import mapDateStr from "../mappers/mapDateStr";
// nodes = Set
const subgraphTemplate = ({
    date = "string", 
    canV,
    canE,
}: SubGraphRequest): string => {
    // Create the subgraph based on the date filter 
    let vString = `( `;
    canV.forEach(function (node){
        vString += `"${node.data.id}",`
    })
    vString = vString.substring(0, vString.length - 1)
    vString += ")"
    console.log(vString)
    /**
     *  This is is going to do a filter for EVERY edge/node for Record_Active_Date-ish
     * 
     * */

    let createSubGraph = `g.V${vString}`;
    //createSubGraph += `has("Drug_Record_Active_Date__c", lte("${mapDateStr(date)}")),`;
    //createSubGraph += `has("Drug_Record_Expiration_Date__c", gte("${mapDateStr(date)}"))`;

    //ADZENYS XR-ODT TAB RAP BP 15.7 MG

    let subFilters = `and(`;
    subFilters += `has("Offer_Record_Active_Date__c", lte("${mapDateStr(date)}"))`;
    subFilters += `, has("Offer_Record_Expiration_Date__c", gte("${mapDateStr(date)}"))`;
    subFilters +=  `),`

    subFilters += `and(`
    subFilters += `has("Drug_Record_Active_Date__c", lte("${mapDateStr(date)}"))`;
    subFilters += `, has("Drug_Record_Expiration_Date__c", gte("${mapDateStr(date)}"))`;
    subFilters +=  `)`

    createSubGraph += `.or(${subFilters})`
    //createSubGraph += ".dedup().bothV().fold()";
    console.log(createSubGraph)

    return createSubGraph;
};

export default subgraphTemplate