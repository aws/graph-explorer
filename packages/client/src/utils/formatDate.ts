import dateFormat from "date-fns/format";

const formatDate = (date: Date, format = "MMMM dd yyyy, h:mm a") => {
  return dateFormat(date, format);
};

export default formatDate;
