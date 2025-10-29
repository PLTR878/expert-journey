// ✅ /pages/login.js — หน้าเข้าสู่ระบบ OriginX
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: true,
        email,
        password,
        callbackUrl: "/",
      });

      if (res?.error) setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-[#0b1220] text-white px-6">
      <div className="w-full max-w-md bg-[#141b2d] rounded-2xl p-6 shadow-lg border border-gray-800">
        <h1 className="text-2xl font-extrabold text-center text-emerald-400 mb-5">
          🔐 เข้าสู่ระบบ OriginX
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
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

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 py-2 rounded-xl font-extrabold text-black"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-4">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="text-emerald-400 hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </main>
  );
    }
