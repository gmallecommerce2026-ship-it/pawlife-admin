// src/modules/product-detail/components/ProductVouchers.tsx
import React from "react";

interface Voucher {
  id: string;
  icon: string;
  text: string;
}

interface ProductVouchersProps {
  vouchers: Voucher[];
}

const ProductVouchers: React.FC<ProductVouchersProps> = ({ vouchers }) => (
  <div className="border border-brand-orange rounded-2xl p-4 bg-orange-50/50">
    <h3 className="font-semibold text-base text-black mb-3">
      Quà tặng và ưu đãi khác
    </h3>
    <div className="flex flex-col gap-3">
      {vouchers.map((voucher) => (
        <div key={voucher.id} className="flex items-center gap-3">
          <img
            src={voucher.icon}
            alt="Voucher icon"
            className="w-6 h-6 flex-shrink-0"
          />
          <span className="text-sm text-black font-light">
            {voucher.text}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default ProductVouchers;