const fs = require("fs");
const https = require("https");
const path = require("path");

const root = path.resolve(__dirname, "..");
const origin = "https://xecauthienphu.com/";

const serviceSlugs = [
  "dich-vu-nang-cau-hang-hoa.html",
  "cho-thue-xe-nang-tai-tphcm.html",
  "cho-thue-xe-nang.html",
  "cho-thue-xe-cau.html",
  "dong-pallet.html",
  "cho-thue-xe-cau-tai-tphcm.html",
  "rut-cont-may-tai-tphcm.html",
  "van-chuyen-may-tai-long-an-79478472.html",
  "cho-thue-xe-nang-duc-hoa.html",
  "cho-thue-xe-cau-duc-hoa.html",
];

const newsSlugs = [
  "cho-thue-xe-nang-tai-tphcm.html",
  "cho-thue-xe-nang-hang.html",
  "cong-ty-cho-thue-xe-cau-tai-long-an-ho-tro-tan-noi-247.html",
  "dich-vu-cho-thue-xe-cau-long-an-uy-tin-chuyen-nghiep.html",
  "cho-thue-xe-cau-phuc-vu-cong-trinh-xay-dung-tai-tp-hcm.html",
  "cho-thue-xe-cau-tu-hanh-tai-tp-hcm.html",
  "dich-vu-thua-xe-nang-cho-nha-may-kcn-long-an.html",
  "thue-xe-nang-hang-tai-long-an.html",
  "dich-vu-thue-xe-nang-hang-trong-kho-xuong-tai-tphcm.html",
  "dich-vu-cho-thue-xe-nang-tphcm-chuyen-nghiep-da-dang-tai-trong.html",
  "cho-thue-xe-nang-nguoi-tai-long-an.html",
  "cho-thue-xe-nang-nguoi-tai-tphcm.html",
  "rut-cont-may-tai-long-an.html",
  "cau-may-len-lau-tphcm.html",
  "van-chuyen-may-tai-tphcm.html",
  "cho-thue-xe-nang-98459500.html",
  "nau-ca-hang-tai-tphcm.html",
  "nang-ha-may-moc-tai-long-an.html",
];

const extraSlugs = [
  "hinh-anh-97345933.html",
  "dich-vu-xay-dung.html",
  "dich-vu-nang-ha-27670520.html",
  "dich-vu-nang-ha-27670520-78217971.html",
  "dich-vu-nang-ha-27670520-39900177.html",
  "dich-vu-nang-ha-27670520-78217971-59153222.html",
];

const articleLinks = {
  "nang-cau": [{ href: "dich-vu-nang-cau-hang-hoa.html", label: "Đọc bài đầy đủ" }],
  "xe-nang": [{ href: "cho-thue-xe-nang.html", label: "Đọc bài đầy đủ" }],
  "xe-nang-tphcm": [{ href: "cho-thue-xe-nang-tai-tphcm.html", label: "Đọc bài đầy đủ" }],
  "xe-cau-tphcm": [{ href: "cho-thue-xe-cau-tai-tphcm.html", label: "Đọc bài đầy đủ" }],
  "duc-hoa": [
    { href: "cho-thue-xe-nang-duc-hoa.html", label: "Bài xe nâng Đức Hòa" },
    { href: "cho-thue-xe-cau-duc-hoa.html", label: "Bài xe cẩu Đức Hòa" },
  ],
  pallet: [{ href: "dong-pallet.html", label: "Đọc bài đầy đủ" }],
};

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = new URL(res.headers.location, url).href;
        res.resume();
        resolve(get(next));
        return;
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    req.setTimeout(25000, () => req.destroy(new Error("timeout " + url)));
  });
}

