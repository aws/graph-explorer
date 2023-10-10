/**
 * Creates a subgraph and allows for interaction with the subgraph in other templates
 */
import mapDateStr from "../mappers/mapDateStr";

const subgraphTemplate = ({date = "2023-09-10"}): Array<string> => {
    let funcTemplates = [];
    // Create the subgraph based on the date filter 
    
    /**
     *  This is is going to do a filter for EVERY edge/node for Record_Active_Date-ish?? need to ask jeff
     * 
     * ...uhh just setup with nonsense for deets later
     * */
    funcTemplates.push(`datedGraph = g.V().has("SOME_ACTIVE_DATE",${mapDateStr(date)})`)
    

    funcTemplates.push("sg")

    return funcTemplates;
};

export default subgraphTemplate