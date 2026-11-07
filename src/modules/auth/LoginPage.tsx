// src/modules/auth/LoginPage.tsx
import React from "react";
import Link from "next/link";

const LoginPage = () => {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-start bg-black md:min-h-0 md:bg-white">
      {/* Hero: thấp hơn trên mobile để form luôn nằm trong tầm ngón cái */}
      <div className="relative flex h-[34vh] min-h-[240px] w-full items-center justify-center overflow-hidden bg-black md:h-[750px] md:min-h-[400px]">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 z-10 h-full w-full bg-black/50 opacity-50" />
          <img
            src="/assets/ImageAsset6.png"
            alt=""
            className="absolute top-0 left-0 h-full w-full object-cover opacity-60"
          />
          <img
            src="/assets/ImageAsset3.png"
            alt=""
            className="absolute top-0 right-0 z-20 hidden h-full w-auto object-cover lg:block"
          />
          <img
            src="/assets/ImageAsset4.png"
            alt=""
            className="absolute top-0 left-0 z-10 hidden h-full w-auto object-cover lg:block"
          />
        </div>
      </div>

      {/* Form: mobile = sheet full-width bo góc trên; ≥ md = card nổi như cũ */}
      <div className="relative z-30 -mt-8 flex w-full flex-1 justify-center md:-mt-[100px] md:mb-20 md:flex-none md:px-4">
        <div className="flex w-full max-w-none flex-col items-center gap-6 rounded-t-[28px] border-t border-white/10 bg-black px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-8 shadow-2xl md:max-w-[1110px] md:rounded-none md:border-t-2 md:border-coffee-primary/20 md:p-12">
          {/* Title */}
          <div className="flex w-full justify-start pb-1">
            <h2 className="font-josefin text-[28px] font-normal uppercase leading-tight text-white md:text-[24px]">
              Login
            </h2>
          </div>

          {/* Form Content */}
          <div className="flex w-full flex-col items-start gap-5">
            {/* Email */}
            <div className="w-full">
              <label
                htmlFor="login-email"
                className="mb-2 block font-poppins text-[14px] font-light leading-[27px] text-white md:text-[15px]"
              >
                Email
              </label>
              <div className="flex h-[52px] w-full items-center rounded-none border border-white/30 px-4 transition-colors focus-within:border-coffee-primary md:h-[58px]">
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="Email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full border-none bg-transparent font-poppins text-[16px] font-light text-white outline-none placeholder-white/40 md:text-[14px]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="w-full">
              <label
                htmlFor="login-password"
                className="mb-2 block font-poppins text-[14px] font-light leading-[27px] text-white md:text-[15px]"
              >
                Password
              </label>
              <div className="flex h-[52px] w-full items-center rounded-none border border-white/30 px-4 transition-colors focus-within:border-coffee-primary md:h-[58px]">
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full border-none bg-transparent font-poppins text-[16px] font-light text-white outline-none placeholder-white/40 md:text-[14px]"
                />
              </div>
            </div>

            {/* Links — vùng chạm cao 44px trên mobile */}
            <div className="flex w-full flex-col gap-0 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="#"
                className="flex min-h-[44px] items-center whitespace-nowrap font-poppins text-[14px] font-light text-coffee-primary transition-colors hover:text-[#b08b55]"
              >
                Forgot Password
              </Link>
              <span className="hidden text-white/20 sm:inline">|</span>
              <Link
                href="/register"
                className="flex min-h-[44px] items-center whitespace-nowrap font-poppins text-[14px] font-light text-coffee-primary transition-colors hover:text-[#b08b55]"
              >
                Don&apos;t have an Account
              </Link>
            </div>

            {/* Login Button */}
            <div className="mt-2 w-full">
              <button className="group flex h-[54px] w-full items-center justify-center border border-coffee-primary bg-coffee-primary transition-all duration-300 active:scale-[0.99] md:hover:bg-transparent">
                <span className="font-poppins text-[14px] font-medium uppercase tracking-wider text-black group-hover:text-coffee-primary">
                  Login
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;