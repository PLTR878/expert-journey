export default function SettinMenu() {

  const logout = () => {
    localStorage.removeItem("logged");
    window.location.href = "/";
  };

  return (
    <section className="min-h-screen bg-[#0b1220] text-white flex flex-col justify-center items-center px-6">

      <h1 className="text-[20px] font-semibold mb-6 tracking-wide">
        ออกจากระบบ
      </h1>

      <button
        onClick={logout}
        className="w-full max-w-xs py-3 rounded-lg font-medium
                   bg-red-500/80 hover:bg-red-500 transition duration-200"
      >
        ออกจากระบบ
      </button>

    </section>
  );
          }
