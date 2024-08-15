import { Logs, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


// create
export async function createLog(
    logID: string,
    userID: string,
    leadsRequested: number,
    leadsEnriched: number,
    apolloLink: string,
    fileName: string,
    creditsUsed: number,
    url: string
): Promise<Logs | null> {
    try {
        const log = await prisma.logs.create({
            data:{
                LogID: logID,
                userID: userID,
                leadsRequested: leadsRequested,
                leadsEnriched: leadsEnriched,
                apolloLink: apolloLink,
                fileName: fileName,
                creditsUsed: creditsUsed,
                url: url,
                status: 0,
                date: new Date(),
            }
        })

        return log;
    } catch (error: any) {
        throw new Error(error.message);
    }
}

// get all

export async function getAllLogs(userID :string): Promise<Logs[]> {
    try {
        const logs = await prisma.logs.findMany({
            where: {
                userID: userID
            }
        });

        return logs;
    } catch (error: any) {
        throw new Error(error.message);
    }
}

//getone

export async function getOneLog(logID: string): Promise<Logs | null> {
    try {
        const log = await prisma.logs.findUnique({
            where: {
                LogID: logID
            }
        });

        return log;
    } catch (error: any) {
        throw new Error(error.message);
    }
}

//update

export async function updateLog(
    logID: string, 
    status: number,
    url: string,
    leadsEnriched: number,
): Promise<Logs | null> {
    try {
        const existingLog = await prisma.logs.findUnique({
            where: {
                LogID: logID
            }
        });

        if (!existingLog) {
            return null;
        }

        const log = await prisma.logs.update({
            where: {
                LogID: logID
            },
            data: {
                status: status,
                url: url,
                leadsEnriched: leadsEnriched
            }
        });

        return log;
    } catch (error: any) {
        throw new Error(error.message);
    }
}


//logs getall getone update  admin login change pricing gen api , 