/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { brand: { DEFAULT: "#2563eb" } },
      boxShadow: { soft: "0 8px 30px rgba(0,0,0,0.06)" },
    },
  },
  darkMode: "class",
  plugins: [],
};
``` |
| **postcss.config.js** |  
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
``` |

> ❗ ถ้าไม่มีไฟล์เหล่านี้ — ให้สร้างใหม่ตรง ๆ ใน GitHub ได้เลยครับ (กด “Add file → Create new file”)

---

### 🔹 ขั้นที่ 3: Redeploy ใหม่ (พร้อม Clear Cache)
ใน **Vercel → Deployments → ปุ่ม “Redeploy” → ติ๊ก “Clear build cache” → กด Deploy**

---

## ✅ ผลลัพธ์หลังแก้ครบ
- Build จะผ่าน (ไม่มี “Cannot find module tailwindcss”)  
- หน้าเว็บทั้งหมด (รวมทั้ง `/analyze/[symbol]`) จะแสดง UI Tailwind ได้ปกติ  
- สถานะใน Vercel จะเป็น
