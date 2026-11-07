// src/utils/translateApplication.ts

// 1. Đối tượng nhận nuôi (Adopt For)
export const translateAdoptFor = (val?: string | null): string => {
  if (!val) return 'Bản thân tự nuôi';
  const clean = val.trim().toLowerCase();
  if (['someone else', 'other', 'nuoi ho', 'nuôi hộ'].includes(clean)) {
    return 'Nuôi hộ người khác';
  }
  return 'Bản thân tự nuôi';
};

// 2. Loại nhà ở (Housing)
export const translateHousing = (val?: string | null): string => {
  if (!val) return 'Chung cư (cho phép nuôi thú cưng)';
  const map: Record<string, string> = {
    'apartment': 'Chung cư',
    'apartment (pets allowed)': 'Chung cư (cho phép nuôi thú cưng)',
    'house': 'Nhà riêng / Nhà đất',
    'townhouse': 'Nhà phố',
    'villa': 'Biệt thự',
    'rented room': 'Phòng trọ',
    'rental house': 'Nhà thuê (cho phép nuôi thú cưng)',
    'dormitory': 'Ký túc xá',
  };
  return map[val.trim().toLowerCase()] || val;
};

// 3. Trẻ em trong nhà (Children)
export const translateChildren = (val?: string | null): string => {
  if (!val) return 'Không có trẻ nhỏ';
  const clean = val.trim().toLowerCase();
  const map: Record<string, string> = {
    'no': 'Không có trẻ nhỏ',
    'no children': 'Không có trẻ nhỏ',
    'none': 'Không có trẻ nhỏ',
    'yes': 'Có trẻ nhỏ trong nhà',
    'under 5': 'Có trẻ dưới 5 tuổi',
    'under 5 years old': 'Có trẻ dưới 5 tuổi',
    '5-12 years old': 'Có trẻ từ 5 - 12 tuổi',
    'above 12': 'Có trẻ trên 12 tuổi',
  };
  return map[clean] || val;
};

// 4. Kế hoạch chuồng / xích (Cage)
export const translateCage = (val?: string | null): string => {
  if (!val) return 'Không xích nhốt';
  const clean = val.trim().toLowerCase();
  const map: Record<string, string> = {
    'no': 'Không xích nhốt',
    'no cage': 'Không xích nhốt',
    'free roaming': 'Tự do trong nhà (không xích nhốt)',
    'indoor free': 'Thả tự do trong nhà',
    'caged': 'Nuôi nhốt chuồng',
    'caged at night': 'Nhốt chuồng vào ban đêm',
    'leashed': 'Có xích khi cần thiết',
  };
  return map[clean] || val;
};

// 5. Kinh nghiệm nuôi (Pet Experience)
export const translatePetExperience = (val?: string | null): string => {
  if (!val) return 'Đã có kinh nghiệm';
  const clean = val.trim().toLowerCase();
  const map: Record<string, string> = {
    'experienced': 'Đã có kinh nghiệm nuôi',
    'had pets before': 'Đã từng nuôi trước đây',
    'first time': 'Lần đầu nuôi thú cưng',
    'first time owner': 'Lần đầu nuôi thú cưng',
    'no experience': 'Chưa có kinh nghiệm',
    'currently have pets': 'Hiện đang có thú cưng ở nhà',
  };
  return map[clean] || val;
};

// 6. Tình trạng việc làm (Employment Status)
export const translateEmploymentStatus = (val?: string | null): string => {
  if (!val) return 'Đang đi làm / Thu nhập ổn định';
  const clean = val.trim().toLowerCase();
  const map: Record<string, string> = {
    'employed': 'Đang đi làm',
    'employed / stable income': 'Đang đi làm / Thu nhập ổn định',
    'full-time': 'Toàn thời gian (Full-time)',
    'part-time': 'Bán thời gian (Part-time)',
    'self-employed': 'Kinh doanh tự do',
    'freelancer': 'Làm việc tự do (Freelancer)',
    'student': 'Học sinh / Sinh viên',
    'unemployed': 'Đang tìm việc',
    'retired': 'Đã nghỉ hưu',
  };
  return map[clean] || val;
};

// 7. Lịch sử chăm sóc thú cưng trước đây (Previous Pet History)
export const translatePetHistory = (val?: string | null): string => {
  if (!val) return 'Đã từng chăm sóc chu đáo trước đây.';
  const clean = val.trim().toLowerCase();
  const map: Record<string, string> = {
    'carefully cared for': 'Đã từng chăm sóc chu đáo trước đây.',
    'good care': 'Chăm sóc tốt, đầy đủ tiêm phòng.',
    'fully vaccinated': 'Được tiêm phòng và chăm sóc định kỳ đầy đủ.',
  };
  return map[clean] || val;
};

// 8. Lý do nhận nuôi (Adoption Reason)
export const translateAdoptionReason = (val?: string | null): string => {
  if (!val) return 'Mong muốn mang lại cho bé một mái ấm trọn đời';
  const clean = val.trim().toLowerCase();
  const map: Record<string, string> = {
    'because i want to give them a forever home': 'Mong muốn mang lại cho bé một mái ấm trọn đời',
    'love animals': 'Yêu thương động vật và muốn đồng hành cùng bé',
    'looking for a companion': 'Tìm kiếm một người bạn thú cưng đồng hành',
  };
  return map[clean] || val;
};

// 9. Giới tính thú cưng (Gender)
export const translateGender = (val?: string | null): string => {
  if (!val) return 'Chưa rõ';
  const clean = val.trim().toUpperCase();
  if (clean === 'MALE') return 'Đực';
  if (clean === 'FEMALE') return 'Cái';
  return val;
};