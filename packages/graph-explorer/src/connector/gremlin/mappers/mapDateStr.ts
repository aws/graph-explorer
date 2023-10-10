// Sets the date into YYYY-MM-DD format
const mapDateStr = (date:string) : string =>{
    if ((date.match(new RegExp("/","g")) || []).length > 0){
        let chopDate = date.split("/");
        chopDate.forEach(function (piece, inx){
            if (piece.length == 4){
                [chopDate[0], chopDate[inx]] = [chopDate[inx], chopDate[0]];
            };
        });
        date = chopDate.join("-");
    };
    return date;
};

export default mapDateStr;