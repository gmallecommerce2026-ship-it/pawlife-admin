// src/modules/auth/RegisterPage.tsx
import React from "react";
import Link from "next/link";
import { 
  Twitter, Facebook, Instagram, 
  Calendar, User, MessageCircle, 
  MapPin, Phone, Mail, Heart 
} from "lucide-react";

// --- Helper Components ---

const NavLink = ({ text, href, isActive, width }: { text: string; href: string; isActive: boolean; width: string }) => (
  <div className="flex flex-col justify-start items-start py-[14px] px-[20px] h-[52px]">
    <Link 
      href={href}
      className={`font-poppins text-[13px] whitespace-nowrap leading-[23.4px] uppercase tracking-[2px] font-normal transition-colors duration-300 ${
        isActive ? "text-[#c49b63]" : "text-white hover:text-[#c49b63]"
      }`}
      style={{ minWidth: width }}
    >
      {text}
    </Link>
  </div>
);

const DecorationSquare = ({ isFilled }: { isFilled: boolean }) => (
  <div className="border-[2px] border-white rounded-[9px] w-[18px] h-[18px] flex justify-center items-center overflow-hidden">
    <div className={`rounded-[6px] w-[12px] h-[12px] ${isFilled ? "bg-white" : "bg-white/50"}`} />
  </div>
);

const SocialIcon = ({ icon: Icon }: { icon: any }) => (
  <div className="bg-white/5 rounded-full w-[50px] h-[50px] flex justify-center items-center hover:bg-[#c49b63] transition-colors duration-300 group cursor-pointer">
    <Icon className="w-[20px] h-[20px] text-white group-hover:text-white" />
  </div>
);

const BlogItem = ({ icon: Icon, text, subText }: { icon: any; text: string; subText: string }) => (
  <div className="flex flex-row justify-start items-center h-[17px] gap-2">
    <Icon className="w-[12px] h-[12px] text-[#bfbfbf]" />
    <div className="font-poppins text-[12px] whitespace-nowrap text-[#808080] leading-[21.6px] font-light">
      {text} {subText}
    </div>
  </div>
);

const FooterServiceItem = ({ text }: { text: string }) => (
  <div className="flex flex-col justify-start items-start py-2 h-[45px]">
    <Link href="/services" className="font-poppins text-[16px] min-w-[136px] whitespace-nowrap text-white/70 hover:text-[#c49b63] transition-colors leading-[28.8px] font-light">
      {text}
    </Link>
  </div>
);

const ContactItem = ({ icon: Icon, text, subText }: { icon: any; text: string; subText?: string }) => (
  <div className="flex justify-center items-start pt-[15px]">
    <div className="flex flex-col justify-start items-start pt-[2px] w-[40px]">
      <Icon className="w-[18px] h-[18px] text-white" />
    </div>
    <div className="flex flex-col justify-start items-start">
      <div className="font-poppins text-[16px] leading-[24px] font-light text-white whitespace-pre-line">
        {text}
      </div>
      {subText && (
        <div className="font-poppins text-[16px] leading-[24px] font-light text-white/70">
          {subText}
        </div>
      )}
    </div>
  </div>
);

// --- Data & Constants ---

const NAV_ITEMS = [
  { text: "Home", href: "/", width: "44px", isActive: false },
  { text: "Menu", href: "/menu", width: "42px", isActive: false },
  { text: "Services", href: "/services", width: "73px", isActive: false },
  { text: "About", href: "/about", width: "51px", isActive: false },
  { text: "Contact", href: "/contact", width: "75px", isActive: false },
  { text: "Login", href: "/login", width: "47px", isActive: false },
  { text: "Register", href: "/register", width: "72px", isActive: true },
];

const RECENT_BLOGS = [
  { image: "/assets/ImageAsset2.png", date: "Sept 15, 2023", author: "Admin", comments: "19" },
  { image: "/assets/ImageAsset1.png", date: "Sept 15, 2023", author: "Admin", comments: "19" },
];

const SERVICES_LIST = ["Cooked", "Deliver", "Quality Foods", "Mixed"];

