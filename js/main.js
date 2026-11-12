(function () {
  var ready = window.TP_READY || Promise.resolve();
  ready.then(start);

  function start() {
    var burger = document.querySelector(".burger");
    var nav = document.querySelector(".nav");
    if (burger && nav) {
      burger.addEventListener("click", function () {
        nav.classList.toggle("open");
      });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
    if (slides.length) {
      var i = 0;
      function show(n) {
        i = (n + slides.length) % slides.length;
        slides.forEach(function (el, idx) { el.classList.toggle("on", idx === i); });
      }
      var prev = document.querySelector(".hero .prev");
      var next = document.querySelector(".hero .next");
      if (prev) prev.addEventListener("click", function () { show(i - 1); });
      if (next) next.addEventListener("click", function () { show(i + 1); });
      setInterval(function () { show(i + 1); }, 5000);
    }

    var form = document.querySelector("form.form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var note = form.querySelector(".note");
        var payload = {
          ten: form.ten ? form.ten.value : "",
          sdt: form.sdt ? form.sdt.value : "",
          dv: form.dv ? form.dv.value : "",
          nd: form.nd ? form.nd.value : ""
        };
        fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).then(function (res) {
          if (!res.ok) throw new Error("fail");
          if (note) {
            note.hidden = false;
            note.textContent = "Đã nhận yêu cầu. Gọi 0908.685.815 nếu cần xe gấp.";
          }
          form.reset();
        }).catch(function () {
          if (note) {
            note.hidden = false;
            note.textContent = "Chưa gửi được. Gọi 0908.685.815 để giữ xe.";
          }
        });
      });
    }

    var stats = document.querySelector(".stats");
    if (stats && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var items = Array.prototype.slice.call(stats.querySelectorAll(".stat-num b")).map(function (el) {
        var raw = el.textContent.trim();
        if (raw.indexOf("/") !== -1) return { el: el, kind: "pair", to: parseInt(raw, 10) };
        return {
          el: el,
          kind: raw.indexOf("+") !== -1 ? "plus" : raw.indexOf("%") !== -1 ? "pct" : "num",
          to: parseInt(raw, 10)
        };
      });
      function paint(p) {
        items.forEach(function (item) {
          var n = p >= 1 ? item.to : Math.max(1, Math.round(item.to * p));
          if (item.kind === "pair") item.el.textContent = n + "/" + n;
          else if (item.kind === "plus") item.el.textContent = n + "+";
          else if (item.kind === "pct") item.el.textContent = n + "%";
          else item.el.textContent = String(n);
        });
      }
      function run() {
        var start = performance.now();
        paint(0);
        function frame() {
          var p = Math.min(1, (performance.now() - start) / 1400);
          paint(1 - Math.pow(1 - p, 3));
          if (p < 1) setTimeout(frame, 16);
        }
        setTimeout(frame, 16);
      }
      var seen = false;
      function inView() {
        var box = stats.getBoundingClientRect();
        return box.top < window.innerHeight * 0.9 && box.bottom > 40;
      }
      function check() {
        if (seen || !inView()) return;
        seen = true;
        window.removeEventListener("scroll", check);
        run();
      }
      window.addEventListener("scroll", check, { passive: true });
      check();
    }
  }
})();
