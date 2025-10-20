const res = await fetch(`/api/visionary-discovery-pro`, { cache: "no-store" });
const j = await res.json();
console.log(j.logs); // ✅ จะเห็น log สแกนจริงใน console
