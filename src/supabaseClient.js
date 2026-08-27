import { createClient } from "@supabase/supabase-js";

// Ágaprítógépek Miskolc App — Projekt iiflwelnnsmuhvfepoea (Frankfurt)
const supabaseUrl = "https://iiflwelnnsmuhvfepoea.supabase.co";
const supabaseKey = "sb_publishable_NH2TJt0fwRbhce_voOGvYw_a4GdV9OQ";

export const supabase = createClient(supabaseUrl, supabaseKey);
