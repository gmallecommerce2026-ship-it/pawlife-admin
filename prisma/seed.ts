import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu khởi tạo dữ liệu mẫu (Seeding)...');

  // --- 1. CLEANUP DATABASE (Xóa dữ liệu cũ theo thứ tự để tránh lỗi FK) ---
  await prisma.orderItemOption.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.optionValue.deleteMany();
  await prisma.optionGroup.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Đã dọn dẹp database cũ.');

  // --- 2. TẠO USERS ---
  const passwordHash = await bcrypt.hash('123456', 10); // Mật khẩu chung: 123456

  const admin = await prisma.user.create({
    data: {
      userName: 'admin@coffee.com',
      passwordHash,
      fullName: 'Quản Trị Viên',
      role: Role.ADMIN,
      phoneNumber: '0909000111',
    },
  });

  const staff = await prisma.user.create({
    data: {
      userName: 'staff@coffee.com',
      passwordHash,
      fullName: 'Nhân Viên Pha Chế',
      role: Role.STAFF,
      phoneNumber: '0909000222',
    },
  });

  const customer = await prisma.user.create({
    data: {
      userName: 'khachhang@gmail.com',
      passwordHash,
      fullName: 'Nguyễn Văn Khách',
      role: Role.CUSTOMER,
      phoneNumber: '0912345678',
      shippingAddress: '123 Đường Láng, Hà Nội',
    },
  });

  console.log('👤 Đã tạo Users (Admin, Staff, Customer).');

  // --- 3. TẠO CATEGORIES (Danh mục) ---
  const catCoffeeVN = await prisma.category.create({
    data: { name: 'Cà Phê Việt Nam', displayOrder: 1, imageUrl: 'https://placehold.co/100x100?text=CoffeeVN' },
  });
  const catCoffeeMachine = await prisma.category.create({
    data: { name: 'Cà Phê Máy', displayOrder: 2, imageUrl: 'https://placehold.co/100x100?text=Machine' },
  });
  const catTea = await prisma.category.create({
    data: { name: 'Trà Trái Cây', displayOrder: 3, imageUrl: 'https://placehold.co/100x100?text=Tea' },
  });
  const catFreeze = await prisma.category.create({
    data: { name: 'Đá Xay (Freeze)', displayOrder: 4, imageUrl: 'https://placehold.co/100x100?text=Freeze' },
  });
  const catBakery = await prisma.category.create({
    data: { name: 'Bánh Ngọt', displayOrder: 5, imageUrl: 'https://placehold.co/100x100?text=Bakery' },
  });

  console.log('📂 Đã tạo Categories.');

  // --- 4. TẠO OPTION GROUPS & VALUES (Nhóm tùy chọn) ---

  // Group: Kích thước (Size)
  const groupSize = await prisma.optionGroup.create({
    data: {
      name: 'Kích cỡ',
      isRequired: true,
      isMultiple: false,
      optionValues: {
        create: [
          { name: 'Nhỏ (S)', priceAdjustment: 0 },
          { name: 'Vừa (M)', priceAdjustment: 6000 },
          { name: 'Lớn (L)', priceAdjustment: 10000 },
        ],
      },
    },
  });

  // Group: Lượng đường
  const groupSugar = await prisma.optionGroup.create({
    data: {
      name: 'Lượng đường',
      isRequired: true, // Bắt buộc chọn (Mặc định là Bình thường)
      isMultiple: false,
      optionValues: {
        create: [
          { name: 'Bình thường (100%)', priceAdjustment: 0 },
          { name: 'Ít đường (70%)', priceAdjustment: 0 },
          { name: 'Một nửa (50%)', priceAdjustment: 0 },
          { name: 'Rất ít (30%)', priceAdjustment: 0 },
          { name: 'Không đường', priceAdjustment: 0 },
        ],
      },
    },
  });

  // Group: Lượng đá
  const groupIce = await prisma.optionGroup.create({
    data: {
      name: 'Lượng đá',
      isRequired: true,
      isMultiple: false,
      optionValues: {
        create: [
          { name: 'Bình thường (100%)', priceAdjustment: 0 },
          { name: 'Ít đá (50%)', priceAdjustment: 0 },
          { name: 'Không đá', priceAdjustment: 0 },
          { name: 'Uống nóng', priceAdjustment: 0 },
        ],
      },
    },
  });

  // Group: Topping (Chọn nhiều)
  const groupTopping = await prisma.optionGroup.create({
    data: {
      name: 'Topping thêm',
      isRequired: false, // Không bắt buộc
      isMultiple: true,  // Được chọn nhiều
      optionValues: {
        create: [
          { name: 'Trân châu đen', priceAdjustment: 5000 },
          { name: 'Trân châu trắng', priceAdjustment: 5000 },
          { name: 'Thạch sương sáo', priceAdjustment: 5000 },
          { name: 'Kem Cheese', priceAdjustment: 10000 },
          { name: 'Shot Espresso', priceAdjustment: 10000 },
        ],
      },
    },
  });

  console.log('⚙️ Đã tạo Options (Size, Đường, Đá, Topping).');

  // --- 5. TẠO PRODUCTS (Sản phẩm) VÀ LIÊN KẾT OPTIONS ---

  // Helper để tạo ProductOption nhanh
  const linkOption = (productId: number, optionGroupId: number) => ({
    productId,
    optionGroupId,
  });

  // --- Món 1: Cà phê Đen Đá (Chỉ có Size, Đường, Đá) ---
  const cfDen = await prisma.product.create({
    data: {
      name: 'Cà phê Đen Đá',
      basePrice: 29000,
      description: 'Cà phê rang xay nguyên chất đậm đà.',
      imageUrl: 'https://placehold.co/400x400?text=CfDen',
      categoryId: catCoffeeVN.id,
      isAvailable: true,
    },
  });
  // Liên kết options
  await prisma.productOption.createMany({
    data: [
      linkOption(cfDen.id, groupSize.id),
      linkOption(cfDen.id, groupSugar.id),
      linkOption(cfDen.id, groupIce.id),
    ],
  });

  // --- Món 2: Cà phê Sữa Đá (Có thêm Topping) ---
  const cfSua = await prisma.product.create({
    data: {
      name: 'Cà phê Sữa Đá',
      basePrice: 35000,
      description: 'Sự hòa quyện giữa cà phê đậm đà và sữa đặc ngọt ngào.',
      imageUrl: 'https://placehold.co/400x400?text=CfSua',
      categoryId: catCoffeeVN.id,
    },
  });
  await prisma.productOption.createMany({
    data: [
      linkOption(cfSua.id, groupSize.id),
      linkOption(cfSua.id, groupSugar.id),
      linkOption(cfSua.id, groupIce.id),
      linkOption(cfSua.id, groupTopping.id), // Cho phép thêm topping
    ],
  });

  // --- Món 3: Bạc Xỉu ---
  const bacXiu = await prisma.product.create({
    data: {
      name: 'Bạc Xỉu',
      basePrice: 39000,
      description: 'Nhiều sữa ít cà phê, hương vị nhẹ nhàng.',
      imageUrl: 'https://placehold.co/400x400?text=BacXiu',
      categoryId: catCoffeeVN.id,
    },
  });
  await prisma.productOption.createMany({
    data: [
      linkOption(bacXiu.id, groupSize.id),
      linkOption(bacXiu.id, groupSugar.id),
      linkOption(bacXiu.id, groupIce.id),
      linkOption(bacXiu.id, groupTopping.id),
    ],
  });

  // --- Món 4: Latte (Cafe máy) ---
  const latte = await prisma.product.create({
    data: {
      name: 'Latte nóng',
      basePrice: 45000,
      description: 'Espresso với sữa nóng và lớp bọt sữa mỏng.',
      imageUrl: 'https://placehold.co/400x400?text=Latte',
      categoryId: catCoffeeMachine.id,
    },
  });
  await prisma.productOption.createMany({
    data: [
      linkOption(latte.id, groupSize.id),
      linkOption(latte.id, groupSugar.id),
      // Latte nóng thường ko chọn đá, nên ko link groupIce, hoặc tạo group riêng cho đồ nóng
    ],
  });

  // --- Món 5: Trà Đào Cam Sả ---
  const traDao = await prisma.product.create({
    data: {
      name: 'Trà Đào Cam Sả',
      basePrice: 45000,
      description: 'Thanh mát, giải nhiệt với miếng đào giòn.',
      imageUrl: 'https://placehold.co/400x400?text=TraDao',
      categoryId: catTea.id,
    },
  });
  await prisma.productOption.createMany({
    data: [
      linkOption(traDao.id, groupSize.id),
      linkOption(traDao.id, groupSugar.id),
      linkOption(traDao.id, groupIce.id),
      linkOption(traDao.id, groupTopping.id),
    ],
  });

  // --- Món 6: Bánh Croissant (Không có Option Size/Đường/Đá) ---
  await prisma.product.create({
    data: {
      name: 'Bánh Croissant Bơ',
      basePrice: 35000,
      description: 'Bánh sừng bò ngàn lớp thơm lừng mùi bơ.',
      imageUrl: 'https://placehold.co/400x400?text=Croissant',
      categoryId: catBakery.id,
      // Không link option nào cả
    },
  });

  console.log('☕ Đã tạo Products và liên kết Options.');
  console.log('✅ Seeding hoàn tất!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });