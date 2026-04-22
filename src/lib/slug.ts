/**
 * Converts a string to a URL-friendly slug
 * Example: "Bài 1: Hàm số lượng giác" -> "bai-1-ham-so-luong-giac"
 */
export function generateSlug(text: string): string {
  if (!text) return "";

  let result = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  result = result.replace(/đ/g, "d");

  // Replace spaces and special characters with hyphens
  result = result.replace(/[^a-z0-9\s-]/g, "");

  // Replace multiple spaces with single hyphen
  result = result.replace(/\s+/g, "-");

  // Remove leading/trailing hyphens
  result = result.replace(/^-+|-+$/g, "");

  // Replace multiple hyphens with single hyphen
  result = result.replace(/-+/g, "-");

  return result;
}

/**
 * Generates a unique slug by appending a number if needed
 */
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
