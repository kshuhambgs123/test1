import { PrismaClient } from "@prisma/client";
import { adminAuth } from "./admindb";
import {v4} from 'uuid';

const prisma = new PrismaClient();

export async function adminLogin(email:string,password:string) {
    const data = await prisma.admin.findUnique({
        where: {
            email: email,
            password: password
        },
    });
    if(!data){
        return null;
    }
    const token = v4();
    await adminAuth.set(token,data.email);

    return token;
}

export async function getAllUsers() {
    const data = await prisma.user.findMany();
    return data;
}

export async function generateAPIkey(userID: string){
    const key = v4();

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

export async function getAllApikeys(){
    const data = await prisma.apiKeys.findMany();

    return data;
}




