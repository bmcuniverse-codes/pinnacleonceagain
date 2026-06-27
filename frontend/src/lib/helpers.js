export const currency = (amount) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0)
export const slugify = (value = '') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
export const percent = (value, max) => max <= 0 ? 0 : Math.round((Number(value || 0) / Number(max || 1)) * 100)
export const initials = (name = '') => name.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase()
