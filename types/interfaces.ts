
export interface InvoiceData {
    from: string;
    to: string;
    logo: string;
    number: string;
    date: string;
    'items[0][name]': string;
    'items[0][quantity]': string;
    'items[0][unit_cost]': string;
    notes: string;
    currency: string;
    amount_paid: string;
}
