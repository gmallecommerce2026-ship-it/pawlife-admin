export const encodeData = (data: any): string => {
  try {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  } catch (e) {
    console.error("Encode error", e);
    return "";
  }
};

export const decodeData = (str: string | null): any => {
  if (!str) return null;
  try {
    return JSON.parse(Buffer.from(str, 'base64').toString('utf-8'));
  } catch (e) {
    console.error("Decode error", e);
    return null;
  }
};