// เพิ่ม state
const [progress, setProgress] = useState(0);
const [matches, setMatches] = useState([]);
const [running, setRunning] = useState(false);
const [latestSymbol, setLatestSymbol] = useState("");

// ระบบเสียง
function playAlertSound() {
  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
  audio.play().catch(() => {});
}

async function runAutoScan() {
  if (running) return;
  setRunning(true);
  setMatches([]);
  setProgress(0);
  setLatestSymbol("");

  let cursor = 0;
  const params = new URLSearchParams({
    mode,
    rsiMin,
    rsiMax,
    priceMin,
    priceMax
  });

  while (true) {
    const res = await fetch(`/api/scan?${params}&cursor=${cursor}`);
    const j = await res.json();

    if (!j?.ok) break;
    if (j.matches?.length) {
      setMatches(prev => [...prev, ...j.matches]);
      playAlertSound(); // 🔔 แจ้งเตือนเมื่อเจอหุ้นเข้าเงื่อนไข
    }

    setProgress(j.progress);
    cursor = j.nextCursor ?? 0;
    setLatestSymbol(`Batch ${cursor / 10}`);

    if (j.done) {
      setRunning(false);
      break;
    }
    await new Promise(r => setTimeout(r, 300));
  }
}
