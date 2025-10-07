export default function handler(req, res) {
  const q = String(req.query.q || "").toLowerCase();
  // Demo data – replace with your warehouse once ready:
  const demo = [
    { id: "1", name: "Pisgah Legal Services" },
    { id: "2", name: "French Lick Resort" },
    { id: "3", name: "WakeUP Wake County" },
    { id: "4", name: "Raleigh Forward" }
  ];
  const out = q ? demo.filter(c => c.name.toLowerCase().includes(q)) : demo.slice(0, 8);
  res.status(200).json(out);
}
