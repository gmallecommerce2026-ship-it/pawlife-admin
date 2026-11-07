export interface RequiredDocument {
  key: string;
  label: string;
  description: string;
  category: 'SHELTER' | 'VETERINARY' | 'APPLICANT' | 'STAFF';
}

// Danh mục loại tài liệu dùng CHUNG cho:
// - RequestDocumentsModal (chọn tài liệu cần yêu cầu ban đầu khi kéo vào NEED_MORE_INFO)
// - NeedMoreInfoModal (chọn thêm tài liệu bổ sung ngay trong modal)
export const DOCUMENT_TYPE_OPTIONS: RequiredDocument[] = [
  {
    key: 'residence_proof',
    label: 'Xác nhận nơi cư trú',
    description: 'Hóa đơn điện nước hoặc hợp đồng thuê nhà xác nhận địa chỉ cư trú hiện tại.', 
    category: 'SHELTER'
  },
  {
    key: 'vet_reference',
    label: 'Giấy giới thiệu từ bác sĩ thú y',
    description: 'Thư giới thiệu hoặc xác nhận từ bác sĩ thú y đã từng khám cho thú cưng của bạn (nếu có).', 
    category: 'SHELTER'
  },
  {
    key: 'photo_id',
    label: 'Giấy tờ tùy thân',
    description: 'Ảnh chụp CMND/CCCD hoặc hộ chiếu còn hiệu lực để xác minh danh tính người đăng ký.', 
    category: 'SHELTER'
  },
  {
    key: 'landlord_approval',
    label: 'Chấp thuận từ chủ nhà',
    description:
      'Nếu bạn đang thuê nhà, chúng mình cần sự đồng ý từ chủ nhà để đảm bảo được phép nuôi thú cưng tại nơi ở của bạn.', 
    category: 'SHELTER'
    },
  {
    key: 'pet_history_records',
    label: 'Hồ sơ lịch sử thú cưng',
    description: 'Hồ sơ sức khỏe, tiêm chủng hoặc lịch sử chăm sóc của thú cưng bạn từng nuôi trước đây.', 
    category: 'SHELTER'
  },
  {
    key: 'income_verification',
    label: 'Xác minh thu nhập',
    description:
      'Cung cấp bằng chứng thu nhập ổn định (bảng lương, sao kê ngân hàng...) để đảm bảo khả năng chăm sóc thú cưng lâu dài.', 
    category: 'SHELTER'
    },
  {
    key: 'previous_pet_records',
    label: 'Hồ sơ thú cưng trước đây',
    description: 'Giấy tờ liên quan đến (các) thú cưng bạn từng nuôi, bao gồm giấy khai sinh/đăng ký (nếu có).', 
    category: 'VETERINARY'
  },
  {
    key: 'home_ownership_proof',
    label: 'Giấy chứng nhận quyền sở hữu nhà',
    description: 'Giấy chứng nhận quyền sử dụng đất/sở hữu nhà nếu bạn là chủ sở hữu nơi ở hiện tại.', 
    category: 'APPLICANT'
  },
  {
    key: 'other',
    label: 'Tài liệu khác',
    description: 'Mô tả loại tài liệu khác mà bạn cần người đăng ký bổ sung.', 
    category: 'STAFF'
  },
];