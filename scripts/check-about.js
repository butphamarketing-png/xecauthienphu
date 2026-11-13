const fs = require("fs");
const path = require("path");
const { get, parseArticle } = require("./import-old");
const root = path.resolve(__dirname, "..");

async function main() {
  const about = await get("https://xecauthienphu.com/gioi-thieu.html");
  const parsed = parseArticle(about.body);
  console.log("gioi-thieu", parsed ? parsed.plain.length : "no article", "paras", parsed ? parsed.paragraphs.length : 0);
  if (parsed && parsed.plain.length > 400) {
    const file = path.join(root, "gioi-thieu.html");
    let html = fs.readFileSync(file, "utf8");
    const imgEnd = html.indexOf(">", html.indexOf('class="wide"'));
    const end = html.indexOf("</div></main>");
    html = html.slice(0, imgEnd + 1) + "\n    " + parsed.body + "\n  " + html.slice(end);
    fs.writeFileSync(file, html);
    const sitePath = path.join(root, "data", "site.json");
    const site = JSON.parse(fs.readFileSync(sitePath, "utf8"));
    site.about.paragraphs = parsed.paragraphs;
    if (parsed.inline[0]) site.about.image = parsed.inline[0];
    fs.writeFileSync(sitePath, JSON.stringify(site, null, 2) + "\n");
    console.log("about updated", parsed.paragraphs.length);
  }
  const gallery = await get("https://xecauthienphu.com/hinh-anh-97345933.html");
  const imgs = [...gallery.body.matchAll(/src="(\/images\/[^"]+)"/g)].map((m) => "https://xecauthienphu.com" + m[1]);
  const unique = [...new Set(imgs)];
  const local = fs.readFileSync(path.join(root, "hinh-anh.html"), "utf8");
  const missing = unique.filter((url) => !local.includes(url.split("/").pop()));
  console.log("gallery remote", unique.length, "missing", missing.length);
  missing.slice(0, 12).forEach((url) => console.log(url));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
