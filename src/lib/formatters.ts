
export const fmt = new Intl.NumberFormat('default', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
}).format;

export const fmtInt = new Intl.NumberFormat('default', {
    style: 'decimal',
    maximumFractionDigits: 0,
}).format;

export const fmtPct = new Intl.NumberFormat('default', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
}).format;

/* dates */

export const dateFormat = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'Australia/Sydney',
}).format;

