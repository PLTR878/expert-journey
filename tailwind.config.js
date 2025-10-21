/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { brand: { DEFAULT: "#2563eb" } },
      boxShadow: { soft: "0 8px 30px rgba(0,0,0,0.06)" }
    },
  },
  darkMode: "class",
  plugins: [],
};
