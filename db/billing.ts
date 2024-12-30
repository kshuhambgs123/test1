import { BillingDetails, PrismaClient as EnrichminionDB } from "@prisma/client";

const prisma = new EnrichminionDB();

export async function createInvoiceEntry(
    userID: string,
    billingID: string,
    url: string,
    creditsRequested: number
) {
    try {
        const invoice = await prisma.billingDetails.create({
            data: {
                BillingID: billingID,
                userID: userID,
                Url: url,
                CreditsRequested: creditsRequested,
                date: new Date(),
            }
        })

        if (!invoice) {
            return null;
        }

        return invoice;
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export async function getInvoicesByUserID(userID: string): Promise<BillingDetails   []> {
    try {
        const invoice = await prisma.billingDetails.findMany({
            where: {
                userID: userID
            }
        });

        return invoice;
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export async function getAllInvoices(): Promise<BillingDetails[]> {
    try {
        const invoice = await prisma.billingDetails.findMany();
        if (!invoice) {
            return [];
        }
        return invoice;
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export async function getInvoiceByBillingID(billingID: string): Promise<BillingDetails | null> {
    try {
        const invoice = await prisma.billingDetails.findUnique({
            where: {
                BillingID: billingID
            }
        });

        return invoice || null;
    } catch (error: any) {
        throw new Error(error.message);
    }
}
