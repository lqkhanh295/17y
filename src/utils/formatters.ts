/**
 * Remove Vietnamese diacritics and convert to uppercase for standard banking compatibility.
 * Example: "Nguyễn Tiến Cường" -> "NGUYEN TIEN CUONG"
 */
export function toUnaccentedUpper(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'D')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .trim();
}

/**
 * Format transfer content following Coc Sai Gon 17Y standard:
 * CSG17 - HỌ VÀ TÊN - SĐT
 * 
 * Example: "CSG17 - NGUYEN TIEN CUONG - 0901234567"
 */
export function formatTransferContent(fullName: string, phone: string): string {
  const cleanName = toUnaccentedUpper(fullName) || 'HO VA TEN';
  const cleanPhone = phone.replace(/[^0-9]/g, '').trim() || 'SDT';
  return `CSG17 - ${cleanName} - ${cleanPhone}`;
}
