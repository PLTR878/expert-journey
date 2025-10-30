// components/VipReister.js
import { setPaidStatus } from "../utils/authStore";

export default function VipReister({ go, onPaid }) {
  const confirmPaid = () => {
    setPaidStatus(true);
    onPaid?.();           // แจ้ง parent
    alert("ยืนยันสมัคร VIP สำเร็จ ✅");
    go("market");
  };

  const freeTrial = () => {
    setPaidStatus(true);  // เดโม: ให้ผ่านเหมือนชำระแล้ว
    onPaid?.();
    alert("เข้าฟรีโหมดทดลอง ✅");
    go("market");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#0f172a] p-6 rounded-2xl border border-white/10 text-center">
        <h1 className="text-emerald-400 font-extrabold text-xl mb-3">💎 สมัครแบบพรีเมียม</h1>
        <p className="text-gray-300 text-sm mb-4">
          ปลดล็อก OriginX เต็มระบบ: AI Discovery, Quant Scanner, News Pro
        </p>
        <button onClick={confirmPaid}
          className="w-full mb-3 bg-emerald-500 text-black font-extrabold py-2 rounded-xl">
          ยืนยันสมัคร (฿299/เดือน)
        </button>
        <button onClick={freeTrial}
          className="w-full bg-gray-700 text-white font-extrabold py-2 rounded-xl">
          เข้าฟรีโหมดทดลอง
        </button>
      </div>
    </div>
  );
}
