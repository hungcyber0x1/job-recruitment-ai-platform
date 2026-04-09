exports.slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

exports.generateRandomString = (length = 10) => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
};

exports.truncate = (str, n = 100) => {
  return str.length > n ? str.substr(0, n - 1) + '...' : str;
};
