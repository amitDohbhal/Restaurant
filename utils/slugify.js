// utils/slugify.js
export function slugify(text) {
    return text
        .toLowerCase() // Convert to lowercase
        .replace(/&/g, '') // Replace '&' with 'and'
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Remove consecutive hyphens
}