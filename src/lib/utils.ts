export function generateOrderId(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Bỏ I, O, 0, 1 để tránh nhầm lẫn
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getVipRank(totalSpent: number) {
  if (totalSpent >= 10000000) return { label: "KIM CƯƠNG", color: "text-blue-600" };
  if (totalSpent >= 5000000) return { label: "VÀNG", color: "text-yellow-500" };
  if (totalSpent >= 2000000) return { label: "BẠC", color: "text-gray-400" };
  return { label: "THÀNH VIÊN", color: "text-green-500" };
}