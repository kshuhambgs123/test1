import express, { Request, Response } from "express";
import adminVerification from "../middleware/adminAuth"
import path from 'path';
import fs from 'fs';
import { adminLogin, generateAPIkey, getAllApikeys, getAllUsers, getApiKey, getLogsByUserID, getUserById, revokeAPIkey, updateCredits } from "../db/admin";
import { createCompleteLog, getAllLogs } from "../db/log";
import { v4 } from "uuid";

const app = express.Router();

interface LoginRequest extends Request {
    body: {
        email: string;
        password: string;
    };
}

interface ChangePriceRequest extends Request {
    body: {
        newPrice: number;
    };
}

interface ChangeAutomationLinkRequest extends Request {
    body: {
        automationLink: string;
    };
}

interface ChangeDNSRequest extends Request {
    body: {
        newDNS: string;
    };
}

interface ChangeStatusRequest extends Request {
    body: {
        statusLink: string;
    };
}

interface UpdateCreditsRequest extends Request {
    body: {
        userID: string;
        credits: number;
    };
}

interface ChangeEnrichPriceRequest extends Request {
    body: {
        newPrice: number;
    };
}


// Login route
app.post("/login", async (req: LoginRequest, res: Response) => {  //TESTED
    try {
        const { email, password } = req.body;
        const resp = await adminLogin(email, password);
        if (!resp) {
            throw new Error("no admin account");
        }
        res.status(200).json({ "message": "authorised", "token": resp });
    } catch (error: any) {
        res.status(404).json({ "message": error.message });
    }
});

// Get price
app.get("/getPrice", adminVerification, async (req: Request, res: Response) => {  //TESTED
    try {
        if (!process.env.COSTPERLEAD) {
            throw new Error("no price set");
        }
        res.status(200).json({ "resp": process.env.COSTPERLEAD });
    } catch (error: any) {
        res.status(404).json({ "error": error.message });
    }
});

// Change price
app.post("/changePrice", adminVerification, async (req: ChangePriceRequest, res: Response) => {  //TESTED
    try {
        const { newPrice } = req.body;
        if (isNaN(newPrice) || !newPrice) {
            throw new Error("Invalid price");
        }

        process.env.COSTPERLEAD = newPrice.toString();

        const envFilePath = path.resolve(__dirname, '../.env');
        if (!fs.existsSync(envFilePath)) {
            throw new Error(".env file not found");
        }

        let envFileContent = fs.readFileSync(envFilePath, 'utf8');
        const newEnvFileContent = envFileContent.replace(/(^|\n)COSTPERLEAD=.*/, `$1COSTPERLEAD=${newPrice}`);
        fs.writeFileSync(envFilePath, newEnvFileContent);

        res.status(200).json({ "resp": "updated price" });
    } catch (error: any) {
        res.status(400).json({ "error": error.message });
    }
});

// Change automation link
app.post("/changeAutomationLink", adminVerification, async (req: ChangeAutomationLinkRequest, res: Response) => {  //TESTED
    try {
        const { automationLink } = req.body;
        if (!automationLink) {
            throw new Error("Invalid link");
        }

        process.env.SEARCHAUTOMATIONAPI = automationLink.toString();

        const envFilePath = path.resolve(__dirname, '../.env');
        if (!fs.existsSync(envFilePath)) {
            throw new Error(".env file not found");
        }

        let envFileContent = fs.readFileSync(envFilePath, 'utf8');
        const newEnvFileContent = envFileContent.replace(/(^|\n)SEARCHAUTOMATIONAPI=.*/, `$1SEARCHAUTOMATIONAPI=${automationLink}`);
        fs.writeFileSync(envFilePath, newEnvFileContent);

        res.status(200).json({ "resp": "updated automation linke" });
    } catch (error: any) {
        res.status(400).json({ "error": error.message });
    }
});

// Change status link
app.post("/changeStatusLink", adminVerification, async (req: ChangeStatusRequest, res: Response) => {  //TESTED
    try {
        const { statusLink } = req.body;
        if (!statusLink) {
            throw new Error("Invalid link");
        }

        process.env.SEARCHAUTOMATIONAPISTATUS = statusLink.toString();

        const envFilePath = path.resolve(__dirname, '../.env');
        if (!fs.existsSync(envFilePath)) {
            throw new Error(".env file not found");
        }

        let envFileContent = fs.readFileSync(envFilePath, 'utf8');
        const newEnvFileContent = envFileContent.replace(/(^|\n)SEARCHAUTOMATIONAPISTATUS=.*/, `$1SEARCHAUTOMATIONAPISTATUS=${statusLink}`);
        fs.writeFileSync(envFilePath, newEnvFileContent);

        res.status(200).json({ "resp": "updated automation linke" });
    } catch (error: any) {
        res.status(400).json({ "error": error.message });
    }
});

// Change DNS
app.post("/changeDNS", adminVerification, async (req: ChangeDNSRequest, res: Response) => {  //TESTED
    try {
        const { newDNS } = req.body;
        if (!newDNS) {
            throw new Error("Invalid link");
        }

        process.env.DNS = newDNS.toString();

        const envFilePath = path.resolve(__dirname, '../.env');
        if (!fs.existsSync(envFilePath)) {
            throw new Error(".env file not found");
        }

        let envFileContent = fs.readFileSync(envFilePath, 'utf8');
        const newEnvFileContent = envFileContent.replace(/(^|\n)DNS=.*/, `$1DNS=${newDNS}`);
        fs.writeFileSync(envFilePath, newEnvFileContent);

        res.status(200).json({ "resp": "updated automation linke" });
    } catch (error: any) {
        res.status(400).json({ "error": error.message });
    }
});

