// ✅ /components/SettinMenu.js — หน้า ออกจากระบบ แบบเดิม
export default function SettinMenu() {

  const logout = () => {
    localStorage.removeItem("logged"); // เคลียร์สถานะล็อกอิน
    window.location.reload(); // รีโหลดกลับหน้าแรก
  };

  return (
    <section className="min-h-screen bg-[#0b1220] text-white p-6 flex flex-col justify-center items-center text-center">
      <h1 className="text-2xl font-bold text-red-400 mb-6">
        🚪 ออกจากระบบ
      </h1>

      <button
        onClick={logout}
        className="w-full max-w-xs py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition text-white"
      >
        🔓 ออกจากระบบ
      </button>

      <p className="text-gray-400 text-sm mt-4">
        คุณกำลังใช้งานในโหมดผู้ใช้ปัจจุบัน
      </p>
    </section>
  );
}
