import { randomBytes } from "node:crypto";
export default function ({
  db,
  app,
  router,
  run,
  get,
  all,
  id,
  now,
  text,
  required,
  fail,
  tx,
}) {
  db.exec(`CREATE TABLE IF NOT EXISTS links(id TEXT PRIMARY KEY,owner TEXT REFERENCES users(id),code TEXT UNIQUE,target TEXT,enabled INTEGER DEFAULT 1,expires TEXT);
 CREATE TABLE IF NOT EXISTS clicks(id INTEGER PRIMARY KEY,link TEXT REFERENCES links(id),at TEXT);CREATE INDEX IF NOT EXISTS clicks_by_link ON clicks(link,at);`);
  router.post("/links", (req, res) => {
    const target = text(req.body.target, 2000);
    let u;
    try {
      u = new URL(target);
    } catch {
      fail(422, "Geçerli URL gerekli");
    }
    if (!["http:", "https:"].includes(u.protocol) || u.username || u.password)
      fail(422, "Yalnız kimlik bilgisi içermeyen HTTP/HTTPS adresi");
    const expires = req.body.expires || null;
    if (
      expires &&
      (!Number.isFinite(Date.parse(expires)) ||
        Date.parse(expires) <= Date.now())
    )
      fail(422, "Gelecek tarih gerekli");
    const lid = id();
    let code;
    for (let n = 0; n < 5; n++) {
      code = randomBytes(6).toString("base64url");
      try {
        run(
          "INSERT INTO links(id,owner,code,target,expires) VALUES(?,?,?,?,?)",
          lid,
          req.user.id,
          code,
          u.href,
          expires ? new Date(expires).toISOString() : null,
        );
        break;
      } catch (e) {
        if (n === 4) throw e;
      }
    }
    res.status(201).json({ id: lid, code, shortPath: "/r/" + code });
  });
  router.get("/links", (req, res) =>
    res.json(
      all(
        "SELECT l.*,(SELECT COUNT(*) FROM clicks c WHERE c.link=l.id) clicks FROM links l WHERE owner=?",
        req.user.id,
      ),
    ),
  );
  router.patch("/links/:id", (req, res) => {
    required(
      get(
        "SELECT id FROM links WHERE id=? AND owner=?",
        req.params.id,
        req.user.id,
      ),
    );
    run(
      "UPDATE links SET enabled=? WHERE id=?",
      req.body.enabled === true ? 1 : 0,
      req.params.id,
    );
    res.json({ ok: true });
  });
  router.get("/links/:id/stats", (req, res) => {
    required(
      get(
        "SELECT id FROM links WHERE id=? AND owner=?",
        req.params.id,
        req.user.id,
      ),
    );
    res.json(
      all(
        "SELECT substr(at,1,10) day,COUNT(*) clicks FROM clicks WHERE link=? GROUP BY day ORDER BY day",
        req.params.id,
      ),
    );
  });
  app.get("/r/:code", (req, res) => {
    const l = required(
      get("SELECT * FROM links WHERE code=?", req.params.code),
    );
    if (!l.enabled || (l.expires && l.expires < now()))
      fail(410, "Bağlantı kapalı veya süresi dolmuş");
    run("INSERT INTO clicks(link,at) VALUES(?,?)", l.id, now());
    res.set("Cache-Control", "no-store").redirect(302, l.target);
  });
}
