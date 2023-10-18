/**
 * Creates a subgraph and allows for interaction with the subgraph in other templates
 */
import { forEach } from "lodash";
import { SubGraphRequest } from "../../AbstractConnector";
import mapDateStr from "../mappers/mapDateStr";
import { m } from "framer-motion";
// nodes = Set
const subgraphTemplate = ({
    date = "string", 
    canV,
    canE,
}: SubGraphRequest): string => {
    // Create the subgraph based on the date filter 
    let vString = `(`;
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

    let offerFilter  = `and(`;
    offerFilter += `has("Offer_Record_Active_Date__c", lte("${mapDateStr(date)}"))`;
    offerFilter += `, has("Offer_Record_Expiration_Date__c", gte("${mapDateStr(date)}"))`;
    offerFilter +=  `)`

    let drugFilter = `and(`;
    drugFilter += `has("Drug_Record_Active_Date__c", lte("${mapDateStr(date)}"))`;
    drugFilter += `, has("Drug_Record_Expiration_Date__c", gte("${mapDateStr(date)}"))`;
    drugFilter +=  `)`

    let pcrFilter = `and(`;
    pcrFilter += `has("Pharmacy_Contract_Rate_Record_Active_D__c", lte("${mapDateStr(date)}"))`;
    pcrFilter += `, has("Pharmacy_Contract_Rate_Record_Expirati__c", gte("${mapDateStr(date)}"))`;
    pcrFilter +=  `)`

    let bnrFilter = `and(`;
    bnrFilter += `has("Benefit_Net_Rate_Record_Active_Date__c", lte("${mapDateStr(date)}"))`;
    bnrFilter += `, has("Benefit_Net_Rate_Record_Expiration_Dat__c", gte("${mapDateStr(date)}"))`;
    bnrFilter +=  `)`

    let contFilter = `and(`;
    contFilter += `has("Contract_Record_Active_Date__c", lte("${mapDateStr(date)}"))`;
    contFilter += `, has("Contract_Record_Expiration_Date__c", gte("${mapDateStr(date)}"))`;
    contFilter +=  `)`

    let campFilter = `and(`;
    campFilter += `has("Campaign_Record_Active_Date__c", lte("${mapDateStr(date)}"))`;
    campFilter += `, has("Campaign_Record_Expiration_Date__c", gte("${mapDateStr(date)}"))`;
    campFilter +=  `)`

    let netwFilter = `and(`;
    netwFilter += `has("Network_Record_Active_Date__c", lte("${mapDateStr(date)}"))`;
    netwFilter += `, has("Network_Record_Expiration_Date__c", gte("${mapDateStr(date)}"))`;
    netwFilter +=  `)`

    let pharmacy = `hasLabel("pharmacy")`

    let filters: string = [
        bnrFilter,
        campFilter,
        contFilter,
        drugFilter,
        offerFilter,
        netwFilter, 
        pcrFilter,
        pharmacy
    ].join(",")

    createSubGraph += `.or(${filters})`
    //createSubGraph += ".dedup().bothV().fold()";
    console.log(createSubGraph)

    return createSubGraph;
};

export default subgraphTemplate