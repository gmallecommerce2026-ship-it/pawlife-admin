'use client';

import React from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'Home', href: '/', active: true },
  { label: 'Menu', href: '/menu', active: false },
  { label: 'Services', href: '/services', active: false },
  { label: 'About', href: '/about', active: false },
  { label: 'Contact', href: '/contact', active: false }, // Trong thực tế cái này nên active
  { label: 'login', href: '/login', active: false },
  { label: 'register', href: '/register', active: false },
];

export const ContactNavbar = () => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-40 w-full px-[390px] border-b border-gray-500 bg-[#151111] shadow-lg h-[80px] flex items-center justify-between">
      {/* Logo Section */}
      <div className="flex flex-col items-start gap-1 py-4">
        <Link href="/" className="font-sans font-bold text-[17px] text-[#EBCC90] leading-[30px] uppercase tracking-wider">
          N.S <span className="text-white">Coffee</span>
        </Link>
        <div className="text-[10.7px] font-thin text-[#F5DEB1] uppercase tracking-widest leading-none">
          Delicious Taste
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center justify-end">
        <ul className="flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`text-[13px] font-sans uppercase tracking-[2px] font-normal transition-colors duration-200
                  ${item.active ? 'text-[#C49B63]' : 'text-white hover:text-[#C49B63]'}
                `}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};