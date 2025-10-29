export default function VipReister({ go, setPaid }) {
  const confirmVip = () => {
    localStorage.setItem("paid", "true");
    setPaid(true);
    alert("🎉 สมัคร VIP สำเร็จ!");
    go("market");
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-[#0b1220] text-white">
      <div className="bg-[#111827] p-6 rounded-2xl w-full max-w-xs text-center shadow-xl">
        <h1 className="text-emerald-400 font-extrabold text-xl mb-3">💎 สมัครแบบพรีเมียม</h1>
        <p className="text-sm text-gray-300 mb-6">
          ปลดล็อก OriginX เต็มระบบ: AI Discovery, Quant Scanner, News Pro และฟีเจอร์ใหม่ก่อนใคร
        </p>

        <button onClick={confirmVip}
          className="bg-emerald-500 hover:bg-emerald-600 w-full py-2 rounded-lg font-bold mb-3">
          ยืนยันสมัคร (฿299/เดือน)
        </button>

        <button
          onClick={() => {
            alert("เข้าสู่โหมดทดลองใช้งานฟรี ✅");
            setPaid(true);
            localStorage.setItem("paid", "true");
            go("market");
          }}
          className="bg-gray-600 hover:bg-gray-500 w-full py-2 rounded-lg font-bold"
        >
          เข้าฟรีโหมดทดลอง
        </button>

        <p className="text-xs text-gray-400 mt-3">
          คุณสามารถยกเลิกหรือเปลี่ยนแผนได้ทุกเวลาในหน้า Settings
        </p>
      </div>
    </main>
  );
}
