/**
 * Creates a subgraph and allows for interaction with the subgraph in other templates
 */
import mapDateStr from "../mappers/mapDateStr";
// nodes = Set
const subgraphTemplate = ({
    date = "string", 
    canvas = []
}): string => {
    // Create the subgraph based on the date filter 
    console.log(canvas)
    /**
     *  This is is going to do a filter for EVERY edge/node for Record_Active_Date-ish?? need to ask jeff
     * 
     * 
     * */
    let createSubGraph = `g.V("O-00000000","O-00000002","O-00000008","O-00000012")`;
    //createSubGraph += `has("Drug_Record_Active_Date__c", lte("${mapDateStr(date)}")),`;
    //createSubGraph += `has("Drug_Record_Expiration_Date__c", gte("${mapDateStr(date)}"))`;
    
    let subFilters = `.and(`;
    subFilters += `has("Offer_Record_Active_Date__c", lte("${mapDateStr(date)}"))`;
    subFilters += `, has("Offer_Record_Expiration_Date__c", gte("${mapDateStr(date)}"))`;
    subFilters +=  `)`

    createSubGraph += `${subFilters}`
    //createSubGraph += ".dedup().bothV().fold()";
    console.log(createSubGraph)

    return createSubGraph;
};

export default subgraphTemplate