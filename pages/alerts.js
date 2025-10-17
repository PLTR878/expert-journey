// ตัวอย่างเรียกใช้ใน Alerts.js
useEffect(() => {
  const loadMatches = async () => {
    const res = await fetch("/api/scan-latest");
    const data = await res.json();
    setMatches(data.results || []);
  };
  loadMatches();
}, []);
