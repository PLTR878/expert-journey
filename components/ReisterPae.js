import { useState } from "react";
import Link from "next/link";

export default function ReisterPae() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("❌ รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // จำลองการสมัคร (ภายหลังสามารถเชื่อม Firebase / API ได้)
      await new Promise((res) => setTimeout(res, 800));
      localStorage.setItem("mockUser", JSON.stringify({ email }));
      setMessage("✅ สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
    } catch (err) {
      setMessage("❌ เกิดข้อผิดพลาดในการสมัคร");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-[#0b1220] text-white px-6">
      <div className="w-full max-w-md bg-[#141b2d] rounded-2xl p-6 shadow-lg border border-gray-800">
        <h1 className="text-2xl font-extrabold text-center text-emerald-400 mb-5">
          🧭 สมัครสมาชิก
        </h1>

        <form onSubmit={handleRegister} className="space-y-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="ยืนยันรหัสผ่าน"
            className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-sm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          {message && (
            <p
              className={`text-sm text-center ${
                message.includes("✅") ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 py-2 rounded-xl font-extrabold text-black"
          >
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-4">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </main>
  );
    }
