export function extractTime(dateString) {
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = padZero(date.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${hours}:${minutes} ${ampm}`;
}

export function extractDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isYesterday = date.toDateString() === yesterday.toDateString();
  const dayName = date.toLocaleString("default", { weekday: "long" });
  let hours = date.getHours();
  const minutes = padZero(date.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12;

  const dateFormat = isYesterday ? "Yesterday" : `${dayName}`;

  return `${dateFormat} at ${hours}:${minutes} ${ampm}`;
}

export function extractYear(dateString) {
  const date = new Date(dateString);
  const day = padZero(date.getDate());
  const month = padZero(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function padZero(number) {
  return number.toString().padStart(2, "0");
}
