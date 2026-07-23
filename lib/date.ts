export const formatTimestamp = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const toLocalInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export const hasEnded = (endAt?: string, now = Date.now()) => {
  if (!endAt) return false;
  const endTime = new Date(endAt).getTime();
  if (Number.isNaN(endTime)) return false;
  return now >= endTime;
};

export const getDefaultEndAtValue = () =>
  toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000).toISOString());
