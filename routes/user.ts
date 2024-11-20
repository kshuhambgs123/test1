import express, { Request, Response } from 'express';
import { createUser, getUser, addCredits, removeCredits, refreshAPIKey } from '../db/user';
import verifySessionToken from '../middleware/supabaseAuth';
import dotenv from 'dotenv';
dotenv.config();
import { createLog, updateLog} from "../db/log"
import formdata from 'form-data';

const app = express.Router();

app.post("/register", verifySessionToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userID = (req as any).user.id;
        const email = (req as any).user.email;
        const { fullName, companyName, phoneNumber, location } = req.body;
        const user = await createUser(fullName, companyName, phoneNumber, location, userID, email);

        if (!user) {
            res.status(400).json({ message: "User already exists" });
            return;
        }   

        res.status(200).json({ message: "User created successfully", user });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/refreshAPIkey", verifySessionToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userID = (req as any).user.id;
        const newAPIkey = await refreshAPIKey(userID);

        if (!newAPIkey) {
            res.status(400).json({ message: "Failed to update API key" });
            return;
        }

        res.status(200).json({ message: "API key updated successfully", newAPIkey });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/getUser", verifySessionToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userID = (req as any).user.id;
        const user = await getUser(userID);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({ user });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/addCredits", verifySessionToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { credits } = req.body;
        const userID = (req as any).user.id;
        const state = await addCredits(credits, userID);

        if (!state) {
            res.status(400).json({ message: "Failed to add credits" });
            return;
        }

        res.status(200).json({ message: `Credits added successfully balance: ${state.credits}` });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/getCredits", verifySessionToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userID = (req as any).user.id;
        const user = await getUser(userID);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({ credits: user.credits });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


// app.post("/searchlead", verifySessionToken, async (req: Request , res: Response): Promise<void> => {
//     try {
//         const userID = (req as any).user.id;
//         const user = await getUser(userID);

//         const { apolloLink , noOfLeads, fileName } = req.body;
        
//         const noOfLeadsNumeric = parseInt(noOfLeads);

//         // const costPerLead = parseInt(process.env.COSTPERLEAD as string);
        
//         const credits = noOfLeadsNumeric;
    

//         if (!user) {
//             res.status(404).json({ message: "User not found" });
//             return;
//         }

//         if (user.credits < credits) {
//             res.status(400).json({ message: "Insufficient credits" });
//             return;
//         }

//         const dns = process.env.DNS as string;
        

//         const formData = new formdata();

//         formData.append('apollo_link', apolloLink);
//         formData.append('file_name', fileName);
//         formData.append('id', dns);
//         formData.append('leads_count',noOfLeadsNumeric);

//         const searchAPI = process.env.SEARCHAUTOMATIONAPI as string;

//         const response = await fetch(searchAPI,{
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(formData),
//         });

//         if (!response.ok) {
//             res.status(400).json({ message: "Failed to search leads" });
//             return;
//         }

//         const data = await response.json();

//         const newLog = await createLog(data.record_id,userID,noOfLeadsNumeric,0,apolloLink,fileName,credits,"url");

//         // Deduct credit
//         const state = await removeCredits(credits, userID);
//         if (!state) {
//             res.status(400).json({ message: "Failed to deduct credits" });
//             return;
//         }

//         res.status(200).json({ message: `Lead searched successfully balance: ${state.credits} and log created`,balance:state.credits ,log:newLog });

//     } catch (error: any) {
//         res.status(500).json({ message: error.message });
//     }    
// })


app.get("/getCost", verifySessionToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const costPerLead = parseInt(process.env.COSTPERLEAD as string);
        res.status(200).json({ costPerLead });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
})



export default app;

