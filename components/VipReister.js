export default function VipReister({ go }) {
  const setPaid = (val) => {
    localStorage.setItem("paid", val ? "true" : "false");
  };

  return (
    <main className="min-h-screen flex justify-center items-center bg-[#0b1220] text-white px-6">
      <div className="w-full max-w-md bg-[#141b2d] rounded-2xl p-6 shadow-lg border border-gray-800 text-center">
        <h1 className="text-2xl font-extrabold text-emerald-400 mb-3">💎 สมัครแบบพรีเมียม</h1>
        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
          ปลดล็อก OriginX เต็มระบบ: AI Discovery, Quant Scanner, News Pro และฟีเจอร์ใหม่ก่อนใคร
        </p>

        <button
          className="w-full bg-emerald-500 hover:bg-emerald-600 py-3 rounded-xl font-extrabold text-black mb-3"
          onClick={() => {
            alert("💳 (เดโม่) ยืนยันการชำระสำเร็จ");
            setPaid(true);
            go("market");
          }}
        >
          ยืนยันสมัคร (฿299/เดือน)
        </button>

        <button
          className="w-full bg-[#1e293b] hover:bg-[#273447] py-3 rounded-xl font-extrabold text-white"
          onClick={() => {
            alert("เข้าสู่โหมดทดลองใช้งาน");
            setPaid(false);
            go("market");
          }}
        >
          เข้าฟรีโหมดทดลอง
        </button>

        <p className="text-gray-500 text-xs mt-5">
          คุณสามารถย้ายแผน/ยกเลิกได้ทุกเวลาในหน้า Settings
        </p>
      </div>
    </main>
  );
            }
