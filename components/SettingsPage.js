// ✅ /components/SettingsPage.js
import { signOut, useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="p-5 text-white min-h-screen bg-[#0b1220]">
      <h1 className="text-lg font-semibold mb-4">⚙️ การตั้งค่า</h1>

      <div className="bg-[#141b2d] rounded-2xl p-4 mb-4">
        <h2 className="text-gray-300 mb-1">👤 บัญชีของคุณ</h2>
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

      <div className="bg-[#141b2d] rounded-2xl p-4 mb-4">
        <h2 className="text-gray-300 mb-1">🔄 การทำงานของระบบ</h2>
        <p className="text-sm text-gray-400">Auto Refresh: เปิด</p>
        <p className="text-sm text-gray-400">AI Discovery Batch: Enabled</p>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl mt-6 font-semibold"
      >
        🚪 ออกจากระบบ
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        Visionary V∞.35 — Powered by OriginX AI
      </p>
    </div>
  );
}
