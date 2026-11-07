"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, MapPin, Clock, Menu, X, ShoppingBag } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import UserAccountDropdown from "./Header/UserAccountDropdown";

// [MỚI 1] Import Store và Popup

const NAV_ITEMS = [
  { name: "Trang chủ", path: "/" },
  { name: "Thực đơn", path: "/menu" },
  { name: "Dịch vụ", path: "/services" },
  { name: "Giới thiệu", path: "/about" },
  { name: "Liên hệ", path: "/contact" },
];

const Header = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // [MỚI 2] Lấy dữ liệu giỏ hàng từ Store

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-black shadow-lg pb-0" : "bg-transparent pb-4"
      }`}
    >
      <div
        className={`w-full border-b border-white/10 hidden lg:flex justify-center transition-all duration-300 ${
          isScrolled ? "h-0 py-0 overflow-hidden opacity-0" : "h-auto py-3 opacity-100 bg-[#000000]"
        }`}
      >
        <div className="container mx-auto max-w-[1140px] flex justify-between items-center px-4">
          <div className="flex gap-8">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-coffee-primary" />
              <div>
                <p className="text-coffee-primary uppercase text-[10px] font-bold tracking-wider font-sans">Hotline</p>
                <p className="text-white text-xs font-light">(+84) 91.222.2222</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-coffee-primary" />
              <div>
                <p className="text-coffee-primary uppercase text-[10px] font-bold tracking-wider font-sans">Địa chỉ</p>
                <p className="text-white text-xs font-light">198 Phố ABC, Hà Nội</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-coffee-primary" />
              <div>
                <p className="text-coffee-primary uppercase text-[10px] font-bold tracking-wider font-sans">Thời gian mở cửa</p>
                <p className="text-white text-xs font-light">Thứ 2 - Thứ 6, 8:00 - 21:00</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white/60 text-xs">
             <span>Chào mừng tới H Coffee</span>
          </div>
        </div>
      </div>

      <nav
        className={`w-full transition-colors duration-300 ${
          isScrolled ? "bg-black/90 backdrop-blur-md" : "bg-black/50 backdrop-blur-sm border-b border-white/5"
        }`}
      >
        <div className="container mx-auto max-w-[1140px] flex justify-between items-center px-4 py-4 md:py-6">
          
          <Link
            href="/"
            className="text-2xl font-bold uppercase flex flex-col items-center leading-none group"
          >
            <span className="text-white text-2xl md:text-3xl font-bold">N.S</span>
            <span className="text-coffee-primary text-[10px] md:text-sm tracking-[0.2em] group-hover:tracking-[0.3em] transition-all duration-300">
              Coffee
            </span>
          </Link>

          {/* DESKTOP MENU */}
          <ul className="hidden md:flex items-center gap-6 lg:gap-10">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.name}>
                  <Link
                    href={item.path}
                    className={`text-sm uppercase tracking-widest font-medium transition-all duration-300 relative py-2 
                      ${isActive ? "text-coffee-primary" : "text-white hover:text-coffee-primary"}
                      after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-coffee-primary after:transition-all after:duration-300 hover:after:w-full
                      ${isActive ? "after:w-full" : ""}
                    `}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ACTIONS */}
          <div className="flex items-center gap-4 md:gap-6">
            
            {/* [MỚI 3] Thay thế nút ShoppingBag tĩnh bằng Logic Hover + Popup */}
            <div 
              className="relative group z-50 h-full flex items-center"
            >
              {/* Link trực tiếp đến trang Cart (tốt cho Mobile) */}
              <Link href="/cart" className="text-white hover:text-coffee-primary transition-colors relative block py-2">
                <ShoppingBag className={`w-5 h-5 ${pathname === '/cart' ? 'text-coffee-primary' : ''}`} />
                
              
              </Link>

              {/* Popup Mini Cart (Chỉ hiện trên Desktop nhờ hidden md:block nếu cần, hoặc để CSS xử lý) */}
              <div className={`
                  absolute top-full right-0 mt-4 w-[380px] sm:w-[420px] 
                  transform transition-all duration-300 origin-top-right
                  hidden md:block 
              `}> 
                 {/* ^ Note: Thêm 'hidden md:block' để ẩn popup trên mobile, tránh bị vỡ layout */}
                 
                 {/* Vùng đệm trong suốt để giữ hover */}
                 <div className="absolute -top-6 right-0 w-full h-8 bg-transparent"></div>

                 <div className="bg-white rounded-lg shadow-2xl relative">
                    {/* Mũi tên tam giác */}
                    <div className="absolute -top-2 right-1 w-4 h-4 bg-white transform rotate-45 border-t border-l border-gray-100"></div>
                 </div>
              </div>
            </div>
            {/* [HẾT PHẦN MỚI] */}

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <UserAccountDropdown user={user} logout={handleLogout} />
              ) : (
                <>
                  <Link href="/login" className="text-white text-xs uppercase tracking-widest font-medium hover:text-coffee-primary transition-colors">
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="bg-coffee-primary text-white px-5 py-2 text-xs uppercase tracking-widest font-medium rounded-sm hover:bg-[#b08b55] hover:scale-105 transition-all"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>

            <button
              className="md:hidden text-white hover:text-coffee-primary transition-colors p-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        <div
          className={`md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-t border-white/10 transition-all duration-300 ease-in-out overflow-hidden shadow-2xl ${
            isMobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col h-[calc(100vh-80px)] overflow-y-auto pb-10">
            <ul className="flex flex-col items-center py-6 gap-6">
              {NAV_ITEMS.map((item) => (
                <li key={item.name} className="w-full text-center">
                  <Link
                    href={item.path}
                    className={`block w-full py-2 text-sm uppercase tracking-[0.15em] ${
                      pathname === item.path ? "text-coffee-primary" : "text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li className="w-full border-t border-white/10 my-2"></li>
              
              <li className="flex flex-col gap-4 w-full px-10">
                  {user ? (
                    <div className="w-full text-center text-white">
                      <p className="text-sm mb-2 text-coffee-primary">Xin chào, {user.name || "Customer"}</p>
                      <Link href="/profile" className="block w-full text-center text-white py-3 border border-white/20 uppercase text-xs tracking-widest mb-2">
                        Tài khoản
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-center text-red-400 py-3 border border-red-500/20 uppercase text-xs tracking-widest hover:bg-red-500/10"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link href="/login" className="w-full text-center text-white py-3 border border-white/20 uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-colors">
                          Đăng nhập
                      </Link>
                      <Link href="/register" className="w-full text-center bg-coffee-primary text-white py-3 uppercase text-xs tracking-widest hover:bg-[#b08b55] transition-colors">
                          Đăng ký
                      </Link>
                    </>
                  )}
              </li>
              
              <li className="w-full px-10 pt-4 flex flex-col gap-4 items-center border-t border-white/10 mt-2">
                <div className="flex items-center gap-3 text-white/70">
                   <Phone className="w-4 h-4 text-coffee-primary" />
                   <span className="text-xs">000 (123) 456 7890</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                   <Clock className="w-4 h-4 text-coffee-primary" />
                   <span className="text-xs">Thứ 2 - Thứ 6: 8:00 - 21:00</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;