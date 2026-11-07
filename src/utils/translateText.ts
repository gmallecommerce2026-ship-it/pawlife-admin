// src/utils/translateText.ts

/**
 * Lớp fallback "chống sót tiếng Anh": dịch tự động một hoặc nhiều đoạn text
 * sang tiếng Việt bằng API dịch thật, dùng cho các trường hợp mà
 * translateApplication.ts (dịch tĩnh theo map) chưa cover được — enum mới,
 * dữ liệu tự do nhập từ DB (breed, lý do nhận nuôi, lịch sử nuôi thú...).
 *
 * - Có cache trong bộ nhớ để không gọi API lặp lại cho cùng 1 chuỗi trong phiên làm việc.
 * - Có heuristic bỏ qua nếu text đã có dấu tiếng Việt, đỡ tốn API call không cần thiết.
 * - Nếu API lỗi/timeout, fallback về text gốc thay vì làm hỏng cả luồng export PDF.
 */

const translationCache = new Map<string, string>();

// Nếu text đã có dấu tiếng Việt thì coi như đã ổn, không cần gọi API nữa
const VN_DIACRITICS_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

async function translateOne(text: string, target = 'vi'): Promise<string> {
  const trimmed = (text ?? '').toString().trim();
  if (!trimmed) return text;
  if (VN_DIACRITICS_REGEX.test(trimmed)) return trimmed;

  const cacheKey = `${target}:${trimmed}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey)!;

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, target }),
    });
    if (!res.ok) throw new Error(`translate api status ${res.status}`);
    const data = await res.json();
    const translated = (data?.translatedText as string) || trimmed;
    translationCache.set(cacheKey, translated);
    return translated;
  } catch (err) {
    console.error('[translateText] Lỗi gọi API dịch, giữ nguyên text gốc:', err);
    return trimmed;
  }
}

/**
 * Dịch một object { key: text } sang tiếng Việt, trả về object cùng shape.
 * Dùng để dịch nhiều trường của đơn nhận nuôi trong 1 lần gọi (song song).
 */
export async function translateManyToVi<T extends Record<string, string>>(
  texts: T
): Promise<T> {
  const keys = Object.keys(texts) as (keyof T)[];
  const translated = await Promise.all(keys.map((k) => translateOne(texts[k] as string)));
  const result = {} as T;
  keys.forEach((k, i) => {
    result[k] = translated[i] as T[keyof T];
  });
  return result;
}