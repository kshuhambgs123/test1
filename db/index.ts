import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseBaseUrl = process.env.SUPABASE_BASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;


const supabase = createClient(supabaseBaseUrl, supabaseAnonKey,);

export default supabase;