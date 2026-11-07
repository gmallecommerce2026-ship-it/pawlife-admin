// Một số field (breed, description, color...) được PetForm lưu dạng
// { vi, en } sau khi submit (xem buildBilingualOnSubmit trong PetForm.tsx),
// nhưng data cũ hơn hoặc field khác có thể vẫn là string thuần.
// Parse phòng thủ cả 2 trường hợp, ưu tiên tiếng Việt vì trang shelter
// hiện tại 100% tiếng Việt.
//
// NẾU project đã có sẵn @/utils/bilingualField (displayBilingual), NÊN dùng
// trực tiếp từ đó thay vì file này để tránh lệch logic — file này chỉ là
// bản dự phòng khi chưa có.
export type MaybeBilingual = string | { vi?: string; en?: string } | null | undefined;

export const showText = (val: MaybeBilingual): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.vi || val.en || '';
};

// Rút gọn giống bên mobile: quá dài thì viết tắt chữ đầu.
export const formatBreed = (breed: MaybeBilingual): string => {
  const breedStr = showText(breed);
  if (!breedStr) return '';
  if (breedStr.length <= 18) return breedStr;
  const words = breedStr.split(' ');
  if (words.length > 1) {
    return `${words[0][0]}. ${words.slice(1).join(' ')}`;
  }
  return `${breedStr.substring(0, 18)}...`;
};