import express, { Request, Response } from 'express';
import apiauth from '../middleware/apiAuth';
import {getUser, removeCredits} from '../db/user';
import dotenv from 'dotenv';
import formdata from 'form-data';
dotenv.config();
import {createLog, updateLog} from '../db/log';

const app = express.Router();

function checkUrl(url: string): boolean {
    const basePattern = /^https:\/\/app\.apollo\.io\/#\/people\?/;

    const invalidPattern = /contactLabelIds\[\]=/;

    return basePattern.test(url) && !invalidPattern.test(url);
}

function removePunctuation(str: string): string {
    return str.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/, '');
}

app.post("/searchLeads", apiauth, async (req: Request, res: Response): Promise<void> => {
    try {
        const userID = (req as any).user.UserID;
        const user = await getUser(userID);

        const { apolloLink , noOfLeads, fileName } = req.body;

        if (!apolloLink || !noOfLeads || !fileName) {
            res.status(400).json({ message: "Missing fields" });
            return;
        }

       const fixedFilename = removePunctuation(fileName);

        if(!checkUrl(apolloLink)){
            res.status(400).json({ message: "Invalid URL" });
            return;
        }

        const noOfLeadsNumeric = parseInt(noOfLeads);

        if(noOfLeadsNumeric < 1000 && noOfLeadsNumeric > 50000){
            res.status(400).json({ message: "Invalid number of leads" });
            return;
        }

        const costPerLead = parseInt(process.env.COSTPERLEAD as string);
        
        let credits = noOfLeadsNumeric * costPerLead;
    

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (user.credits < credits) {
            res.status(400).json({ message: "Insufficient credits" });
            return;
        }

        const dns = process.env.DNS as string;
        

        const formData = new formdata();

        formData.append('apollo_link', apolloLink);
        formData.append('file_name', fixedFilename);
        formData.append('id', dns);
        formData.append('leads_count',noOfLeadsNumeric);

        const searchAPI = process.env.SEARCHAUTOMATIONAPI as string;

        const response = await fetch(searchAPI,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            res.status(400).json({ message: "Failed to search leads" });
            return;
        }

        const data = await response.json();

        //creating log

        const newLog = await createLog(data.record_id,userID,noOfLeadsNumeric,0,apolloLink,fileName,credits,"url");

        // Deduct credit
        const state = await removeCredits(credits, userID);

        if (!state) {
            res.status(400).json({ message: "Failed to deduct credits" });
            return;
        }

        res.status(200).json({ message: `Lead searched successfully balance: ${state.credits} and log created`,balance:state.credits ,log:newLog });
        
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }   
});

app.post("/checkleadStatus", apiauth, async (req: Request , res: Response): Promise<void> => {
    try {
        const { recordID } = req.body;
        
        const leadStatusAPI = process.env.SEARCHAUTOMATIONAPISTATUS as string;
        const response = await fetch(leadStatusAPI,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({"record_id":recordID}),
        });

        if (!response.ok) {
            res.status(400).json({ message: "Failed to check lead status" });
            return;
        }

        const data = await response.json();

        const updateLead = await updateLog(recordID,data.enrichment_status,data.spreadsheet_url,data.enriched_records);

        if (!updateLead) {
            res.status(400).json({ message: "Failed to update log" });
            return;
        }

        res.status(200).json({ message: `Lead status checked successfully`,log:updateLead });
        
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
})

export default app;