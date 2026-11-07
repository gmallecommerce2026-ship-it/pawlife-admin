/**
 * Các route ai cũng truy cập được, không cần login
 */
export const publicRoutes = ["/login", "/register", "/about"];
export const authRoutes = ["/login", "/register"];

export const shelterRoutesPrefix = "/shelter";
export const adminRoutesPrefix = "/admin";
export const apiAuthPrefix = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/shelter/pets";
export const DEFAULT_ADMIN_REDIRECT = "/admin/dashboard"; // đã thêm: login.ts đang import hằng số này
export const DEFAULT_STAFF_REDIRECT = "/staff/dashboard";
