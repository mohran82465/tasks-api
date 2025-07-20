const Busboy = require('busboy');

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const bb = new Busboy({ headers: req.headers });
    const result = { files: [], fields: {} };

    bb.on('file', (name, fileStream, info) => {
      result.files.push({ name, fileStream, info });
    });

    bb.on('field', (name, val) => {
      result.fields[name] = val;
    });

    bb.on('finish', () => resolve(result));
    bb.on('error', reject);

    req.pipe(bb);
  });
}

module.exports = parseForm;
