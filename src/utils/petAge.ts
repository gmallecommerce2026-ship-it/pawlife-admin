// src/utils/petAge.ts
export function formatPetAge(birthDate?: string | Date | null): string {
  if (!birthDate) return 'Chưa rõ tuổi';

  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 'Chưa rõ tuổi';

  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  // Trừ thêm 1 tháng nếu chưa tới ngày trong tháng
  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }

  if (months < 0) return 'Chưa rõ tuổi';

  if (months < 12) {
    return `${months} tháng tuổi`;
  }

  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  return remMonths > 0 ? `${years} tuổi ${remMonths} tháng` : `${years} tuổi`;
}