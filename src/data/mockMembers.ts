import { MemberDirectoryItem } from '../types';

export const INITIAL_MEMBERS: MemberDirectoryItem[] = [
  // Cựu thành viên (Alumni)
  { id: 'csg-001', mssv: 'SE120101', fullName: 'Huỳnh Tấn Phát', role: 'ALUMNI', honorific: 'Anh', generation: 'K12', department: 'Cựu Chủ nhiệm' },
  { id: 'csg-002', mssv: 'SE130245', fullName: 'Trần Thảo My', role: 'ALUMNI', honorific: 'Chị', generation: 'K13', department: 'Cựu Phó Chủ nhiệm' },
  { id: 'csg-003', mssv: 'SE140512', fullName: 'Nguyễn Đăng Khoa', role: 'ALUMNI', honorific: 'Anh', generation: 'K14', department: 'Ban Kỹ Thuật' },
  { id: 'csg-004', mssv: 'SE140889', fullName: 'Lê Hoàng Yến', role: 'ALUMNI', honorific: 'Chị', generation: 'K14', department: 'Ban Nội Dung' },
  { id: 'csg-005', mssv: 'SE150334', fullName: 'Phạm Minh Quân', role: 'ALUMNI', honorific: 'Anh', generation: 'K15', department: 'Ban Sự Kiện' },
  { id: 'csg-006', mssv: 'SE150772', fullName: 'Đặng Ngọc Trâm', role: 'ALUMNI', honorific: 'Chị', generation: 'K15', department: 'Ban Thiết Kế' },
  { id: 'csg-007', mssv: 'SE160105', fullName: 'Vũ Đức Duy', role: 'ALUMNI', honorific: 'Anh', generation: 'K16', department: 'Cựu Trưởng Ban KT' },
  { id: 'csg-008', mssv: 'SE160450', fullName: 'Bùi Kim Ngân', role: 'ALUMNI', honorific: 'Chị', generation: 'K16', department: 'Ban Nhân Sự' },
  { id: 'csg-009', mssv: 'SE160890', fullName: 'Đỗ Thành Đạt', role: 'ALUMNI', honorific: 'Anh', generation: 'K16', department: 'Ban Nhiếp Ảnh' },
  
  // Thành viên đương nhiệm (Active Members)
  { id: 'csg-010', mssv: 'SE170112', fullName: 'Nguyễn Phúc An', role: 'ACTIVE', honorific: 'Bạn', generation: 'K17', department: 'Chủ nhiệm đương nhiệm' },
  { id: 'csg-011', mssv: 'SE170321', fullName: 'Trần Gia Hân', role: 'ACTIVE', honorific: 'Bạn', generation: 'K17', department: 'Phó Chủ nhiệm' },
  { id: 'csg-012', mssv: 'SE170994', fullName: 'Lý Quốc Bảo', role: 'ACTIVE', honorific: 'Bạn', generation: 'K17', department: 'Trưởng Ban Kỹ Thuật' },
  { id: 'csg-013', mssv: 'SE180215', fullName: 'Võ Minh Thư', role: 'ACTIVE', honorific: 'Bạn', generation: 'K18', department: 'Trưởng Ban Truyền Thông' },
  { id: 'csg-014', mssv: 'SE180633', fullName: 'Hoàng Nhật Minh', role: 'ACTIVE', honorific: 'Bạn', generation: 'K18', department: 'Trưởng Ban Sự Kiện' },
  { id: 'csg-015', mssv: 'SE180902', fullName: 'Ngô Khánh Linh', role: 'ACTIVE', honorific: 'Bạn', generation: 'K18', department: 'Ban Thiết Kế' },
  { id: 'csg-016', mssv: 'SE190145', fullName: 'Trịnh Gia Huy', role: 'ACTIVE', honorific: 'Bạn', generation: 'K19', department: 'Ban Kỹ Thuật' },
  { id: 'csg-017', mssv: 'SE190558', fullName: 'Phan Bảo Trân', role: 'ACTIVE', honorific: 'Bạn', generation: 'K19', department: 'Ban Đối Ngoại' },
  { id: 'csg-018', mssv: 'SE190820', fullName: 'Đinh Tuấn Kiệt', role: 'ACTIVE', honorific: 'Bạn', generation: 'K19', department: 'Ban Nhiếp Ảnh' },
  { id: 'csg-019', mssv: 'SE200031', fullName: 'Cao Phương Uyên', role: 'ACTIVE', honorific: 'Bạn', generation: 'K20', department: 'Tập sự K20' },
  { id: 'csg-020', mssv: 'SE200199', fullName: 'Lâm Tuấn Khải', role: 'ACTIVE', honorific: 'Bạn', generation: 'K20', department: 'Tập sự K20' },
];

// Helper: Normalize string for fuzzy accent-insensitive search
export function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

export function findMemberInDirectory(query: string): MemberDirectoryItem | null {
  if (!query || query.trim().length === 0) return null;
  const qNorm = normalizeVietnamese(query);
  const qUpper = query.trim().toUpperCase();

  // 1. Direct MSSV match
  const byMSSV = INITIAL_MEMBERS.find(m => m.mssv.toUpperCase() === qUpper);
  if (byMSSV) return byMSSV;

  // 2. Exact or substring Name match
  const byName = INITIAL_MEMBERS.find(m => {
    const nameNorm = normalizeVietnamese(m.fullName);
    return nameNorm === qNorm || nameNorm.includes(qNorm) || qNorm.includes(nameNorm);
  });
  if (byName) return byName;

  return null;
}
