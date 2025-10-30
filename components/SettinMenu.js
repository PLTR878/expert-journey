// ✅ components/SettinMenu.js
import { logoutUser } from "../lib/Firebase";

export default function SettinMenu({ go }) {
  const handleLogout = async () => {
    await logoutUser();
    window.location.reload();
  };

  return (
    <div className="text-center mt-20">
      <h2 className="text-xl text-emerald-400 font-bold mb-5">การตั้งค่า</h2>
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2 rounded-lg shadow-lg"
      >
        ออกจากระบบ
      </button>
    </div>
  );
}
