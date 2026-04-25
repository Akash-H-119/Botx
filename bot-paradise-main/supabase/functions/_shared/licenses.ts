const chunk = (value: string) => value.match(/.{1,4}/g)?.join("-") ?? value;

export const createLicenseKey = () => {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .slice(0, 24);

  return `CB-${chunk(body)}`;
};

export const addDays = (date: Date, days: number | null) => {
  if (!days) return null;
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
};
