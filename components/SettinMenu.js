// ✅ /components/SettinMenu.js — Logout Page
import { useEffect } from "react";

export default function SettinMenu() {

  useEffect(() => {
    // ✅ เคลียร์ข้อมูลทั้งหมด
    localStorage.clear();

    // ✅ ไปหน้าแรกทันที
    window.location.href = "/";
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center bg-[#0b1220] text-white">
      <h1 className="text-lg text-emerald-400 font-bold">กำลังออกจากระบบ...</h1>
    </section>
  );
}
