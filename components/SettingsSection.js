// ✅ /components/SettingsSection.js
import { signOut, useSession } from "next-auth/react";

export default function SettingsSection() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="p-4 text-white min-h-screen bg-[#0b1220]">
      <h1 className="text-xl font-semibold mb-4 text-emerald-400">
        ⚙️ การตั้งค่า
      </h1>

      {/* กล่องข้อมูลผู้ใช้ */}
      <div className="bg-[#141b2d] rounded-2xl p-4 mb-4 border border-gray-800">
        <h2 className="text-gray-300 mb-2">👤 บัญชีของคุณ</h2>
        {session ? (
          <>
            <p className="text-sm text-gray-400">{session.user.email}</p>
            <p className="text-sm text-emerald-400 mt-1">
              แผนสมาชิก: Free (Visionary Beta)
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400">ยังไม่ได้เข้าสู่ระบบ</p>
        )}
      </div>

      {/* ปุ่มออกจากระบบ */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl mt-2 font-semibold"
      >
        🚪 ออกจากระบบ
      </button>

      <p className="text-xs text-gray-500 text-center mt-6">
        Visionary V∞.33 — Powered by OriginX AI
      </p>
    </div>
  );
      }
