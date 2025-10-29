// ✅ /components/SettingsPage.js
import { signOut, useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-[18px] font-semibold text-emerald-400 text-center mt-2 mb-3">
        ⚙️ การตั้งค่า (Settings)
      </h1>

      <div className="bg-[#141b2d] border border-gray-800 rounded-2xl p-4 shadow-md shadow-black/30">
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

      <div className="bg-[#141b2d] border border-gray-800 rounded-2xl p-4 shadow-md shadow-black/30">
        <h2 className="text-gray-300 mb-2">🔄 การทำงานของระบบ</h2>
        <p className="text-sm text-gray-400">• Auto Refresh: เปิด</p>
        <p className="text-sm text-gray-400">• AI Discovery Batch: Enabled</p>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-semibold shadow-md shadow-red-900/30"
      >
        🚪 ออกจากระบบ
      </button>

      <p className="text-xs text-gray-500 text-center mt-6">
        Visionary V∞.35 — Powered by OriginX AI
      </p>
    </div>
  );
          }
