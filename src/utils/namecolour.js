import axios from "axios";
import { toID } from "@/utils/generic";

// Author: Felucia
function userColorHash(name) {
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
        ? h & 1073741824 ? h ^ 3221225472 ^ f ^ g : h ^ 1073741824 ^ f ^ g
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
      for (d = 0; d <= 3; d++) {
        (e = (b >>> (d * 8)) & 255),
          (e = "0" + e.toString(16)),
          (c += e.substr(e.length - 2, 2));
      }
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
        ) {
          (c = (h - (h % 4)) / 4),
            (g = (h % 4) * 8),
            (f[c] |= b.charCodeAt(h) << g),
            h++;
        }
        f[(h - (h % 4)) / 4] |= 128 << ((h % 4) * 8);
        f[e - 2] = d << 3;
        f[e - 1] = d >>> 29;
        return f;
      })(f);
    b = 1732584193;
    c = 4023233417;
    d = 2562383102;
    e = 271733878;
    for (f = 0; f < g.length; f += 16) {
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
    }
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

export let loadedCustomColors = false
export let customColors = {
	'theimmortal': 'taco',
	'bmelts': 'testmelts',
	'jumpluff': 'zacchaeus',
	'zacchaeus': 'jumpluff',
	'kraw': 'kraw1',
	'growlithe': 'steamroll',
	'snowflakes': 'endedinariot',
	'doomvendingmachine': 'theimmortal',
	'mikel': 'mikkel',
	'arcticblast': 'rsem',
	'mjb': 'thefourthchaser',
	'thefourthchaser': 'mjb',
	'tfc': 'mjb',
	'mikedecishere': 'mikedec3boobs',
	'heartsonfire': 'haatsuonfaiyaa',
	'royalty': 'wonder9',
	'limi': 'azure2',
	'ginganinja': 'piratesandninjas',
	'aurora': 'c6n6fek',
	'jdarden': 'danielcross',
	'solace': 'amorlan',
	'dcae': 'galvatron',
	'queenofrandoms': 'hahaqor',
	'jelandee': 'thejelandee',
	'diatom': 'dledledlewhooop',
	'texascloverleaf': 'aggronsmash',
	'treecko': 'treecko56',
	'violatic': 'violatic92',
	'exeggutor': 'ironmanatee',
	'ironmanatee': 'exeggutor',
	'skylight': 'aerithass',
	'nekonay': 'catbot20',
	'coronis': 'kowonis',
	'vaxter': 'anvaxter',
	'mattl': 'mattl34',
	'shaymin': 'test33',
	'kayo': 'endedinariot',
	'tgmd': 'greatmightydoom',
	'vacate': 'vacatetest',
	'bean': 'dragonbean',
	'yunan': 'osiris13',
	'politoed': 'brosb4hoohs',
	'scotteh': 'nsyncluvr67',
	'bumbadadabum': 'styrofoamboots',
	'yuihirasawa': 'weeabookiller',
	'monohearted': 'nighthearted',
	'prem': 'erinanakiri',
	'clefairy': 'fuckes',
	'morfent': 'aaaa',
	'crobat': 'supergaycrobat4',
	'beowulf': '298789z7z',
	'flippy': 'flippo',
	'raoulsteve247': 'raoulbuildingpc',
	'thedeceiver': 'colourtest011',
	'darnell': 'ggggggg',
	'shamethat': 'qpwkfklkjpskllj',
	'aipom': 'wdsddsdadas',
	'alter': 'spakling',
	'biggie': 'aoedoedad',
	'osiris': 'osiris12',
	'azumarill': 'azumarill69',
	'redew': 'redeww',
	'sapphire': 'masquerains',
	'calyxium': 'calyxium142',
	'kiracookie': 'kracookie',
	'blitz': 'hikaruhitachii',
	'skitty': 'shckieei',
	'sweep': 'jgjjfgdfg',
	'panpawn': 'crowt',
	'val': 'pleasegivemecolorr',
	'valentine': 'pleasegivemecolorr',
	'briayan': 'haxorusxi',
	'xzern': 'mintycolors',
	'shgeldz': 'cactusl00ver',
	'abra': 'lunchawaits',
	'maomiraen': 'aaaaaa',
	'trickster': 'sunako',
	'articuno': 'bluekitteh177',
	'barton': 'hollywood15',
	'zodiax': '5olanto4',
	'ninetynine': 'blackkkk',
	'kasumi': 'scooter4000',
	'xylen': 'bloodyrevengebr',
	'aelita': 'y34co3',
	'fx': 'cm48ubpq',
	'horyzhnz': 'superguy69',
	'quarkz': 'quarkz345',
	'fleurdyleurse': 'calvaryfishes',
	'trinitrotoluene': '4qpr7pc5mb',
	'yuno': 'qgadlu6g',
	'austin': 'jkjkjkjkjkgdl',
	'jinofthegale': 'cainvelasquez',
	'waterbomb': 'naninan',
	'starbloom': 'taigaaisaka',
	'macle': 'flogged',
	'ashiemore': 'poncp',
	'charles': 'charlescarmichael',
	'sigilyph': 'diving',
	'spy': 'spydreigon',
	'kinguu': 'dodmen',
	'dodmen': 'kinguu',
	'magnemite': 'dsfsdffs',
	'ace': 'sigilyph143',
	'leftiez': 'xxxxnbbhiojll',
	'grim': 'grimoiregod',
	'strength': '0v0tqpnu',
	'honchkrow': 'nsyncluvr67',
	'quote': '64z7i',
	'snow': 'q21yzqgh',
	'omegaxis': 'omegaxis14',
	'paradise': 'rnxvzwpwtz',
	'sailorcosmos': 'goldmedalpas',
	'dontlose': 'dhcli22h',
	'tatsumaki': 'developmentary',
	'starry': 'starryblanket',
	'imas': 'imas234',
	'vexeniv': 'vexenx',
	'ayanosredscarf': 'ezichqog',
	'penquin': 'privatepenquin',
	'mraldo': 'mraldopls',
	'sawsbuck': 'deerling',
	'litten': 'samurott',
	'samurott': 'litten',
	'lunala': 'lunalavioleif',
	'wishes': 'unfixable',
	'nerd': 'eee4444444',
	'blaziken': 'knmfksdnf',
	'andy': 'agkoemv',
	'kris': 'likj9ajz',
	'nv': 'larvitar',
	'iyarito': '8f40n',
	'paris': 'goojna',
	'moo': 'soccerzxii',
	'lyren': 'solarisfaux',
	'tiksi': 'tikse',
	'ev': 'eeveegeneral',
	'chespin': 'd4ukzezn',
	'halite': 'rosasite',
	'thankyou': 'o5t9w5jl',
	'wally': 'wallythebully',
	'ant': 'nui',
	'nui': 'ant',
	'centiskorch': 'l99jh',
	'ceteris': 'eprtiuly',
	'om': 'omroom',
	'roman': 'wt2sd0qh',
	'maroon': 'rucbwbeg',
	'lyd': 'ahdjfidnf',
	'perry': 'mrperry',
	'yogibears': 'bwahahahahahahahaha',
	'tjay': 'teej19',
	'explodingdaisies': '85kgt',
	'flare': 'nsyncluvr67',
	'tenshi': 'tenshinagae',
	'pre': '0km',
	'ransei': '54j7o',
	'snaquaza': 'prrrrrrrrr',
	'alpha': 'alphawittem',
	'asheviere': '54hw4',
	'taranteeeno': 'moondazingo',
	'rage': 'hipfiregod',
	'andrew': 'stevensnype',
	'robyn': 'jediruwu',
	'birdy': 'cmstrall',
	'pirateprincess': '45mbh',
	'tempering': 'tempho',
	'chazm': 'chazmicsupanova',
	'arsenal': '558ru',
	'buffy': 'cvpux4zn',
	'luigi': 'luifi',
	'mitsuki': 'latiosred',
	'faku': 'ifaku',
	'pablo': 'arrested',
	'facu': 'facundoooooooo',
	'gimmick': 'gimm1ck',
	'pichus': 'up1gat8f',
	'pigeons': 'pigeonsvgc',
	'clefable': '147x0',
	'splash': 'mitsukokongou',
	'talah': '2b',
	'vexen': 'vexeniv',
	'shuutsukiyama': 'spankmepikachu',
	'blaz': 'blazask',
	'annika': 'l07kxym4',
	'tuthur': 'tuthur1',
	'moutemoute': 'fjlelzmzp',
	'mia': 'whgmpdku',
	// alt of mia
	'elisabetsobeck': '2sr28lp1',
	'inactive': 'xfd6bys3',
	'trace': 'mashirokurata',
	'celine': 'celine13',
	'hydro': '683tdwj6',
	'pants': 'stnap',
	'zap': 'zapcolor5',
	'avarice': 'ava823',
	'finch': 'finchinator',
	'tpp': 'teampokepals',
	'zarif': 'zariftest103',
	'milak': 'rasbhari',
	'dya': 'dyaaaaaaa',
	'instruct': 'vgc24',
	'jayi': 'prank',
	'pujo': 'ballombre',
	'blah': 'shubashubashub',
	'sfg': 'saltyfrenchguy',
	'sectonia': '6gv44c3w',
	'awa': 'awanderingcaelum',
	'vani': '6an2khng',
	'duel': 'duelmex',
	'lily': 'lilburr',
	'ara': 'phoenixara',
	'sakito': 'bysakito',
	'dnb': 'onlyrandomstuff',
	'niko': 'nikogoh',
	'ophion': 'ophi0n',
	'dflo': 'dragonflo',
	'cleffa': 'momopono',
	'skies': 'skiesjfk',
	'empo': 'gsz9pvp6',
	'devin': 'devwin',
	'keys': 'dream',
	'think': 'thinkerino',
	'rosa': 'glyx',
	'king': 'kingswordyt',
	'ltg': 'loltrollgame',
	'peary': 'hreybb',
	'alex': '17ot7i28',
	'zalm': 'vk0hw40x',
	'swiffix': 'a7ms4bok',
	'partman': '9tjak2hz',
	'monkey': 'henka',
	'soulwind': 'malahuju',
	'eris': 'marjane',
	'theia': 'nolnerd',
	'litwick': 'nolnerd',
	'grimm': 'grimmnightmare',
	'violet': 'fi4li3t3',
	'avery': 'ayvery',
	'altthiel': 'rqj7oxwm',
	'tranquilityy': 'axgwd',
	'micoy': 'micoy21',
	'pyro': 'loschunkos',
	'clementine': '45xlimv0',
	'boat': 'phiwings99',
	'isaiah': 'menacing',
	'ruby': 'woooooooooooooooo',
	'kaede': 'kaedy',
	'senko': 'emillight',
	'towelie': 'alore',
	'hisuianzoroark': 'supervillainx',
	'mochi': 'bocchihitori',
	'mex': 'megaeeveex',
	'eli': '75hr8qhl',
	'k': 'kennedy',
	'importo': 'fcportoisthebest',
	'rsb': 'rustysheriffbadge',
	'rumia': 'akumajou',
	'enrique': 'j3f2gdsz',
	'kolohe2': 'sundrops',
	'santiago': 'sevt',
	'jakee': 'jayyke',
	'pikachusean': 'ple8chwn',
	'tranquility': 'axgwd',
	'syrinix': 'blunix',
	'talonflame': 'ut',
	'neko': 'alotofnekos',
	'siegfried': 'meistersiegfried',
	'roxie': 'roxiee',
	'aigis': 'narukami',
	'mimejr': 'h9o4q4jg',
	'beauts': 'platinna',
	'ducky': 'mudkipbowl',
	'zee': 'zeefable',
	'sulo': 'suloxiv',
	'shiloh': 'oic9lxkq',
	'cathy': '' //{color: '#ff5cb6'}
};

export async function loadCustomColors() {
  try{
  const res = await axios.get(
    "https://play.pokemonshowdown.com/config/colors.json",
    {
      withCredentials: false,
      timeout: 5000,
    },
  );
  Object.assign(customColors, res.data);
  loadedCustomColors = true;
  }
  catch(e){
    console.error("Couldn't fetch custom colours:", e)
  }
}

export function userColor(name) {
  return userColorHash(customColors[toID(name)] || toID(name));
}
