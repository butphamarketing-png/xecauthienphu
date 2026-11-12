(function () {
  var site = null;
  var tab = "company";
  var tabs = [
    ["company", "Công ty"],
    ["home", "Trang chủ"],
    ["services", "Dịch vụ"],
    ["articles", "Trang dịch vụ"],
    ["photos", "Hình ảnh"],
    ["news", "Tin tức"],
    ["about", "Giới thiệu"],
    ["crane", "Xe cẩu"],
    ["leads", "Yêu cầu khách"]
  ];

  var login = document.getElementById("login");
  var app = document.getElementById("app");
  var main = document.getElementById("main");
  var side = document.getElementById("side");

  document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(e.target);
    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: data.get("user"), password: data.get("password") })
    }).then(function (res) {
      if (!res.ok) throw new Error("fail");
      openApp();
    }).catch(function () {
      document.getElementById("login-err").textContent = "Sai tài khoản hoặc mật khẩu.";
    });
  });

  document.getElementById("logout").addEventListener("click", function () {
    fetch("/api/logout", { method: "POST" }).then(function () { location.reload(); });
  });
  document.getElementById("save").addEventListener("click", saveSite);

  fetch("/api/me").then(function (res) { return res.json(); }).then(function (data) {
    if (data.ok) openApp();
  });

  function openApp() {
    login.hidden = true;
    app.hidden = false;
    fetch("/api/site").then(function (res) { return res.json(); }).then(function (data) {
      site = data;
      renderSide();
      render();
    });
  }

  function renderSide() {
    side.innerHTML = "";
    tabs.forEach(function (item) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = item[1];
      btn.className = item[0] === tab ? "on" : "";
      btn.addEventListener("click", function () {
        tab = item[0];
        renderSide();
        render();
      });
      side.appendChild(btn);
    });
  }

  function render() {
    main.innerHTML = "";
    if (tab === "company") companyTab();
    if (tab === "home") homeTab();
    if (tab === "services") servicesTab();
    if (tab === "articles") articlesTab();
    if (tab === "photos") photosTab();
    if (tab === "news") newsTab();
    if (tab === "about") aboutTab();
    if (tab === "crane") craneTab();
    if (tab === "leads") leadsTab();
  }

  function card(title) {
    var box = document.createElement("section");
    box.className = "card";
    if (title) {
      var h2 = document.createElement("h2");
      h2.textContent = title;
      box.appendChild(h2);
    }
    main.appendChild(box);
    return box;
  }

  function field(parent, label, obj, key, area) {
    var lab = document.createElement("label");
    lab.textContent = label;
    var input = document.createElement(area ? "textarea" : "input");
    input.value = obj[key] || "";
    input.addEventListener("input", function () { obj[key] = input.value; });
    lab.appendChild(input);
    parent.appendChild(lab);
    return input;
  }

  function imageField(parent, label, obj, key) {
    var lab = document.createElement("label");
    lab.textContent = label;
    var wrap = document.createElement("div");
    wrap.className = "img-field";
    var input = document.createElement("input");
    input.value = obj[key] || "";
    input.placeholder = "Dán link ảnh hoặc tải file";
    input.addEventListener("input", function () { obj[key] = input.value; });
    var file = document.createElement("input");
    file.type = "file";
    file.accept = "image/png,image/jpeg,image/webp,image/gif";
    file.addEventListener("change", function () {
      var chosen = file.files && file.files[0];
      if (!chosen) return;
      var reader = new FileReader();
      reader.onload = function () {
        fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: reader.result })
        }).then(function (res) { return res.json(); }).then(function (data) {
          if (!data.url) throw new Error(data.error || "upload");
          obj[key] = data.url;
          input.value = data.url;
        }).catch(function () { alert("Không tải được ảnh. Ảnh tối đa 3MB."); });
      };
      reader.readAsDataURL(chosen);
    });
    wrap.appendChild(input);
    wrap.appendChild(file);
    lab.appendChild(wrap);
    parent.appendChild(lab);
  }

  function check(parent, label, obj, key) {
    var lab = document.createElement("label");
    lab.className = "check";
    var input = document.createElement("input");
    input.type = "checkbox";
    input.checked = obj[key] !== false;
    input.addEventListener("change", function () { obj[key] = input.checked; });
    lab.appendChild(input);
    lab.appendChild(document.createTextNode(label));
    parent.appendChild(lab);
  }

  function listButtons(parent, list, index) {
    var bar = document.createElement("div");
    bar.className = "actions";
    button(bar, "Lên", function () { move(list, index, -1); });
    button(bar, "Xuống", function () { move(list, index, 1); });
    button(bar, "Xóa", function () { list.splice(index, 1); render(); });
    parent.appendChild(bar);
  }

  function button(parent, text, fn, ghost) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn small" + (ghost ? " ghost" : "");
    btn.textContent = text;
    btn.addEventListener("click", fn);
    parent.appendChild(btn);
    return btn;
  }

  function move(list, index, dir) {
    var next = index + dir;
    if (next < 0 || next >= list.length) return;
    var item = list.splice(index, 1)[0];
    list.splice(next, 0, item);
    render();
  }

  function lines(parent, label, list) {
    var box = card(label);
    list.forEach(function (line, i) {
      var input = document.createElement("input");
      input.value = line;
      input.addEventListener("input", function () { list[i] = input.value; });
      box.appendChild(input);
    });
    button(box, "Thêm dòng", function () { list.push(""); render(); }, true);
  }

  function companyTab() {
    var c = site.company;
    var box = card("Thông tin công ty");
    field(box, "Tên công ty", c, "name");
    field(box, "Địa chỉ", c, "address");
    field(box, "Hotline chính", c, "phone");
    field(box, "Hotline phụ", c, "phone2");
    field(box, "Email", c, "email");
    field(box, "Website", c, "website");
    field(box, "Số Zalo", c, "zalo");
    field(box, "Dòng chữ chạy", c, "ticker", true);
    field(box, "Dòng cuối trang", c, "tagline");
    imageField(box, "Logo", c, "logo");
    imageField(box, "Ảnh chữ thương hiệu", c, "wordmark");
    var yards = card("Bãi xe");
    c.yards.forEach(function (yard, i) {
      var input = document.createElement("input");
      input.value = yard;
      input.addEventListener("input", function () { c.yards[i] = input.value; });
      yards.appendChild(input);
    });
    button(yards, "Thêm bãi xe", function () { c.yards.push("Bãi xe: "); render(); }, true);
    var pass = card("Đổi mật khẩu quản trị");
    var input = document.createElement("input");
    input.type = "password";
    input.placeholder = "Mật khẩu mới, tối thiểu 6 ký tự";
    pass.appendChild(input);
    button(pass, "Đổi mật khẩu", function () {
      fetch("/api/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input.value })
      }).then(function (res) {
        if (!res.ok) throw new Error("fail");
        input.value = "";
        alert("Đã đổi mật khẩu.");
      }).catch(function () { alert("Chưa đổi được. Mật khẩu cần ít nhất 6 ký tự."); });
    });
  }

  function homeTab() {
    var h = site.home;
    var box = card("Giới thiệu");
    field(box, "Tiêu đề", h, "introTitle");
    field(box, "Chữ đỏ", h, "introAccent");
    field(box, "Nội dung", h, "introText", true);
    imageField(box, "Ảnh giới thiệu", h, "introImage");
    lines(main, "Bốn ý ngắn", h.checks);
    var hi = card("Bốn điểm nổi bật");
    h.highlights.forEach(function (item) {
      var block = document.createElement("div");
      block.className = "item";
      field(block, "Tiêu đề", item, "title");
      field(block, "Mô tả", item, "text");
      hi.appendChild(block);
    });
    var stats = card("Con số");
    h.stats.forEach(function (item) {
      var block = document.createElement("div");
      block.className = "row";
      field(block, "Số", item, "value");
      field(block, "Đơn vị", item, "unit");
      field(block, "Nhãn", item, "label");
      stats.appendChild(block);
    });
    var slides = card("Ảnh đầu trang");
    h.slides.forEach(function (item, i) {
      var block = document.createElement("div");
      block.className = "item";
      imageField(block, "Ảnh", item, "src");
      field(block, "Mô tả ảnh", item, "alt");
      listButtons(block, h.slides, i);
      slides.appendChild(block);
    });
    button(slides, "Thêm ảnh đầu trang", function () {
      h.slides.push({ src: "", alt: "" });
      render();
    }, true);
    var rest = card("Khối hình, đặt hẹn, tin");
    field(rest, "Tiêu đề hình ảnh", h, "shotTitle");
    field(rest, "Chữ đỏ hình ảnh", h, "shotAccent");
    field(rest, "Dòng dẫn hình ảnh", h, "shotLead");
    imageField(rest, "Ảnh đặt hẹn", h, "bookImage");
    field(rest, "Tiêu đề đặt hẹn", h, "bookTitle");
    field(rest, "Chữ đỏ đặt hẹn", h, "bookAccent");
    field(rest, "Dòng dẫn đặt hẹn", h, "bookLead", true);
    field(rest, "Tiêu đề tin", h, "newsTitle");
    field(rest, "Chữ đỏ tin", h, "newsAccent");
    field(rest, "Dòng dẫn tin", h, "newsLead");
  }

  function servicesTab() {
    var box = card("Dịch vụ trên trang chủ và chân trang");
    site.services.forEach(function (item, i) {
      var block = document.createElement("div");
      block.className = "item";
      field(block, "Tên dịch vụ", item, "title");
      field(block, "Link", item, "href");
      imageField(block, "Ảnh", item, "image");
      check(block, "Hiện trên trang chủ", item, "home");
      check(block, "Hiện ở chân trang", item, "footer");
      listButtons(block, site.services, i);
      box.appendChild(block);
    });
    button(box, "Thêm dịch vụ", function () {
      site.services.push({ title: "Dịch vụ mới", href: "dich-vu.html", image: "", home: true, footer: true });
      render();
    }, true);
  }

  function articlesTab() {
    var box = card("Nội dung trang Dịch vụ");
    site.articles.forEach(function (item, i) {
      var block = document.createElement("div");
      block.className = "item";
      field(block, "Mã neo, ví dụ nang-cau", item, "id");
      field(block, "Tiêu đề", item, "title");
      imageField(block, "Ảnh", item, "image");
      field(block, "Nội dung", item, "body", true);
      listButtons(block, site.articles, i);
      box.appendChild(block);
    });
    button(box, "Thêm bài", function () {
      site.articles.push({ id: "bai-moi", title: "Bài mới", image: "", body: "" });
      render();
    }, true);
  }

  function photosTab() {
    var box = card("Album hình ảnh");
    site.photos.forEach(function (item, i) {
      var block = document.createElement("div");
      block.className = "item";
      imageField(block, "Ảnh", item, "src");
      field(block, "Mô tả", item, "alt");
      listButtons(block, site.photos, i);
      box.appendChild(block);
    });
    button(box, "Thêm ảnh", function () {
      site.photos.push({ src: "", alt: "" });
      render();
    }, true);
  }

  function newsTab() {
    var box = card("Tin tức và kinh nghiệm");
    site.news.forEach(function (item, i) {
      var block = document.createElement("div");
      block.className = "item";
      field(block, "Tiêu đề", item, "title");
      field(block, "Tóm tắt", item, "excerpt", true);
      field(block, "Link", item, "href");
      imageField(block, "Ảnh", item, "image");
      var bulletLabel = document.createElement("label");
      bulletLabel.textContent = "Các gạch đầu dòng, mỗi ý một dòng";
      var bullets = document.createElement("textarea");
      bullets.value = (item.bullets || []).join("\n");
      bullets.addEventListener("input", function () {
        item.bullets = bullets.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      });
      bulletLabel.appendChild(bullets);
      block.appendChild(bulletLabel);
      check(block, "Hiện 3 tin đầu trang chủ", item, "home");
      listButtons(block, site.news, i);
      box.appendChild(block);
    });
    button(box, "Thêm tin", function () {
      site.news.push({ title: "Tin mới", excerpt: "", image: "", href: "tin-tuc.html", home: false, bullets: [] });
      render();
    }, true);
  }

  function aboutTab() {
    var box = card("Trang giới thiệu");
    imageField(box, "Ảnh", site.about, "image");
    site.about.paragraphs.forEach(function (line, i) {
      var area = document.createElement("textarea");
      area.value = line;
      area.addEventListener("input", function () { site.about.paragraphs[i] = area.value; });
      box.appendChild(area);
    });
    button(box, "Thêm đoạn", function () { site.about.paragraphs.push(""); render(); }, true);
  }

  function craneTab() {
    var c = site.crane;
    var box = card("Trang cho thuê xe cẩu");
    field(box, "Tiêu đề", c, "title");
    field(box, "Đoạn mở đầu", c, "lead", true);
    imageField(box, "Ảnh lớn", c, "image");
    field(box, "Đoạn kết", c, "closing", true);
    lines(main, "Danh sách hạng mục", c.bullets);
  }

  function leadsTab() {
    var box = card("Yêu cầu đặt hẹn và liên hệ");
    fetch("/api/leads").then(function (res) { return res.json(); }).then(function (leads) {
      if (!leads.length) {
        var p = document.createElement("p");
        p.textContent = "Chưa có yêu cầu.";
        box.appendChild(p);
        return;
      }
      var table = document.createElement("table");
      table.innerHTML = "<tr><th>Thời gian</th><th>Khách</th><th>Nội dung</th><th></th></tr>";
      leads.forEach(function (lead) {
        var tr = document.createElement("tr");
        tr.innerHTML = "<td></td><td></td><td></td><td></td>";
        tr.children[0].textContent = new Date(lead.at).toLocaleString("vi-VN");
        tr.children[1].textContent = lead.ten + "\n" + lead.sdt;
        tr.children[2].textContent = (lead.dv ? lead.dv + "\n" : "") + (lead.nd || "");
        button(tr.children[3], "Xóa", function () {
          fetch("/api/leads/" + encodeURIComponent(lead.id), { method: "DELETE" }).then(render);
        }, true);
        table.appendChild(tr);
      });
      box.appendChild(table);
    });
  }

  function saveSite() {
    site.news.forEach(function (item) {
      if (typeof item.bulletsText === "string") delete item.bulletsText;
    });
    fetch("/api/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(site)
    }).then(function (res) {
      if (!res.ok) throw new Error("fail");
      var note = document.createElement("p");
      note.className = "ok";
      note.textContent = "Đã lưu. Mở lại trang website để xem nội dung mới.";
      main.prepend(note);
    }).catch(function () { alert("Chưa lưu được."); });
  }
})();
