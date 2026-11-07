import React from 'react';

interface OrderSummaryBoxProps {
  subtotal: number;
  shippingFee: number;
  shippingDiscount: number;
  voucherDiscount: number;
  coinDiscount: number;
  giftWrapFee?: number; // Optional cho trang Gift
  total: number;
  onPlaceOrder: () => void;
  buttonText?: string;
  loading?: boolean;
}

const formatCurrency = (val: number) => 
  val.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }).replace('₫', 'VND');

const SummaryRow = ({ label, value, isNegative = false, isBold = false, isMainTotal = false }: any) => (
  <div className={`flex justify-between items-center py-2 ${isMainTotal ? 'pt-4 border-t border-dashed border-gray-300 mt-2' : ''}`}>
    <span className={`text-sm ${isMainTotal ? 'text-lg font-bold text-black' : 'text-gray-600'}`}>
      {label}
    </span>
    <span className={`text-sm font-medium ${isNegative ? 'text-brand-orange' : 'text-black'} ${isMainTotal ? 'text-xl text-brand-orange font-bold' : ''}`}>
      {isNegative && value > 0 ? '-' : ''}{formatCurrency(value)}
    </span>
  </div>
);

const OrderSummaryBox: React.FC<OrderSummaryBoxProps> = ({
  subtotal,
  shippingFee,
  shippingDiscount,
  voucherDiscount,
  coinDiscount,
  giftWrapFee = 0,
  total,
  onPlaceOrder,
  buttonText = "Đặt hàng",
  loading = false
}) => {
  return (
    <div className="bg-white p-5 rounded-[15px] border border-[#f0f0f0] flex flex-col shadow-lg shadow-gray-100 sticky top-24">
      <h3 className="font-bold text-black mb-4">Chi tiết thanh toán</h3>
      
      {/* 1. Tổng tiền hàng */}
      <SummaryRow label="Tổng tiền hàng" value={subtotal} />
      
      {/* 2. Phí vận chuyển */}
      <SummaryRow label="Phí vận chuyển" value={shippingFee} />
      
      {/* 3. Phí gói quà (Nếu có) */}
      {giftWrapFee > 0 && (
        <SummaryRow label="Phí gói quà & thiệp" value={giftWrapFee} />
      )}

      {/* 4. Voucher giảm giá */}
      {voucherDiscount > 0 && (
        <SummaryRow label="Tổng cộng voucher giảm giá" value={voucherDiscount} isNegative />
      )}

      {/* 5. Giảm giá phí vận chuyển */}
      {shippingDiscount > 0 && (
        <SummaryRow label="Giảm giá phí vận chuyển" value={shippingDiscount} isNegative />
      )}

      {/* 6. Xu */}
      {coinDiscount > 0 && (
        <SummaryRow label="Giảm giá LoveGifts xu" value={coinDiscount} isNegative />
      )}

      {/* 7. Tổng thanh toán */}
      <SummaryRow label="Tổng thanh toán" value={total} isMainTotal />

      <button 
        onClick={onPlaceOrder}
        disabled={loading}
        className="w-full bg-[#e78720] text-white font-bold py-4 rounded-[15px] mt-6 hover:bg-[#d67615] transition-all transform active:scale-95 shadow-lg shadow-orange-200 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
           <span className="flex items-center justify-center gap-2">
             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
             Đang xử lý...
           </span>
        ) : buttonText}
      </button>
      
      <p className="text-[11px] text-center text-gray-400 mt-3">
          Nhấn "{buttonText}" đồng nghĩa với việc bạn đồng ý tuân theo <span className="underline cursor-pointer hover:text-brand-orange">Điều khoản LoveGifts</span>
      </p>
    </div>
  );
};

export default OrderSummaryBox;