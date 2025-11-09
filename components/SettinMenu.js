export default function SettinMenu() {
  const logout = () => {
    localStorage.removeItem("logged");
    localStorage.removeItem("username");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-6 py-10">

      <h1 className="text-[20px] font-semibold mb-8">Settings</h1>

      {/* Section */}
      <div className="space-y-4">

        <div className="bg-[#111827] p-4 rounded-xl border border-white/10 flex justify-between items-center">
          <span className="text-[14px] text-gray-300">Account</span>
          <span className="text-[14px] font-medium text-white">
            {localStorage.getItem("username") || "Guest"}
          </span>
        </div>

        <div className="bg-[#111827] p-4 rounded-xl border border-white/10 flex justify-between items-center opacity-40">
          <span className="text-[14px] text-gray-300">Premium</span>
          <span className="text-[14px] text-gray-400">Coming soon</span>
        </div>

      </div>

      {/* Logout button */}
      <button
        onClick={logout}
        className="w-full mt-10 py-3 rounded-xl border border-red-400 text-red-400 text-[14px] font-medium hover:bg-red-500 hover:text-white transition-all"
      >
        Logout
      </button>
    </div>
  );
            }
