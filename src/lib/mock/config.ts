// Chế độ FE mock: dữ liệu giả trong bộ nhớ, không cần backend/database.
// Bật bằng NEXT_PUBLIC_MOCK=1 trong .env.local
export const MOCK = process.env.NEXT_PUBLIC_MOCK === "1";
export const MOCK_COOKIE = "mock_admin";
