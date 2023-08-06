// Author: Felucia
export function userColor(name) {
  let MD5 = function (f) {
    function i(b, c) {
      var d, e, f, g, h;
      f = b & 2147483648;
      g = c & 2147483648;
      d = b & 1073741824;
      e = c & 1073741824;
      h = (b & 1073741823) + (c & 1073741823);
      return d & e
        ? h ^ 2147483648 ^ f ^ g
        : d | e
        ? h & 1073741824
          ? h ^ 3221225472 ^ f ^ g
          : h ^ 1073741824 ^ f ^ g
        : h ^ f ^ g;
    }

    function j(b, c, d, e, f, g, h) {
      b = i(b, i(i((c & d) | (~c & e), f), h));
      return i((b << g) | (b >>> (32 - g)), c);
    }

    function k(b, c, d, e, f, g, h) {
      b = i(b, i(i((c & e) | (d & ~e), f), h));
      return i((b << g) | (b >>> (32 - g)), c);
    }

    function l(b, c, e, d, f, g, h) {
      b = i(b, i(i(c ^ e ^ d, f), h));
      return i((b << g) | (b >>> (32 - g)), c);
    }

    function m(b, c, e, d, f, g, h) {
      b = i(b, i(i(e ^ (c | ~d), f), h));
      return i((b << g) | (b >>> (32 - g)), c);
    }

    function n(b) {
      var c = "",
        e = "",
        d;
      for (d = 0; d <= 3; d++)
        (e = (b >>> (d * 8)) & 255),
          (e = "0" + e.toString(16)),
          (c += e.substr(e.length - 2, 2));
      return c;
    }
    var g = [],
      o,
      p,
      q,
      r,
      b,
      c,
      d,
      e,
      f = (function (b) {
        for (
          var b = b.replace(/\r\n/g, "\n"), c = "", e = 0;
          e < b.length;
          e++
        ) {
          var d = b.charCodeAt(e);
          d < 128
            ? (c += String.fromCharCode(d))
            : (d > 127 && d < 2048
                ? (c += String.fromCharCode((d >> 6) | 192))
                : ((c += String.fromCharCode((d >> 12) | 224)),
                  (c += String.fromCharCode(((d >> 6) & 63) | 128))),
              (c += String.fromCharCode((d & 63) | 128)));
        }
        return c;
      })(f),
      g = (function (b) {
        var c,
          d = b.length;
        c = d + 8;
        for (
          var e = ((c - (c % 64)) / 64 + 1) * 16,
            f = Array(e - 1),
            g = 0,
            h = 0;
          h < d;

        )
          (c = (h - (h % 4)) / 4),
            (g = (h % 4) * 8),
            (f[c] |= b.charCodeAt(h) << g),
            h++;
        f[(h - (h % 4)) / 4] |= 128 << ((h % 4) * 8);
        f[e - 2] = d << 3;
        f[e - 1] = d >>> 29;
        return f;
      })(f);
    b = 1732584193;
    c = 4023233417;
    d = 2562383102;
    e = 271733878;
    for (f = 0; f < g.length; f += 16)
      (o = b),
        (p = c),
        (q = d),
        (r = e),
        (b = j(b, c, d, e, g[f + 0], 7, 3614090360)),
        (e = j(e, b, c, d, g[f + 1], 12, 3905402710)),
        (d = j(d, e, b, c, g[f + 2], 17, 606105819)),
        (c = j(c, d, e, b, g[f + 3], 22, 3250441966)),
        (b = j(b, c, d, e, g[f + 4], 7, 4118548399)),
        (e = j(e, b, c, d, g[f + 5], 12, 1200080426)),
        (d = j(d, e, b, c, g[f + 6], 17, 2821735955)),
        (c = j(c, d, e, b, g[f + 7], 22, 4249261313)),
        (b = j(b, c, d, e, g[f + 8], 7, 1770035416)),
        (e = j(e, b, c, d, g[f + 9], 12, 2336552879)),
        (d = j(d, e, b, c, g[f + 10], 17, 4294925233)),
        (c = j(c, d, e, b, g[f + 11], 22, 2304563134)),
        (b = j(b, c, d, e, g[f + 12], 7, 1804603682)),
        (e = j(e, b, c, d, g[f + 13], 12, 4254626195)),
        (d = j(d, e, b, c, g[f + 14], 17, 2792965006)),
        (c = j(c, d, e, b, g[f + 15], 22, 1236535329)),
        (b = k(b, c, d, e, g[f + 1], 5, 4129170786)),
        (e = k(e, b, c, d, g[f + 6], 9, 3225465664)),
        (d = k(d, e, b, c, g[f + 11], 14, 643717713)),
        (c = k(c, d, e, b, g[f + 0], 20, 3921069994)),
        (b = k(b, c, d, e, g[f + 5], 5, 3593408605)),
        (e = k(e, b, c, d, g[f + 10], 9, 38016083)),
        (d = k(d, e, b, c, g[f + 15], 14, 3634488961)),
        (c = k(c, d, e, b, g[f + 4], 20, 3889429448)),
        (b = k(b, c, d, e, g[f + 9], 5, 568446438)),
        (e = k(e, b, c, d, g[f + 14], 9, 3275163606)),
        (d = k(d, e, b, c, g[f + 3], 14, 4107603335)),
        (c = k(c, d, e, b, g[f + 8], 20, 1163531501)),
        (b = k(b, c, d, e, g[f + 13], 5, 2850285829)),
        (e = k(e, b, c, d, g[f + 2], 9, 4243563512)),
        (d = k(d, e, b, c, g[f + 7], 14, 1735328473)),
        (c = k(c, d, e, b, g[f + 12], 20, 2368359562)),
        (b = l(b, c, d, e, g[f + 5], 4, 4294588738)),
        (e = l(e, b, c, d, g[f + 8], 11, 2272392833)),
        (d = l(d, e, b, c, g[f + 11], 16, 1839030562)),
        (c = l(c, d, e, b, g[f + 14], 23, 4259657740)),
        (b = l(b, c, d, e, g[f + 1], 4, 2763975236)),
        (e = l(e, b, c, d, g[f + 4], 11, 1272893353)),
        (d = l(d, e, b, c, g[f + 7], 16, 4139469664)),
        (c = l(c, d, e, b, g[f + 10], 23, 3200236656)),
        (b = l(b, c, d, e, g[f + 13], 4, 681279174)),
        (e = l(e, b, c, d, g[f + 0], 11, 3936430074)),
        (d = l(d, e, b, c, g[f + 3], 16, 3572445317)),
        (c = l(c, d, e, b, g[f + 6], 23, 76029189)),
        (b = l(b, c, d, e, g[f + 9], 4, 3654602809)),
        (e = l(e, b, c, d, g[f + 12], 11, 3873151461)),
        (d = l(d, e, b, c, g[f + 15], 16, 530742520)),
        (c = l(c, d, e, b, g[f + 2], 23, 3299628645)),
        (b = m(b, c, d, e, g[f + 0], 6, 4096336452)),
        (e = m(e, b, c, d, g[f + 7], 10, 1126891415)),
        (d = m(d, e, b, c, g[f + 14], 15, 2878612391)),
        (c = m(c, d, e, b, g[f + 5], 21, 4237533241)),
        (b = m(b, c, d, e, g[f + 12], 6, 1700485571)),
        (e = m(e, b, c, d, g[f + 3], 10, 2399980690)),
        (d = m(d, e, b, c, g[f + 10], 15, 4293915773)),
        (c = m(c, d, e, b, g[f + 1], 21, 2240044497)),
        (b = m(b, c, d, e, g[f + 8], 6, 1873313359)),
        (e = m(e, b, c, d, g[f + 15], 10, 4264355552)),
        (d = m(d, e, b, c, g[f + 6], 15, 2734768916)),
        (c = m(c, d, e, b, g[f + 13], 21, 1309151649)),
        (b = m(b, c, d, e, g[f + 4], 6, 4149444226)),
        (e = m(e, b, c, d, g[f + 11], 10, 3174756917)),
        (d = m(d, e, b, c, g[f + 2], 15, 718787259)),
        (c = m(c, d, e, b, g[f + 9], 21, 3951481745)),
        (b = i(b, o)),
        (c = i(c, p)),
        (d = i(d, q)),
        (e = i(e, r));
    return (n(b) + n(c) + n(d) + n(e)).toLowerCase();
  };
  // This MD5 function was directly taken from the PS client source code.
  function hslToRgb(h, s, l) {
    var r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
  // I probably wrote this hslToRgb one myself though
  function converter(h, s, l) {
    var r, g, b;

    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    r = Math.round(r * 255).toString(16);
    g = Math.round(g * 255).toString(16);
    b = Math.round(b * 255).toString(16);

    if (r.length != 2) {
      r = "0" + r;
    }
    if (g.length != 2) {
      g = "0" + g;
    }
    if (b.length != 2) {
      b = "0" + b;
    }
    return [r, g, b];
  }

  let colorCache = {};

  function hashColor(name) {
    if (colorCache[name]) return colorCache[name];
    var hash;
    hash = MD5(name);
    var H = parseInt(hash.substr(4, 4), 16) % 360; // 0 to 360
    var S = (parseInt(hash.substr(0, 4), 16) % 50) + 40; // 40 to 89
    var L = Math.floor((parseInt(hash.substr(8, 4), 16) % 20) + 30); // 30 to 49

    var C = ((100 - Math.abs(2 * L - 100)) * S) / 100 / 100;
    var X = C * (1 - Math.abs(((H / 60) % 2) - 1));
    var m = L / 100 - C / 2;

    var R1, G1, B1;
    switch (Math.floor(H / 60)) {
      case 1:
        R1 = X;
        G1 = C;
        B1 = 0;
        break;
      case 2:
        R1 = 0;
        G1 = C;
        B1 = X;
        break;
      case 3:
        R1 = 0;
        G1 = X;
        B1 = C;
        break;
      case 4:
        R1 = X;
        G1 = 0;
        B1 = C;
        break;
      case 5:
        R1 = C;
        G1 = 0;
        B1 = X;
        break;
      case 0:
        R1 = C;
        G1 = X;
        B1 = 0;
        break;
      default:
        R1 = C;
        G1 = X;
        B1 = 0;
        break;
    }
    var R = R1 + m,
      G = G1 + m,
      B = B1 + m;
    var lum = R * R * R * 0.2126 + G * G * G * 0.7152 + B * B * B * 0.0722; // 0.013 (dark blue) to 0.737 (yellow)

    var HLmod = (lum - 0.2) * -150; // -80 (yellow) to 28 (dark blue)
    if (HLmod > 18) HLmod = (HLmod - 18) * 2.5;
    else if (HLmod < 0) HLmod = (HLmod - 0) / 3;
    else HLmod = 0;
    // var mod = ';border-right: ' + Math.abs(HLmod) + 'px solid ' + (HLmod > 0 ? 'red' : '#0088FF');
    var Hdist = Math.min(Math.abs(180 - H), Math.abs(240 - H));
    if (Hdist < 15) {
      HLmod += (15 - Hdist) / 3;
    }

    L += HLmod;

    colorCache[name] = [H, S, L];
    return colorCache[name];
  }

  let toId = function (ting) {
    return ("" + ting).toLowerCase().replace(/[^a-z0-9]+/g, "");
  };

  let color = hashColor(toId(name));
  let a = "#";
  let c = converter(color[0] / 360, color[1] / 100, color[2] / 100);

  for (let i in c) {
    a += c[i].toString(16).toUpperCase();
  }
  return a;
}
