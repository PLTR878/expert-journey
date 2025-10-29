export default function VipReister({ go }) {
  const handleConfirm = () => {
    localStorage.setItem("paid", "true");
    go("market"); // ไปหน้า OriginX หลังสมัคร VIP
  };

  const handleTrial = () => {
    localStorage.setItem("paid", "true");
    go("market");
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-[#0b1220] text-white">
      <div className="bg-[#111827] p-6 rounded-2xl w-full max-w-xs shadow-xl text-center">
        <h1 className="text-emerald-400 text-[20px] font-extrabold mb-2">
          💎 สมัครแบบพรีเมียม
        </h1>
        <p className="text-gray-300 text-[13px] mb-5">
          ปลดล็อก OriginX เต็มระบบ: AI Discovery, Quant Scanner, News Pro  
          และฟีเจอร์ใหม่ก่อนใคร
        </p>

        <button
          onClick={handleConfirm}
          className="bg-emerald-500 hover:bg-emerald-600 py-2 w-full rounded-lg font-bold text-[15px] mb-3"
        >
          ยืนยันสมัคร (฿299/เดือน)
        </button>

        <button
          onClick={handleTrial}
          className="bg-gray-700 hover:bg-gray-600 py-2 w-full rounded-lg font-bold text-[15px]"
        >
          เข้าฟรีโหมดทดลอง
        </button>

        <p className="text-gray-500 text-xs mt-4">
          คุณสามารถย้ายแผน/ยกเลิกได้ทุกเวลาในหน้า Settings
        </p>
      </div>
    </main>
  );
}
