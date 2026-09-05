module.exports = function handler(req, res) {
  var key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    res.status(500).json({ error: 'VAPID_PUBLIC_KEY is not configured' });
    return;
  }
  res.status(200).json({ publicKey: key });
};
