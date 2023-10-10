/**
 * Creates a subgraph and allows for interaction with the subgraph in other templates
 */
import mapDateStr from "../mappers/mapDateStr";

const subgraphTemplate = ({date = "2023-09-10"}): Array<string> => {
    // Create the subgraph based on the date filter 
    
    /**
     *  This is is going to do a filter for EVERY edge/node for Record_Active_Date-ish?? need to ask jeff
     * 
     * ...uhh just setup with nonsense for deets later
     * */
    let createSubGraph = `subGraph = g.V().and(`;
    createSubGraph += `has("Drug_Record_Active_Date__c", lte("${mapDateStr(date)}"))`;
    createSubGraph += `has("Drug_Record_Expiration_Date__c", gte("${mapDateStr(date)}"))`;
    createSubGraph += ")";

    const subTrav = "sg = traversal().withEmbedded(subGraph)"

    const testTrav = "sg.V().limit(1)"

    return [createSubGraph, subTrav, testTrav];
};

export default subgraphTemplate