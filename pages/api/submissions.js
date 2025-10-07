export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const body = req.body || {};
  // Later: call AdOrbit here. For now, just echo back.
  res.status(200).json({ received: body, status: "ok" });
}
