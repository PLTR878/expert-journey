import { useState } from "react";

export default function LoinPaex({ go }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const onLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await new Promise((r) => setTimeout(r, 600));
      const paid = localStorage.getItem("paid") === "true";
      localStorage.setItem("mockUser", JSON.stringify({ email }));

      if (paid) {
        setMsg("✅ เข้าสู่ระบบสำเร็จ");
        setTimeout(() => go("market"), 500);
      } else {
        setMsg("ℹ️ ยังไม่ได้ยืนยัน VIP กำลังย้ายไปหน้า VIP…");
        setTimeout(() => go("vip"), 700);
      }
    } catch (e) {
      setMsg("❌ เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex justify-center items-center bg-[#0b1220] text-white">
      <div className="w-full max-w-md bg-[#141b2d] rounded-2xl p-6 shadow-lg border border-gray-800">
        <h1 className="text-2xl font-extrabold text-emerald-400 text-center mb-5">🔑 เข้าสู่ระบบ</h1>

        <form onSubmit={onLogin} className="space-y-4">
          <input
            type="email"
            placeholder="อีเมล"
            className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-sm"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />

          {msg && (
            <p className={`text-sm text-center ${msg.startsWith("✅") ? "text-emerald-400" : "text-amber-300"}`}>
              {msg}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-emerald-500 hover:bg-emerald-600 py-2 rounded-xl font-extrabold text-black"
          >
            {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-4">
          ยังไม่มีบัญชี?{" "}
          <button onClick={() => go("register")} className="text-emerald-400 hover:underline">
            สมัครสมาชิก
          </button>
        </p>
      </div>
    </main>
  );
                                   }
