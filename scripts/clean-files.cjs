const fs = require('fs');
const path = require('path');

const roots = [path.join(process.cwd(), 'app')];
const targets = ['DocsPortal.jsx', 'page.jsx'];

function stripBom(buf) {
  if (!buf || buf.length < 3) return buf;
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) return buf.slice(3);
  return buf;
}

for (const root of roots) {
  const walk = (p) => {
    for (const name of fs.readdirSync(p)) {
      const fp = path.join(p, name);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) { walk(fp); continue; }
      if (!targets.includes(path.basename(fp))) continue;
      let buf = fs.readFileSync(fp);
      buf = stripBom(buf);
      let txt = buf.toString('utf8');
      // remove any backslash only line or leading backslash
      txt = txt.replace(/^\[\r\n]?/, '');
      fs.writeFileSync(fp, txt, 'utf8');
      console.log('cleaned', fp);
    }
  };
  if (fs.existsSync(root)) walk(root);
}
