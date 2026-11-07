// src/types/navigation.ts

export interface SidebarNavItem {
  id: string;
  label: string;
  icon?: string;
  hasArrow?: boolean;
  isActive?: boolean;
}

export interface BrandLogo {
  id: string;
  imageUrl: string;
  alt: string;
}

export interface FeaturedProduct {
  id: string;
  title: string;
  imageUrl: string;
  href: string;
  price?: string; // Thêm giá tiền cho sinh động
}

export interface MenuLink {
  label: string;
  href: string;
}

// Group link (Ví dụ: "Mẹ bầu", "Trẻ em"...)
export interface MenuLinkGroup {
  id: string;
  title: string;
  href: string;
  links: MenuLink[];
}

// Nội dung chi tiết cho từng Tab
export interface MegaMenuTabContent {
  brandLogosTop: BrandLogo[];       // Logo thương hiệu ở trên cùng của tab đó
  featuredProducts: FeaturedProduct[]; // Sản phẩm nổi bật của tab đó
  linkGroups: MenuLinkGroup[];      // Các nhóm link (cột)
}

export interface RightSidebarItem {
  id: string;
  label: string;
  imageUrl?: string;
}

export interface MegaMenuData {
  sidebarNav: SidebarNavItem[];       // Menu bên trái
  brandLogosLeft: BrandLogo[];        // Logo ở cột trái (cố định)
  categoriesLeft: SidebarNavItem[];   // Danh mục ở cột trái (cố định)
  rightSidebarItems: RightSidebarItem[]; // Menu bên phải (cố định hoặc động tùy ý, ở đây giữ cố định cho đơn giản)
  
  // Dữ liệu nội dung, key là ID của sidebarNav (ví dụ: "1", "2", "3")
  contents: Record<string, MegaMenuTabContent>; 
}