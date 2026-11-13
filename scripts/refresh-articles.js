const fs = require("fs");
const path = require("path");
const { get, parseArticle, esc } = require("./import-old");

const root = path.resolve(__dirname, "..");
const refresh = [
  "cho-thue-xe-cau-tu-hanh-tai-tp-hcm.html",
  "cho-thue-xe-nang-nguoi-tai-long-an.html",
  "cho-thue-xe-nang-tai-tphcm.html",
  "cong-ty-cho-thue-xe-cau-tai-long-an-ho-tro-tan-noi-247.html",
  "dich-vu-cho-thue-xe-nang-tphcm-chuyen-nghiep-da-dang-tai-trong.html",
  "cau-may-len-lau.html",
];

function galleryHtml(item) {
  const urls = item.images.filter((url) => !item.inline.includes(url));
  if (!urls.length) return "";
  return `<div class="article-gallery">${urls.map((url) => `<img src="${esc(url)}" alt="">`).join("")}</div>`;
}

function putBody(html, item) {
  const source = html.indexOf('class="source"');
  const after = html.indexOf("</p>", source);
  const end = html.indexOf("</div></main>");
  if (source < 0 || after < 0 || end < 0) throw new Error("markers " + item.slug);
  const block = `\n    ${item.body}\n    ${galleryHtml(item)}\n    `;
  return html.slice(0, after + 4) + block + html.slice(end);
}

async function main() {
  const shell = fs.readFileSync(path.join(root, "cho-thue-xe-nang.html"), "utf8");
  for (const slug of refresh) {
    const res = await get("https://xecauthienphu.com/" + slug);
    const article = parseArticle(res.body);
    if (!article) {
      console.log("SKIP", slug, res.status);
      continue;
    }
    article.slug = slug;
    const file = path.join(root, slug);
    let html = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : shell;
    if (!fs.existsSync(file)) {
      html = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(article.title)} - Nâng Cẩu Thiên Phú</title>`)
        .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${esc(article.title)}</h1>`)
        .replace(/» <strong>[\s\S]*?<\/strong>/, `» <strong>${esc(article.title)}</strong>`)
        .replace("https://xecauthienphu.com/cho-thue-xe-nang.html", "https://xecauthienphu.com/" + slug);
    }
    html = putBody(html, article);
    fs.writeFileSync(file, html);
    const tables = (article.body.match(/<table/gi) || []).length;
    console.log("OK", slug, article.plain.length, "tables", tables, article.title);
    if (slug === "cau-may-len-lau.html") {
      const sitePath = path.join(root, "data", "site.json");
      const site = JSON.parse(fs.readFileSync(sitePath, "utf8"));
      if (!site.news.some((item) => item.href === slug)) {
        site.news.push({
          title: article.title,
          excerpt: (article.paragraphs[0] || "").slice(0, 220),
          image: article.inline[0] || article.images[0] || "https://xecauthienphu.com/images/2.png",
          href: slug,
          home: false,
          bullets: article.paragraphs.slice(1, 4).map((line) => line.slice(0, 140)),
        });
        fs.writeFileSync(sitePath, JSON.stringify(site, null, 2) + "\n");
      }
      const newsPath = path.join(root, "tin-tuc.html");
      let news = fs.readFileSync(newsPath, "utf8");
      if (!news.includes(slug)) {
        const card = `<a class="news-item" href="${slug}">
        <img src="${esc(article.inline[0] || article.images[0] || "https://xecauthienphu.com/images/2.png")}" alt="${esc(article.title)}">
        <div>
          <h3>${esc(article.title)}</h3>
          <p>${esc((article.paragraphs[0] || "").slice(0, 220))}</p>
        </div>
      </a>\n    `;
        news = news.replace("</div>\n  </div></main>", card + "</div>\n  </div></main>");
        fs.writeFileSync(newsPath, news);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
