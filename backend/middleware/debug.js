const debugMiddleware = (req, res, next) => {
  console.log('🔍 DEBUG MIDDLEWARE:');
  console.log('  Method:', req.method);
  console.log('  URL:', req.url);
  console.log('  Content-Type:', req.headers['content-type']);
  console.log('  Body keys:', Object.keys(req.body || {}));
  console.log('  Files keys:', Object.keys(req.files || {}));
  console.log('  Params:', req.params);
  console.log('  Query:', req.query);
  
  if (req.body) {
    console.log('  Body values:');
    Object.keys(req.body).forEach(key => {
      console.log(`    ${key}: "${req.body[key]}" (${typeof req.body[key]})`);
    });
  }
  
  if (req.files) {
    console.log('  Files:');
    Object.keys(req.files).forEach(key => {
      const files = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];
      files.forEach((file, index) => {
        console.log(`    ${key}[${index}]: ${file.originalname} (${file.mimetype})`);
      });
    });
  }
  
  console.log('🔍 END DEBUG');
  next();
};

module.exports = debugMiddleware;

