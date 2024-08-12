import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import supabase from '../db/index';

dotenv.config();

interface AuthenticatedRequest extends Request {
  user?: any; // You can replace `any` with a more specific type if you have a User interface
}

const verifySessionToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    const sessionToken = authHeader.split("Bearer ")[1];
    if (!sessionToken) {
      throw new Error("Token missing or malformed");
    }

    const { data, error } = await supabase.auth.getUser(sessionToken);
    if (error || !data.user) {
      throw new Error("Unauthorized");
    }

    req.user = data.user;
    next();
  } catch (e: any) {
    res.status(401).json({ message: e.message });
  }
};

export default verifySessionToken;