function decode(value) {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function abs(src) {
  let url = String(src || "").trim();
  if (!url || url.startsWith("data:")) return "";
  if (url.startsWith("//")) url = "https:" + url;
  else if (url.startsWith("/")) url = "https://xecauthienphu.com" + url;
  else if (!/^https?:/i.test(url)) url = origin + url;
  return url.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29");
}

function textOf(html) {
  return decode(String(html).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function clean(html) {
  let source = String(html)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  const tokens = [];
  const keep = (tag) => {
    const id = tokens.length;
    tokens.push(tag);
    return `\u0000${id}\u0000`;
  };
  source = source.replace(/<img\b[^>]*?\bsrc=["']([^"']+)["'][^>]*>/gi, (_, src) => {
    const url = abs(src);
    return url ? keep(`<img src="${esc(url)}" alt="">`) : "";
  });
  source = source.replace(/<a\b[^>]*?\bhref=["']([^"']+)["'][^>]*>/gi, (_, href) => {
    const raw = String(href).trim();
    const local = raw.match(/^(?:https?:\/\/xecauthienphu\.com\/)?([a-z0-9-]+\.html)(?:[?#].*)?$/i);
    if (local) return keep(`<a href="${esc(local[1])}">`);
    if (/^https?:\/\//i.test(raw) && !/webminhthuan/i.test(raw)) return keep(`<a href="${esc(raw)}">`);
    return "";
  });
  source = source.replace(/<\/a\s*>/gi, () => keep("</a>"));
  source = source.replace(/<br\s*\/?>/gi, () => keep("<br>"));
  source = source.replace(/<\/(p|strong|b|em|ul|ol|li|h2|h3)\s*>/gi, (_, name) => keep(`</${name.toLowerCase()}>`));
  source = source.replace(/<(p|strong|b|em|ul|ol|li|h2|h3)\b[^>]*>/gi, (_, name) => keep(`<${name.toLowerCase()}>`));
  source = source.replace(/<[^>]+>/g, "");
  source = source.replace(/\u0000(\d+)\u0000/g, (_, id) => tokens[Number(id)]);
  source = source.replace(/<[^>]*$/g, "");
  source = source.replace(/&nbsp;/g, " ").replace(/&#160;/g, " ");
  source = source.replace(/<p>(?:\s|<br>)*<\/p>/gi, "");
  return source.replace(/\n{3,}/g, "\n\n").trim();
}

function paragraphs(html) {
  const out = [];
  const re = /<p>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = re.exec(html))) {
    const text = textOf(match[1]);
    if (text.length > 25) out.push(text);
  }
  return out;
}

function parseArticle(html) {
  const titleMatch = html.match(/workshome-title"><h1><span>([\s\S]*?)<\/span>/i)
    || html.match(/<h2 class="itemTitle">([\s\S]*?)<\/h2>/i)
    || html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? textOf(titleMatch[1]).replace(/\s*-\s*Nâng Cẩu Thiên Phú\s*$/i, "").trim() : "";
  const start = html.search(/<div[^>]*class="itemFullText"/i);
  if (start < 0) return null;
  let chunk = html.slice(start);
  const openEnd = chunk.indexOf(">");
  if (openEnd >= 0) chunk = chunk.slice(openEnd + 1);
  const end = chunk.search(/<div[^>]*class="(?:facecomment|itemVideoBlock)"|class="itemLinks"|class="itemTags"/i);
  if (end > 0) chunk = chunk.slice(0, end);
  const body = clean(chunk);
  const plain = textOf(body);
  const images = [];
  const imgRe = /<img\b[^>]*?\bsrc=["']([^"']+)["']/gi;
  let img;
  const fullStart = html.search(/class="itemFullText"/i);
  const galleryStart = fullStart >= 0 ? html.indexOf("itemVideoBlock", fullStart) : -1;
  const galleryHtml = galleryStart >= 0 ? html.slice(galleryStart, galleryStart + 80000) : "";
  while ((img = imgRe.exec(galleryHtml))) {
    const url = abs(img[1]);
    if (url && !images.includes(url)) images.push(url);
  }
  const inline = [];
  const inlineRe = /<img src="([^"]+)"/g;
  let inlineMatch;
  while ((inlineMatch = inlineRe.exec(body))) inline.push(inlineMatch[1]);
  if (plain.length < 40 && inline.length === 0 && images.length === 0) return null;
  return { title, body, plain, paragraphs: paragraphs(body), images, inline };
}

function pageHtml(item) {
  const section = serviceSlugs.includes(item.slug) ? "dich-vu" : "tin-tuc";
  const gallery = item.images
    .filter((url) => !item.inline.includes(url))
    .slice(0, 12)
    .map((url) => `<img src="${esc(url)}" alt="">`)
    .join("");
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(item.title)} - Nâng Cẩu Thiên Phú</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="loader" id="loader" role="status">
    <img src="https://xecauthienphu.com/images/2.png" alt="Thiên Phú">
    <p class="loader-name">THIÊN PHÚ</p>
    <div class="loader-spin" aria-hidden="true"></div>
    <p class="loader-wait">Đang tải, vui lòng đợi ...</p>
  </div>
  <script>
    document.documentElement.classList.add("is-loading");
    setTimeout(function () {
      var el = document.getElementById("loader");
      document.documentElement.classList.remove("is-loading");
      if (!el) return;
      el.classList.add("off");
      setTimeout(function () { el.remove(); }, 500);
    }, 3000);
  </script>
  <div class="ticker"><div class="ticker-track"><p>» Cho thuê xe nâng – xe cẩu – bốc dỡ, vận chuyển máy móc công nghiệp tại TP.HCM, Long An, Bình Dương, Đồng Nai. Liên hệ ngay: 0908.685.815 «</p><p aria-hidden="true">» Cho thuê xe nâng – xe cẩu – bốc dỡ, vận chuyển máy móc công nghiệp tại TP.HCM, Long An, Bình Dương, Đồng Nai. Liên hệ ngay: 0908.685.815 «</p></div></div>
  <header class="top">
    <div class="wrap top-row">
      <a class="logo" href="index.html"><img src="https://xecauthienphu.com/images/2.png" alt="Logo Thiên Phú"><span>Hotline: <b>0908.685.815</b></span></a>
      <div class="brand">
        <img src="https://xecauthienphu.com/images/3-1.png" alt="Nâng Cẩu Thiên Phú">
        <p>Website: <span>xecauthienphu.com</span> - Email: <span>xenangthienphu@gmail.com</span></p>
      </div>
      <a class="hotline-box" href="tel:0908685815"><img src="https://xecauthienphu.com/images/hotline.png" alt=""><span class="hotline-num">0908.685.815</span></a>
    </div>
  </header>
  <nav class="nav"><div class="wrap">
    <button class="burger" type="button" aria-label="Mở menu">☰</button>
    <ul>
      <li><a href="index.html">Trang chủ</a></li>
      <li><a href="gioi-thieu.html">Giới thiệu</a></li>
      <li><a${section === "dich-vu" ? ' class="active"' : ""} href="dich-vu.html">Dịch vụ</a></li>
      <li><a href="hinh-anh.html">Hình ảnh</a></li>
      <li><a${section === "tin-tuc" ? ' class="active"' : ""} href="tin-tuc.html">Tin tức</a></li>
      <li><a href="lien-he.html">Liên hệ</a></li>
    </ul>
  </div></nav>
  <div class="crumb"><div class="wrap"><a href="index.html">Trang chủ</a> » <a href="${section === "dich-vu" ? "dich-vu.html" : "tin-tuc.html"}">${section === "dich-vu" ? "Dịch vụ" : "Tin tức"}</a> » <strong>${esc(item.title)}</strong></div></div>
  <main class="page" data-static="1"><div class="wrap article">
    <h1>${esc(item.title)}</h1>
    <p class="source">Bài gốc: <a href="${esc(origin + item.slug)}">${esc(origin + item.slug)}</a></p>
    ${item.body}
    ${gallery ? `<div class="article-gallery">${gallery}</div>` : ""}
  </div></main>
  <footer class="footer"><div class="wrap"><p>Hotline 0908.685.815 - 0938.766.815</p></div></footer>
  <div class="sub">Nâng Cẩu Thiên Phú</div>
  <div class="float">
    <a href="https://zalo.me/0908685815"><img src="https://xecauthienphu.com/images/zalo.png" alt="Zalo"></a>
    <a href="tel:0908685815"><img src="https://xecauthienphu.com/images/call1.png" alt="Gọi"></a>
  </div>
  <script src="js/site.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
`;
}

function newsItem(item, home) {
  const image = item.inline[0] || item.images[0] || "https://xecauthienphu.com/images/2.png";
  const excerpt = (item.paragraphs[0] || "").slice(0, 220);
  return {
    title: item.title,
    excerpt,
    image,
    href: item.slug,
    home,
    bullets: item.paragraphs.slice(1, 4).map((line) => line.slice(0, 140)),
  };
}

function card(item) {
  return `<a class="news-card" href="${esc(item.href)}">
            <img src="${esc(item.image)}" alt="${esc(item.title)}">
            <div>
              <h3>${esc(item.title)}</h3>
              <p>${esc(item.excerpt)}</p>
            </div>
          </a>`;
}

function listItem(item) {
  return `<a class="news-item" href="${esc(item.href)}">
        <img src="${esc(item.image)}" alt="${esc(item.title)}">
        <div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.excerpt)}</p>
        </div>
      </a>`;
}

async function main() {
  const slugs = [...new Set([...serviceSlugs, ...newsSlugs, ...extraSlugs])];
  const parsed = new Map();
  for (const slug of slugs) {
    try {
      const res = await get(origin + slug);
      const article = res.status === 200 ? parseArticle(res.body) : null;
      if (!article) {
        console.log("SKIP", res.status, slug);
        continue;
      }
      article.slug = slug;
      parsed.set(slug, article);
      fs.writeFileSync(path.join(root, slug), pageHtml(article));
      console.log("OK", slug, article.plain.length, article.title);
    } catch (error) {
      console.log("ERR", slug, error.message);
    }
  }

  const sitePath = path.join(root, "data", "site.json");
  const site = JSON.parse(fs.readFileSync(sitePath, "utf8"));
  serviceSlugs.forEach((slug, index) => {
    const article = parsed.get(slug);
    if (site.services[index]) site.services[index].href = slug;
    if (article && site.articles) {
      const id = Object.keys(articleLinks).find((key) => articleLinks[key].some((link) => link.href === slug));
      const node = id && site.articles.find((item) => item.id === id);
      if (node && article.paragraphs[0]) {
        node.body = article.paragraphs.slice(0, 2).join(" ");
        node.links = articleLinks[id];
        if (article.inline[0] || article.images[0]) node.image = article.inline[0] || article.images[0];
      }
    }
  });
  if (site.articles) {
    site.articles.forEach((article) => {
      if (articleLinks[article.id]) article.links = articleLinks[article.id];
    });
  }

  const news = [];
  newsSlugs.forEach((slug) => {
    const article = parsed.get(slug);
    if (article) news.push(newsItem(article, news.length < 3));
  });
  extraSlugs.forEach((slug) => {
    const article = parsed.get(slug);
    if (article) news.push(newsItem(article, false));
  });
  if (news.length) site.news = news;
  fs.writeFileSync(sitePath, JSON.stringify(site, null, 2) + "\n");

  let index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const replacements = [
    ['href="dich-vu.html#nang-cau"', 'href="dich-vu-nang-cau-hang-hoa.html"'],
    ['href="dich-vu.html#xe-nang-tphcm"', 'href="cho-thue-xe-nang-tai-tphcm.html"'],
    ['href="dich-vu.html#xe-nang"', 'href="cho-thue-xe-nang.html"'],
    ['href="dich-vu.html#pallet"', 'href="dong-pallet.html"'],
    ['href="dich-vu.html#xe-cau-tphcm"', 'href="cho-thue-xe-cau-tai-tphcm.html"'],
  ];
  replacements.forEach(([from, to]) => {
    if (!index.includes(from)) console.log("MISS index", from.slice(0, 80));
    else index = index.split(from).join(to);
  });
  index = index.replace(/href="tin-tuc.html">(\s*)<img src="https:\/\/xecauthienphu.com\/media\/k2\/items\/cache\/item5410111764208054_L.jpg"/, 'href="rut-cont-may-tai-tphcm.html">$1<img src="https://xecauthienphu.com/media/k2/items/cache/item5410111764208054_L.jpg"');
  index = index.replace(/href="tin-tuc.html">(\s*)<img src="https:\/\/xecauthienphu.com\/media\/k2\/items\/cache\/item9044981763352877_L.jpg"/, 'href="van-chuyen-may-tai-long-an-79478472.html">$1<img src="https://xecauthienphu.com/media/k2/items/cache/item9044981763352877_L.jpg"');
  index = index.replace(/href="dich-vu.html#duc-hoa">(\s*)<img src="https:\/\/xecauthienphu.com\/media\/k2\/items\/cache\/item8263821761980313_L.jpg"/, 'href="cho-thue-xe-nang-duc-hoa.html">$1<img src="https://xecauthienphu.com/media/k2/items/cache/item8263821761980313_L.jpg"');
  index = index.replace(/href="dich-vu.html#duc-hoa">(\s*)<img src="https:\/\/xecauthienphu.com\/media\/k2\/items\/cache\/item8129421761964006_L.jpg"/, 'href="cho-thue-xe-cau-duc-hoa.html">$1<img src="https://xecauthienphu.com/media/k2/items/cache/item8129421761964006_L.jpg"');
  index = index.replace('href="dich-vu.html#duc-hoa">Cho thuê xe nâng Đức Hòa</a>', 'href="cho-thue-xe-nang-duc-hoa.html">Cho thuê xe nâng Đức Hòa</a>');
  index = index.replace('href="dich-vu.html#duc-hoa">Cho thuê xe cẩu Đức Hòa</a>', 'href="cho-thue-xe-cau-duc-hoa.html">Cho thuê xe cẩu Đức Hòa</a>');
  const homeNews = news.slice(0, 3);
  if (homeNews.length === 3) {
    index = index.replace(/<div class="news-grid">[\s\S]*?<\/div>\s*<p class="cards-more">/, `<div class="news-grid">\n          ${homeNews.map(card).join("\n          ")}\n        </div>\n        <p class="cards-more">`);
  }
  fs.writeFileSync(path.join(root, "index.html"), index);

  let newsPage = fs.readFileSync(path.join(root, "tin-tuc.html"), "utf8");
  newsPage = newsPage.replace(/<div class="news-list">[\s\S]*?<\/div>\s*<\/div><\/main>/, `<div class="news-list">\n      ${news.map(listItem).join("\n      ")}\n    </div>\n  </div></main>`);
  fs.writeFileSync(path.join(root, "tin-tuc.html"), newsPage);

  let services = fs.readFileSync(path.join(root, "dich-vu.html"), "utf8");
  Object.entries(articleLinks).forEach(([id, links]) => {
    const block = links.map((link) => `<p><a class="more" href="${link.href}">${esc(link.label)}</a></p>`).join("");
    const pattern = new RegExp(`(<article id="${id}">[\\s\\S]*?)(</article>)`);
    if (!pattern.test(services)) {
      console.log("MISS article", id);
      return;
    }
    services = services.replace(pattern, (_, inner, end) => {
      const stripped = inner.replace(/<p><a class="more"[\s\S]*?<\/p>\s*/g, "");
      return stripped + block + end;
    });
  });
  fs.writeFileSync(path.join(root, "dich-vu.html"), services);
  console.log("DONE", parsed.size);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
