// src/app/page.tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  // Mặc định chuyển thẳng đến login hoặc dashboard của shelter
  redirect("/login"); 
}