window.TP_READY = fetch("/api/site")
  .then(function (res) { return res.json(); })
  .then(applySite)
  .catch(function () {});

function digits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function setText(el, value) {
  if (el) el.textContent = value == null ? "" : value;
}

function applySite(site) {
  if (!site || !site.company) return;
  var company = site.company;
  var home = site.home || {};
  var phone = company.phone || "";
  var tel = digits(phone);

  document.querySelectorAll(".ticker-track p").forEach(function (p) {
    p.textContent = company.ticker || "";
  });
  var logo = document.querySelector(".logo img");
  if (logo && company.logo) logo.src = company.logo;
  setText(document.querySelector(".logo b"), phone);
  document.querySelectorAll(".hotline-num").forEach(function (el) { el.textContent = phone; });
  document.querySelectorAll(".hotline-box").forEach(function (el) { el.href = "tel:" + tel; });
  var brandSpans = document.querySelectorAll(".brand p span");
  if (brandSpans[0]) brandSpans[0].textContent = company.website || "";
  if (brandSpans[1]) brandSpans[1].textContent = company.email || "";
  var word = document.querySelector(".brand img");
  if (word && company.wordmark) word.src = company.wordmark;
  document.querySelectorAll(".float a").forEach(function (a) {
    if ((a.getAttribute("href") || "").indexOf("zalo") !== -1) a.href = "https://zalo.me/" + digits(company.zalo || phone);
    if ((a.getAttribute("href") || "").indexOf("tel:") === 0) a.href = "tel:" + tel;
  });
  setText(document.querySelector(".sub"), company.tagline);

  var introImg = document.querySelector(".intro-card img");
  if (introImg && home.introImage) {
    introImg.src = home.introImage;
    introImg.alt = home.introImageAlt || "";
  }
  var introH = document.querySelector(".intro-card h2");
  if (introH) {
    introH.textContent = "";
    introH.appendChild(document.createTextNode((home.introTitle || "") + " "));
    var accent = document.createElement("span");
    accent.textContent = home.introAccent || "";
    introH.appendChild(accent);
  }
  var introP = document.querySelector(".intro-card p");
  setText(introP, home.introText);
  var checks = document.querySelector(".checks");
  if (checks && Array.isArray(home.checks)) {
    var icon = checks.querySelector("svg");
    checks.innerHTML = "";
    home.checks.forEach(function (line) {
      var li = document.createElement("li");
      if (icon) li.appendChild(icon.cloneNode(true));
      li.appendChild(document.createTextNode(line));
      checks.appendChild(li);
    });
  }
  document.querySelectorAll(".highlights li").forEach(function (li, i) {
    var item = (home.highlights || [])[i];
    if (!item) return;
    setText(li.querySelector("strong"), item.title);
    setText(li.querySelector("span"), item.text);
  });

  var hero = document.querySelector(".hero");
  if (hero && Array.isArray(home.slides) && home.slides.length) {
    hero.querySelectorAll(".slide").forEach(function (img) { img.remove(); });
    home.slides.forEach(function (slide, i) {
      var img = document.createElement("img");
      img.className = "slide" + (i === 0 ? " on" : "");
      img.src = slide.src;
      img.alt = slide.alt || "";
      hero.insertBefore(img, hero.firstChild);
    });
  }

  var cards = document.querySelector(".section .cards");
  if (cards && Array.isArray(site.services)) {
    cards.innerHTML = "";
    site.services.filter(function (s) { return s.home !== false; }).forEach(function (s) {
      var a = document.createElement("a");
      a.className = "card";
      a.href = s.href || "dich-vu.html";
      var img = document.createElement("img");
      img.src = s.image || "";
      img.alt = s.title || "";
      var h3 = document.createElement("h3");
      h3.textContent = s.title || "";
      a.appendChild(img);
      a.appendChild(h3);
      cards.appendChild(a);
    });
  }

  var statItems = document.querySelectorAll(".stats li");
  (home.stats || []).forEach(function (item, i) {
    var li = statItems[i];
    if (!li) return;
    var num = li.querySelector(".stat-num");
    if (!num) return;
    num.innerHTML = "";
    var b = document.createElement("b");
    b.textContent = item.value || "";
    num.appendChild(b);
    if (item.unit) {
      var small = document.createElement("small");
      small.textContent = item.unit;
      num.appendChild(small);
    }
    setText(li.querySelector("span"), item.label);
  });

  var shotH = document.querySelector(".shots h2");
  if (shotH) {
    shotH.textContent = "";
    shotH.appendChild(document.createTextNode((home.shotTitle || "") + " "));
    var shotSpan = document.createElement("span");
    shotSpan.textContent = home.shotAccent || "";
    shotH.appendChild(shotSpan);
  }
  setText(document.querySelector(".shots .shot-lead"), home.shotLead);
  var shotGrid = document.querySelector(".shot-grid");
  if (shotGrid && Array.isArray(site.photos)) {
    shotGrid.innerHTML = "";
    site.photos.slice(0, 5).forEach(function (photo, i) {
      var a = document.createElement("a");
      if (i === 0) a.className = "big";
      a.href = "hinh-anh.html";
      var img = document.createElement("img");
      img.src = photo.src || "";
      img.alt = photo.alt || "";
      a.appendChild(img);
      shotGrid.appendChild(a);
    });
  }

  var bookImg = document.querySelector(".book-card > img");
  if (bookImg && home.bookImage) {
    bookImg.src = home.bookImage;
    bookImg.alt = home.bookImageAlt || "";
  }
  var bookH = document.querySelector(".book h2");
  if (bookH) {
    bookH.textContent = "";
    bookH.appendChild(document.createTextNode((home.bookTitle || "") + " "));
    var bookSpan = document.createElement("span");
    bookSpan.textContent = home.bookAccent || "";
    bookH.appendChild(bookSpan);
  }
  setText(document.querySelector(".book .shot-lead"), home.bookLead);
  var select = document.querySelector(".book-form select");
  if (select && Array.isArray(site.services)) {
    var first = select.querySelector("option");
    select.innerHTML = "";
    if (first) select.appendChild(first);
    site.services.forEach(function (s) {
      var opt = document.createElement("option");
      opt.textContent = s.title || "";
      select.appendChild(opt);
    });
  }

  var newsH = document.querySelector(".news-home h2");
  if (newsH) {
    newsH.textContent = "";
    newsH.appendChild(document.createTextNode((home.newsTitle || "") + " "));
    var newsSpan = document.createElement("span");
    newsSpan.textContent = home.newsAccent || "";
    newsH.appendChild(newsSpan);
  }
  setText(document.querySelector(".news-home .shot-lead"), home.newsLead);
  fillNews(document.querySelector(".news-grid"), (site.news || []).filter(function (n) { return n.home !== false; }).slice(0, 3), false);
  fillNews(document.querySelector(".news-list"), site.news || [], true);

  var gallery = document.querySelector("main .gallery");
  var page = location.pathname.split("/").pop() || "index.html";
  if (gallery && page === "hinh-anh.html" && Array.isArray(site.photos)) {
    gallery.innerHTML = "";
    site.photos.forEach(function (photo) {
      var img = document.createElement("img");
      img.src = photo.src || "";
      img.alt = photo.alt || "";
      gallery.appendChild(img);
    });
  }

  if (page === "dich-vu.html" && Array.isArray(site.articles)) {
    var box = document.querySelector("main .article");
    if (box) {
      box.querySelectorAll("article").forEach(function (el) { el.remove(); });
      site.articles.forEach(function (article) {
        var node = document.createElement("article");
        if (article.id) node.id = article.id;
        var h2 = document.createElement("h2");
        h2.textContent = article.title || "";
        node.appendChild(h2);
        if (article.image) {
          var img = document.createElement("img");
          img.className = "wide";
          img.src = article.image;
          img.alt = article.title || "";
          node.appendChild(img);
        }
        var p = document.createElement("p");
        p.textContent = article.body || "";
        node.appendChild(p);
        box.appendChild(node);
      });
    }
  }

  if (page === "gioi-thieu.html" && site.about) {
    var about = document.querySelector("main .article");
    if (about) {
      var img = about.querySelector("img");
      if (img && site.about.image) img.src = site.about.image;
      about.querySelectorAll("p").forEach(function (p) { p.remove(); });
      (site.about.paragraphs || []).forEach(function (text) {
        var p = document.createElement("p");
        p.textContent = text;
        about.appendChild(p);
      });
    }
  }

  var footerName = document.querySelector(".footer-name");
  if (footerName) {
    footerName.textContent = company.name || "";
    var lines = document.querySelector(".footer-lines");
    if (lines) {
      var pin = lines.querySelector("svg");
      lines.innerHTML = "";
      var rows = [["Địa chỉ:", company.address]].concat((company.yards || []).map(function (yard) {
        var parts = String(yard).split(":");
        return [parts.shift() + ":", parts.join(":").trim()];
      }));
      rows.push(["Hotline:", [phone, company.phone2].filter(Boolean).join(" - ")]);
      rows.push(["Email:", company.email || ""]);
      rows.forEach(function (row, i) {
        var p = document.createElement("p");
        if (pin) p.appendChild(pin.cloneNode(true));
        var span = document.createElement("span");
        var strong = document.createElement("strong");
        strong.textContent = row[0];
        span.appendChild(strong);
        span.appendChild(document.createTextNode(" " + (row[1] || "")));
        p.appendChild(span);
        if (i === rows.length - 2) p.querySelector("svg").outerHTML = phoneIcon();
        if (i === rows.length - 1) p.querySelector("svg").outerHTML = mailIcon();
        lines.appendChild(p);
      });
    }
    var footServices = document.querySelector(".footer-services");
    if (footServices && Array.isArray(site.services)) {
      footServices.querySelectorAll("a").forEach(function (a) { a.remove(); });
      site.services.filter(function (s) { return s.footer !== false; }).forEach(function (s) {
        var a = document.createElement("a");
        a.href = s.href || "dich-vu.html";
        a.textContent = s.title || "";
        footServices.appendChild(a);
      });
    }
    var map = document.querySelector(".footer-map iframe");
    if (map && company.address) {
      map.src = "https://maps.google.com/maps?q=" + encodeURIComponent(company.address) + "&hl=vi&z=15&output=embed";
    }
  }

  if (page === "cho-thue-xe-cau.html" && site.crane) {
    var crane = document.querySelector("main .article");
    if (crane) {
      setText(crane.querySelector("h1"), site.crane.title);
      var paras = crane.querySelectorAll("p");
      if (paras[0]) paras[0].textContent = site.crane.lead || "";
      if (paras.length > 2) paras[paras.length - 1].textContent = site.crane.closing || "";
      var wide = crane.querySelector("img.wide");
      if (wide && site.crane.image) wide.src = site.crane.image;
      var list = crane.querySelector("ul");
      if (list) {
        list.innerHTML = "";
        (site.crane.bullets || []).forEach(function (line) {
          var li = document.createElement("li");
          li.textContent = line;
          list.appendChild(li);
        });
      }
    }
  }
  var contact = document.querySelector(".contact");
  if (contact && page === "lien-he.html") {
    var block = contact.querySelector("div");
    if (block) {
      var h1 = block.querySelector("h1");
      block.innerHTML = "";
      if (h1) block.appendChild(h1);
      addLine(block, company.name, true);
      addLine(block, "Địa chỉ: " + (company.address || ""));
      (company.yards || []).forEach(function (yard) { addLine(block, yard); });
      addLine(block, "Hotline: " + [phone, company.phone2].filter(Boolean).join(" - "));
      addLine(block, "Email: " + (company.email || ""));
    }
  }
}

