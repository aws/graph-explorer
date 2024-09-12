import { format as dateFormat } from "date-fns";

const formatDate = (date: Date, format = "MMM dd yyyy, h:mm a") => {
  return dateFormat(date, format);
};

export default formatDate;
