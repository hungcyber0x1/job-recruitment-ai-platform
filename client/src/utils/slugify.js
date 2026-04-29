/**
 * Converts a Vietnamese string to a URL-friendly slug
 * @param {string} str - The string to slugify
 * @returns {string} The slugified string
 */
export const slugify = (str) => {
  if (!str) return '';

  let slug = str.toLowerCase();

  // Handle Vietnamese characters
  slug = slug.replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, 'a');
  slug = slug.replace(/[éèẻẽẹêếềểễệ]/g, 'e');
  slug = slug.replace(/[iíìỉĩị]/g, 'i');
  slug = slug.replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o');
  slug = slug.replace(/[úùủũụưứừửữự]/g, 'u');
  slug = slug.replace(/[ýỳỷỹỵ]/g, 'y');
  slug = slug.replace(/đ/g, 'd');

  // Remove special characters
  slug = slug.replace(/([^0-9a-z-\s])/g, '');

  // Replace whitespace with a dash
  slug = slug.replace(/(\s+)/g, '-');

  // Remove duplicate dashes
  slug = slug.replace(/-+/g, '-');

  // Trim dashes from start and end
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
};