function addLine(parent, text, strong) {
  var p = document.createElement("p");
  if (strong) {
    var b = document.createElement("strong");
    b.textContent = text;
    p.appendChild(b);
  } else {
    p.textContent = text;
  }
  parent.appendChild(p);
}

function fillNews(root, items, withBullets) {
  if (!root) return;
  root.innerHTML = "";
  items.forEach(function (item) {
    var a = document.createElement("a");
    a.className = root.classList.contains("news-list") ? "news-item" : "news-card";
    a.href = item.href || "tin-tuc.html";
    var img = document.createElement("img");
    img.src = item.image || "";
    img.alt = item.title || "";
    var div = document.createElement("div");
    var h3 = document.createElement("h3");
    h3.textContent = item.title || "";
    var p = document.createElement("p");
    p.textContent = item.excerpt || "";
    div.appendChild(h3);
    div.appendChild(p);
    if (withBullets && item.bullets && item.bullets.length) {
      var ul = document.createElement("ul");
      item.bullets.forEach(function (line) {
        var li = document.createElement("li");
        li.textContent = line;
        ul.appendChild(li);
      });
      div.appendChild(ul);
    }
    a.appendChild(img);
    a.appendChild(div);
    root.appendChild(a);
  });
}

function phoneIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 7a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.6 1 1 0 0 1-.25 1z"/></svg>';
}

function mailIcon() {
  return '<svg class="line" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M4 7l8 6 8-6"/></svg>';
}
