import { useState } from "react";

export default function ReisterPae({ go }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [cf, setCf] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const onReister = async (e) => {
    e.preventDefault();
    if (pw !== cf) {
      setMsg("❌ รหัสผ่านไม่ตรงกัน");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      // mock register
      await new Promise((r) => setTimeout(r, 700));
      localStorage.setItem("mockUser", JSON.stringify({ email }));
      setMsg("✅ สมัครสำเร็จ กำลังย้ายไปหน้า VIP...");
      setTimeout(() => {
        if (go) go("vip");
        else window.location.hash = "#vip";
      }, 900);
    } catch (e) {
      setMsg("❌ สมัครไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex justify-center items-center bg-[#0b1220]">
      <div className="w-full max-w-md bg-[#141b2d] rounded-2xl p-6 shadow-lg border border-gray-800 text-white">
        <h1 className="text-2xl font-extrabold text-emerald-400 text-center mb-5">
          🧭 สมัครสมาชิก
        </h1>

        <form onSubmit={onReister} className="space-y-4">
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
          <input
            type="password"
            placeholder="ยืนยันรหัสผ่าน"
            className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-sm"
            value={cf}
            onChange={(e) => setCf(e.target.value)}
            required
          />

          {msg && (
            <p className={`text-sm text-center ${msg.includes("✅") ? "text-emerald-400" : "text-red-400"}`}>
              {msg}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-emerald-500 hover:bg-emerald-600 py-2 rounded-xl font-extrabold text-black"
          >
            {busy ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-4">
          มีบัญชีอยู่แล้ว?{" "}
          <button onClick={() => go("login")} className="text-emerald-400 hover:underline">
            เข้าสู่ระบบ
          </button>
        </p>
      </div>
    </main>
  );
              }