// Get all users
app.get("/getAllUsers", adminVerification, async (req: Request, res: Response) => { //TESTED
    try {
        const resp = await getAllUsers();
        res.status(200).json({ resp });
    } catch (error: any) {
        res.status(404).json({ "message": error.message });
    }
});

app.get("/getAllApikeys", adminVerification, async (req: Request, res: Response) => { //TESTED
    try {
        const resp = await getAllApikeys();
        res.status(200).json({ resp });
    } catch (error: any) {
        res.status(404).json({ "message": error.message });
    }
});

app.post("/generateAPIkey", adminVerification, async (req: Request, res: Response) => {  //TESTED
    try {
        const { userID } = req.body;
        const resp = await generateAPIkey(userID);
        if (!resp) {
            throw new Error("failed to generate key");
        }
        res.status(200).json({ resp });
    } catch (error: any) {
        res.status(404).json({ "message": error.message });
    }
});

app.post("/getAPIkey",adminVerification, async (req: Request, res: Response) => {  //TESTED
    try {
        const { userID } = req.body;
        const resp = await getApiKey(userID);
        if (!resp) {
            throw new Error("this account do not have APIKEY access");
        }
        res.status(200).json({ resp });
    } catch (error: any) {
        res.status(404).json({ "message": error.message });
    }
});

app.post("/revokeAPIkey", adminVerification, async (req: Request, res: Response) => {  //TESTED
    try {
        const { userID } = req.body;
        const resp = await revokeAPIkey(userID);
        if (!resp) {
            throw new Error("failed to revoke key");
        }
        res.status(200).json({ resp });
    } catch (error: any) {
        res.status(404).json({ "message": error.message });
    }
});

// Update credits
app.post("/updateCredits", adminVerification, async (req: UpdateCreditsRequest, res: Response) => {  //TESTED
    try {
        const { userID, credits } = req.body;
        const resp = await updateCredits(userID, credits);
        if (resp === "negative") {
            throw new Error("credits cannot be negative");
        }
        if (!resp) {
            throw new Error("failed to update credits");
        }
        res.status(200).json({ resp });
    } catch (error: any) {
        res.status(400).json({ "message": error.message });
    }
});


// Get user by ID
app.post("/getUser", adminVerification, async (req: Request, res: Response) => {  //TESTED
    try {
        const { userID } = req.body;
        const data = await getUserById(userID);
        if (!data) {
            throw new Error("user not found");
        }
        res.status(200).json({ data });
    } catch (error: any) {
        res.status(404).json({ "message": error.message });
    }
});

app.post("/getAllLogsById", adminVerification, async (req: Request, res: Response) => {  //TESTED
    try {
        const {userID} =   req.body;

        const data = await getLogsByUserID(userID);
        if (!data) {
            throw new Error("failed to find logs");
        }
        res.status(200).json({ data });
    } catch (error: any) {
        res.status(400).json({ "message": error.message });
    }
});

app.get("/getAllLogs", adminVerification, async (req: Request, res: Response) => {  //TESTED
    try{
        const data =  await getAllLogs()

        if (!data) {    
            throw new Error("failed to find logs");
        }
        res.status(200).json({ data });
    }catch(error: any){
        res.status(400).json({ "message": error.message });
    }
});

app.post("/changeRegistrationCredits", adminVerification, async (req: ChangeEnrichPriceRequest, res: Response) => {  //TESTED
    try {
        const { newPrice } = req.body;
        if (isNaN(newPrice) || !newPrice) {
            throw new Error("Invalid price");
        }

        process.env.RegistrationCredits = newPrice.toString();

        const envFilePath = path.resolve(__dirname, '../../.env');
        if (!fs.existsSync(envFilePath)) {
            throw new Error(".env file not found");
        }

        let envFileContent = fs.readFileSync(envFilePath, 'utf8');
        const newEnvFileContent = envFileContent.replace(/(^|\n)RegistrationCredits=.*/, `$1RegistrationCredits=${newPrice}`);
        fs.writeFileSync(envFilePath, newEnvFileContent);

        res.status(200).json({ "resp": "updated registration credits" });
    } catch (error: any) {
        res.status(400).json({ "error": error.message });
    }
});

app.get("/getRegistrationCredits", adminVerification, async (req: Request, res: Response) => {  //TESTED
    try {
        if (!process.env.RegistrationCredits) {
            throw new Error("no price set");
        }
        res.status(200).json({ "resp": process.env.RegistrationCredits });
    } catch (error: any) {
        res.status(404).json({ "error": error.message });
    }
});

app.post("/createUserLog",adminVerification,async(req:Request,res:Response)=>{
    try {
        const {userID,leadsRequested,leadsEnriched,apolloLink,fileName,creditsUsed,url,status} = req.body;

        if(!userID || !leadsRequested || !leadsEnriched || !apolloLink || !fileName || !creditsUsed || !url || !status){
            res.status(400).json({ message: "Missing fields" });
            return;
        }

        const createCompleteLogData = await createCompleteLog(v4(),userID,leadsRequested,leadsEnriched,apolloLink,fileName,creditsUsed,url,status);

        if(!createCompleteLogData){
            res.status(400).json({ message: "Failed to create log" });
            return;
        }

        res.status(200).json({ message: "Log created successfully", log: createCompleteLogData });
    } catch (error: any) {
        res.status(400).json({ "message": error.message });
    }
});

export default app;
