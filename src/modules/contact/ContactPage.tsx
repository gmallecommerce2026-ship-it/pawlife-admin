import React from 'react';
import { ContactNavbar } from './components/ContactNavbar';
import { ContactHero } from './components/ContactHero';
import { ContactFormSection } from './components/ContactFormSection';

export const ContactPage = () => {
  return (
    <main className="w-full bg-black min-h-screen flex flex-col items-center">
      {/* Container chính */}
      <div className="relative w-full max-w-[1920px]">
        {/* Phần Header & Hero (Tách header theo yêu cầu) */}
        <div className="relative w-full h-[750px]">
           {/* Navbar được tách ra, đặt đè lên Hero */}
           <ContactNavbar />
           <ContactHero />
        </div>

        {/* Phần nội dung Contact (Form & Info) */}
        <section className="relative z-20 w-full flex justify-center py-24 bg-black">
          <ContactFormSection />
        </section>
      </div>
    </main>
  );
};