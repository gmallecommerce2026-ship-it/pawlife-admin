// src/components/layout/Footer.tsx
import React from "react";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Heart, 
  Twitter, 
  Facebook, 
  Instagram 
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#120f0f] pt-16 pb-8 border-t border-white/5">
      <div className="container mx-auto max-w-[1140px] px-6">
        
        {/* Main Content Grid: Chuyển về 2 cột lớn để tối giản */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 mb-16">
          
          {/* Column 1: Brand Story & Socials */}
          <div className="flex flex-col gap-6">
            <h3 className="text-white uppercase font-josefin text-xl tracking-[0.2em]">
              Về chúng tôi
            </h3>
            <p className="text-white/60 font-poppins font-light leading-relaxed text-sm max-w-md">
              "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts."
            </p>
            
            {/* Social Icons - Minimal Style */}
            <div className="flex gap-4 mt-2">
               <SocialIcon icon={<Twitter size={18} />} />
               <SocialIcon icon={<Facebook size={18} />} />
               <SocialIcon icon={<Instagram size={18} />} />
            </div>
          </div>

          {/* Column 2: Contact Info */}
          <div className="flex flex-col gap-6 md:items-start">
            <h3 className="text-white uppercase font-josefin text-xl tracking-[0.2em]">
              Liên hệ
            </h3>
            <ul className="flex flex-col gap-5">
              <ContactItem 
                icon={<MapPin className="w-5 h-5" />} 
                text="198 Phố ABC, Hà Nội" 
              />
              <ContactItem 
                icon={<Phone className="w-5 h-5" />} 
                text="(+84) 91.222.2222" 
              />
              <ContactItem 
                icon={<Mail className="w-5 h-5" />} 
                text="huy1232123@gmail.com" 
              />
            </ul>
          </div>
        </div>

        {/* Copyright Section - Tinh gọn */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40 font-poppins font-light">
          <p>
            &copy;{new Date().getFullYear()} All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-coffee-primary" /> by Huy
          </p>
        </div>
      </div>
    </footer>
  );
};

// Sub-components để code gọn và dễ tái sử dụng (Clean Code)

const SocialIcon = ({ icon }: { icon: React.ReactNode }) => (
  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:border-coffee-primary hover:text-coffee-primary hover:scale-105 transition-all duration-300 cursor-pointer">
    {icon}
  </div>
);

const ContactItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <li className="flex gap-4 items-start group cursor-default">
    <span className="text-coffee-primary mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
      {icon}
    </span>
    <span className="text-white/60 font-poppins font-light text-sm leading-relaxed group-hover:text-white/90 transition-colors">
      {text}
    </span>
  </li>
);

export default Footer;