const RegisterPage = () => {
  return (
    <div className="flex flex-col w-full bg-white items-center">
      
      {/* --- HERO & HEADER SECTION --- */}
      <div className="relative w-full h-[750px] bg-black">
        {/* Background Images */}
        <div className="absolute inset-0 z-0">
           <img src="/assets/ImageAsset5.png" alt="Background" className="absolute w-full h-full object-cover opacity-60" />
           <img src="/assets/ImageAsset4.png" alt="Overlay" className="absolute w-full h-full object-cover z-10" />
           <div className="absolute inset-0 bg-black/50 z-10" />
           {/* Decorative Side Image */}
           <img src="/assets/ImageAsset3.png" alt="Decoration" className="absolute top-0 right-0 h-full w-auto object-cover z-10 hidden lg:block" />
        </div>

        {/* Header (Overlay) */}
        <div className="absolute top-0 z-40 w-full border-b border-gray-600 bg-[#151111] shadow-lg">
          <div className="container mx-auto px-4 lg:px-[15px] h-[79px] flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex flex-col items-start pt-4 pb-1">
              <span className="font-josefin text-[17px] font-bold text-[#ebcc90] leading-[30px] uppercase">
                N.S Coffee
              </span>
              <span className="font-inter text-[10px] font-thin text-[#f5deb1] uppercase tracking-widest">
                Delicious Taste
              </span>
            </Link>

            {/* Navigation */}
            <div className="hidden lg:flex flex-row items-center">
              {NAV_ITEMS.map((item, index) => (
                <NavLink key={index} {...item} />
              ))}
            </div>
          </div>
        </div>

        {/* Hero Title */}
        <div className="relative z-20 w-full h-full flex flex-col justify-center items-center pt-20">
          <span className="font-josefin text-[40px] text-white uppercase tracking-[1px] mb-4">
            Register
          </span>
          {/* Breadcrumbs */}
          <div className="flex gap-4 border-b-2 border-white pb-2">
            <Link href="/" className="font-poppins text-[13px] text-white uppercase tracking-[1px] font-light hover:text-[#c49b63] transition-colors">
              Home
            </Link>
            <span className="font-poppins text-[13px] text-[#bfbfbf] uppercase tracking-[1px] font-light">
              Register
            </span>
          </div>
        </div>

        {/* Decoration Dots (Positioned absolute as per original code) */}
        <div className="absolute top-[682px] w-full flex justify-center gap-[10px] z-30">
           <DecorationSquare isFilled={true} />
           <DecorationSquare isFilled={false} />
           <DecorationSquare isFilled={false} />
        </div>
      </div>

      {/* --- REGISTER FORM SECTION --- */}
      <div className="relative z-30 -mt-[100px] mb-20 w-full px-4 flex justify-center">
        <div className="w-full max-w-[1110px] bg-[#030202] p-12 flex flex-col items-center gap-6 shadow-2xl">
          
          <div className="w-full pb-1">
            <h2 className="font-josefin text-[24px] text-white uppercase leading-[33.6px] font-normal">
              Register
            </h2>
          </div>

          <div className="w-full flex flex-col gap-4">
            {/* Username */}
            <div className="w-full">
               <label className="font-poppins text-[15px] font-light text-white leading-[27px] block mb-2">
                 Username
               </label>
               <div className="w-full h-[58px] border border-white px-4 flex items-center">
                  <input 
                    type="text" 
                    placeholder="Username" 
                    className="w-full bg-transparent border-none outline-none text-white font-poppins font-light text-[14px] placeholder-white/40"
                  />
               </div>
            </div>

            {/* Email */}
            {/* <div className="w-full">
               <label className="font-poppins text-[15px] font-light text-white leading-[27px] block mb-2">
                 Email
               </label>
               <div className="w-full h-[58px] border border-white px-4 flex items-center">
                  <input 
                    type="email" 
                    placeholder="Email" 
                    className="w-full bg-transparent border-none outline-none text-white font-poppins font-light text-[14px] placeholder-white/40"
                  />
               </div>
            </div> */}

            {/* Password */}
            <div className="w-full">
               <label className="font-poppins text-[15px] font-light text-white leading-[27px] block mb-2">
                 Password
               </label>
               <div className="w-full h-[58px] border border-white px-4 flex items-center">
                  <input 
                    type="password" 
                    placeholder="Password" 
                    className="w-full bg-transparent border-none outline-none text-white font-poppins font-light text-[14px] placeholder-white/40"
                  />
               </div>
            </div>

            {/* Links */}
            <div className="w-full mt-2">
              <Link href="/login" className="font-poppins text-[15px] font-light text-[#c49b63] leading-[27px] hover:text-[#b08b55] transition-colors">
                 Already have an Account
              </Link>
            </div>

            {/* Submit Button */}
            <div className="w-full mt-6">
               <button className="w-full h-[54px] bg-[#c49b63] border border-[#c49b63] flex items-center justify-center hover:bg-transparent hover:text-[#c49b63] transition-all duration-300 group">
                <span className="font-poppins text-[13px] font-normal text-black leading-[19.5px] group-hover:text-[#c49b63] uppercase">
                  Register
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;