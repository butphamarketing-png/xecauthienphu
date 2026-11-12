const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname);
const DATA = path.join(ROOT, "data");
const sessions = new Map();
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

function readJson(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
  } catch (e) {
    return fallback;
  }
}

function writeJson(name, value) {
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(path.join(DATA, name), JSON.stringify(value, null, 2));
}

function send(res, code, body, type) {
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(code, {
    "Content-Type": type || "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(payload);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("too big"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function tokenOf(req) {
  const raw = req.headers.cookie || "";
  const match = raw.match(/(?:^|;\s*)tp=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function isAuthed(req) {
  const token = tokenOf(req);
  const session = sessions.get(token);
  if (!session || session.exp < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function safeFile(urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  const resolved = path.resolve(ROOT, "." + rel);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
  const dataRoot = path.resolve(DATA);
  if (resolved === dataRoot || resolved.startsWith(dataRoot + path.sep)) return null;
  return resolved;
}

function clip(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function validSite(site) {
  return site && typeof site === "object" && site.company && typeof site.company === "object" && Array.isArray(site.services);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  try {
    if (pathname === "/api/login" && req.method === "POST") {
      const body = await readBody(req, 20000);
      const admin = readJson("admin.json", { user: "admin", password: "ThienPhu8765" });
      const userOk = clip(body.user, 40) === String(admin.user);
      const passOk = clip(body.password, 80) === String(admin.password);
      if (!userOk || !passOk) return send(res, 401, { ok: false, error: "Sai tài khoản hoặc mật khẩu" });
      const token = crypto.randomBytes(24).toString("hex");
      sessions.set(token, { exp: Date.now() + 1000 * 60 * 60 * 12 });
      res.setHeader("Set-Cookie", "tp=" + token + "; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200");
      return send(res, 200, { ok: true });
    }

    if (pathname === "/api/logout" && req.method === "POST") {
      sessions.delete(tokenOf(req));
      res.setHeader("Set-Cookie", "tp=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
      return send(res, 200, { ok: true });
    }

    if (pathname === "/api/me" && req.method === "GET") {
      return send(res, 200, { ok: isAuthed(req) });
    }

    if (pathname === "/api/site" && req.method === "GET") {
      return send(res, 200, readJson("site.json", {}));
    }

    if (pathname === "/api/site" && req.method === "PUT") {
      if (!isAuthed(req)) return send(res, 401, { ok: false });
      const site = await readBody(req, 1200000);
      if (!validSite(site)) return send(res, 400, { ok: false, error: "Dữ liệu không hợp lệ" });
      writeJson("site.json", site);
      return send(res, 200, { ok: true });
    }

    if (pathname === "/api/password" && req.method === "POST") {
      if (!isAuthed(req)) return send(res, 401, { ok: false });
      const body = await readBody(req, 20000);
      const password = clip(body.password, 80);
      if (password.length < 6) return send(res, 400, { ok: false, error: "Mật khẩu tối thiểu 6 ký tự" });
      const admin = readJson("admin.json", { user: "admin", password: "" });
      admin.password = password;
      writeJson("admin.json", admin);
      return send(res, 200, { ok: true });
    }

    if (pathname === "/api/leads" && req.method === "GET") {
      if (!isAuthed(req)) return send(res, 401, { ok: false });
      return send(res, 200, readJson("leads.json", []));
    }

    if (pathname === "/api/leads" && req.method === "POST") {
      const body = await readBody(req, 20000);
      const lead = {
        id: Date.now().toString(36),
        at: new Date().toISOString(),
        ten: clip(body.ten, 80),
        sdt: clip(body.sdt, 30),
        dv: clip(body.dv, 120),
        nd: clip(body.nd, 1000)
      };
      if (!lead.ten || !lead.sdt) return send(res, 400, { ok: false, error: "Thiếu họ tên hoặc số điện thoại" });
      const leads = readJson("leads.json", []);
      leads.unshift(lead);
      writeJson("leads.json", leads.slice(0, 200));
      return send(res, 200, { ok: true });
    }

    if (pathname.startsWith("/api/leads/") && req.method === "DELETE") {
      if (!isAuthed(req)) return send(res, 401, { ok: false });
      const id = decodeURIComponent(pathname.slice("/api/leads/".length));
      const leads = readJson("leads.json", []).filter((item) => item.id !== id);
      writeJson("leads.json", leads);
      return send(res, 200, { ok: true });
    }

    if (pathname === "/api/upload" && req.method === "POST") {
      if (!isAuthed(req)) return send(res, 401, { ok: false });
      const body = await readBody(req, 5000000);
      const match = /^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=\s]+)$/.exec(String(body.data || ""));
      if (!match) return send(res, 400, { ok: false, error: "Chỉ nhận ảnh png, jpg, webp, gif" });
      const ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
      const buf = Buffer.from(match[2], "base64");
      if (!buf.length || buf.length > 3 * 1024 * 1024) return send(res, 400, { ok: false, error: "Ảnh tối đa 3MB" });
      const dir = path.join(ROOT, "uploads");
      fs.mkdirSync(dir, { recursive: true });
      const name = Date.now().toString(36) + "-" + crypto.randomBytes(3).toString("hex") + "." + ext;
      fs.writeFileSync(path.join(dir, name), buf);
      return send(res, 200, { ok: true, url: "/uploads/" + name });
    }
  } catch (err) {
    return send(res, 400, { ok: false, error: "Không xử lý được yêu cầu" });
  }

  if (pathname === "/admin") {
    res.writeHead(302, { Location: "/admin/" });
    res.end();
    return;
  }

  const filePath = safeFile(pathname);
  if (!filePath) return send(res, 403, "forbidden", "text/plain; charset=utf-8");
  fs.stat(filePath, (statErr, stat) => {
    const finalPath = !statErr && stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    fs.readFile(finalPath, (err, data) => {
      if (err) return send(res, 404, "not found", "text/plain; charset=utf-8");
      send(res, 200, data, types[path.extname(finalPath)] || "application/octet-stream");
    });
  });
});

server.listen(8765, () => console.log("listening 8765"));
