// import { cookies } from "next/headers";

// export function getAccessToken(): string | null{
//     if (typeof window === 'undefined') return null;
//     return localStorage.getItem('token');
// }

// export function isLoggedIn(): boolean{
//     return !!getAccessToken();
// }

// export function logout(){
//     if (typeof window !== 'undefined') {
//         // Remove from localStorage
//         localStorage.removeItem('token');
//         // Remove cookie (overwrite with expired one)
//         document.cookie = 'token=; path=/; max-age=0;';
//         // Optional redirect to /signin
//         window.location.href = '/signin';
//       }
// }


