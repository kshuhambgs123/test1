
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

export interface StripePaymentMetadata {
    client: string;
    credits: string;
    subscriptionPlan: string;
    currency: string;
    userId: string;
}

export interface PaymentIDDetail {
    id: string;
    object: string;
    active: boolean;
    billing_scheme: string;
    created: number;
    currency: string;
    custom_unit_amount: null | {
        enabled: boolean;
        maximum: number | null;
        minimum: number | null;
        preset: number | null;
    };
    livemode: boolean;
    lookup_key: string | null;
    metadata: Record<string, string>;
    nickname: string | null;
    product: string;
    recurring: {
        aggregate_usage: string | null;
        interval: string;
        interval_count: number;
        trial_period_days: number | null;
        usage_type: string;
    };
    tax_behavior: string;
    tiers_mode: string | null;
    transform_quantity: string | null;
    type: string;
    unit_amount: number | null;
    unit_amount_decimal: string | null;
}
