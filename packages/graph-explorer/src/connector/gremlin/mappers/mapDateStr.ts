// Sets the date into YYYY-MM-DD format
const mapDateStr = (date:string) : string =>{
    if ((date.match(new RegExp("/","g")) || []).length > 0){
        let chopDate = date.split("/");
        if (chopDate[2].length > 2){
            [chopDate[0], chopDate[1], chopDate[2]] = [chopDate[2], chopDate[0], chopDate[1]];
        }
        date = chopDate.join("-");
    };
    return date;
};

export default mapDateStr;