import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from 'uuid';
import { adminAuth } from "./admindb";

const prisma = new PrismaClient();

export async function adminLogin(email: string, password: string) {
    const data = await prisma.admin.findUnique({
        where: {
            email: email,
            password: password
        },
    });
    if (!data) {
        return null;
    }
    const token = uuid();
    await adminAuth.set(token, data.email);

    return token;
}

export async function getAllUsers() {
    const data = await prisma.user.findMany();
    return data;
}

export async function generateAPIkey(userID: string) {
    const key = uuid() as string;

    const data = await prisma.user.update({
        where: {
            UserID: userID
        },
        data: {
            apikey: key
        }
    });

    return data;
}

export async function tokenVerify(token: string) {
    const data = await adminAuth.get(token);
    return data;
}

export async function getAllApikeys() {
    const data = await prisma.user.findMany({
        select: {
            apikey: true
        }
    });

    return data;
}

export async function getApiKey(userID: string) {
    const data = await prisma.user.findUnique({
        where: {
            UserID: userID
        }
    });

    console.log(data);
    
    return data?.apikey;
}


export async function updateCredits(userID: string, credits: number) {
    const data = await prisma.user.findUnique({
        where: {
            UserID: userID
        }
    })

    if (!data) {
        return null;
    }

    const updatedCredits = data.credits + credits;

    if (updatedCredits < 0) {
        return "negative";
    }

    const updatedData = await prisma.user.update({
        where: {
            UserID: userID
        },
        data: {
            credits: updatedCredits
        }
    })

    if (!updatedData) {
        return null;
    }


    return updatedData;
}

export async function getUserById(userID: string) {
    const data = await prisma.user.findUnique({
        where: {
            UserID: userID
        }
    });

    return data;
}

export async function getLogsByUserID(userID: string) {
    const data = await prisma.logs.findMany({
        where: {
            userID: userID
        }
    })

    return data;
}

export async function revokeAPIkey(userID: string) {
    const data = await prisma.user.update({
        where: {
            UserID: userID
        },
        data: {
            apikey: null
        }
    });

    return data;
}

export async function editLog(logID: string, status: string,apollo_link: string, credits: number) {
    const log = await prisma.logs.findUnique({
        where: {
            LogID: logID
        }
    });

    if (!log) {
        return null;
    }
    console.log(log.creditsUsed);
    console.log(credits);
    if(log.creditsUsed > credits){
        const refCRED = log.creditsUsed - credits;
        const refingCred = await prisma.user.update({
            where: {
                UserID: log.userID
            },
            data: {
                credits: {
                    increment: refCRED
                }
            }
        });

        console.log(refingCred.credits);
        if (!refingCred) {
            return null;
        }
    }

    const data = await prisma.logs.update({
        where: {
            LogID: logID
        },
        data: {
            status: status,
            apolloLink: apollo_link,
            creditsUsed: credits
        }
    });

    return data;
}