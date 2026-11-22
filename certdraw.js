/* ATHAR certificate template renderer — shared by certificate.html and the Admin preview.
   The admin uploads a design image; the participant's name, QR code and certificate ID are drawn on top.
   Positions are percentages of the image (x, y = centre of the item); sizes are % of the image width. */
(function () {
  var FONTS = {
    montserrat: "'Montserrat','Hind Siliguri',sans-serif",
    inter: "'Inter','Hind Siliguri',sans-serif",
    hind: "'Hind Siliguri','Montserrat',sans-serif",
    amiri: "'Amiri','Noto Naskh Arabic','Hind Siliguri',serif"
  };
  window.ATHAR_CERT_DEFAULT = {
    url: '',
    name: { x: 50, y: 50, size: 5, color: '#071F3D', font: 'montserrat', weight: '800', maxW: 80 },
    qr: { on: true, x: 86, y: 80, size: 11 },
    id: { on: true, x: 50, y: 95, size: 1.3, color: '#5B6472' }
  };
  window.certMergeTpl = function (t) {
    var d = window.ATHAR_CERT_DEFAULT; t = t || {};
    return {
      url: t.url || '',
      name: Object.assign({}, d.name, t.name || {}),
      qr: Object.assign({}, d.qr, t.qr || {}),
      id: Object.assign({}, d.id, t.id || {})
    };
  };
  window.loadCertImage = function (url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('Template image could not be loaded')); };
      img.src = url;
    });
  };
  /* Reads a chosen image file and shrinks it until it fits in one Firestore field (about 900 KB).
     Returns { dataUrl, w, h } — no third-party host is needed, so there are no CORS problems. */
  window.fileToCertDataUrl = function (file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onerror = function () { reject(new Error('Could not read the file')); };
      fr.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('This file is not a valid image')); };
        img.onload = function () {
          var widths = [2000, 1800, 1600, 1400, 1200, 1000], quals = [0.92, 0.85, 0.78, 0.7, 0.6];
          for (var wi = 0; wi < widths.length; wi++) {
            var w = Math.min(img.naturalWidth, widths[wi]), h = Math.round(img.naturalHeight * (w / img.naturalWidth));
            var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
            var cx = cv.getContext('2d'); cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0, w, h);
            for (var qi = 0; qi < quals.length; qi++) {
              var d = cv.toDataURL('image/jpeg', quals[qi]);
              if (d.length <= 900000) { resolve({ dataUrl: d, w: w, h: h }); return; }
            }
          }
          reject(new Error('The image is too detailed to store. Please use a smaller or simpler image.'));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  };
  async function ensureFont(weight, family, text) {
    try { if (document.fonts && document.fonts.load) { await document.fonts.load(weight + ' 40px ' + family, text || 'Ab'); } } catch (e) {}
  }
  /* data: { name, certId, verifyUrl } → returns true when drawn */
  window.drawCertTemplate = async function (canvas, img, tpl, data) {
    tpl = window.certMergeTpl(tpl);
    var scale = Math.min(1, 2400 / img.naturalWidth);
    var W = Math.round(img.naturalWidth * scale), H = Math.round(img.naturalHeight * scale);
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);

    // Name
    var n = tpl.name, fam = FONTS[n.font] || FONTS.montserrat, name = (data.name || '').trim();
    if (name) {
      await ensureFont(n.weight || '800', fam, name);
      var size = (n.size / 100) * W, maxW = ((n.maxW || 80) / 100) * W;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = n.color || '#071F3D';
      do { ctx.font = (n.weight || '800') + ' ' + size + 'px ' + fam; if (ctx.measureText(name).width <= maxW) break; size -= 2; } while (size > 12);
      ctx.fillText(name, (n.x / 100) * W, (n.y / 100) * H);
    }

    // QR code (verification)
    if (tpl.qr.on && data.verifyUrl && window.ATHARQR) {
      var m = window.ATHARQR.matrix(data.verifyUrl), cnt = m.length;
      var target = (tpl.qr.size / 100) * W, cell = Math.max(1, Math.floor(target / (cnt + 2))), qs = cell * cnt, pad = cell;
      var qx = Math.round((tpl.qr.x / 100) * W - qs / 2), qy = Math.round((tpl.qr.y / 100) * H - qs / 2);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(qx - pad, qy - pad, qs + pad * 2, qs + pad * 2);
      ctx.fillStyle = '#071F3D';
      for (var r = 0; r < cnt; r++) for (var c = 0; c < cnt; c++) { if (m[r][c]) ctx.fillRect(qx + c * cell, qy + r * cell, cell, cell); }
    }

    // Certificate ID text
    if (tpl.id.on && data.certId) {
      var isz = (tpl.id.size / 100) * W;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = tpl.id.color || '#5B6472';
      ctx.font = '600 ' + isz + "px 'Inter',sans-serif";
      ctx.fillText('Certificate ID: ' + data.certId, (tpl.id.x / 100) * W, (tpl.id.y / 100) * H);
    }
    return true;
  };
})();
