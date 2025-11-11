import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DesignRequest {
  id: string;
  requester_name: string;
  requester_email: string;
  department: string;
  request_type: 'social_media' | 'print' | 'digital' | 'branding' | 'presentation' | 'other';
  title: string;
  description: string;
  objective: string;
  target_audience: string;
  deadline: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dimensions?: string;
  color_preferences?: string;
  reference_links?: string;
  reference_images?: string[];
  additional_notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  trello_card_id?: string;
  trello_card_url?: string;
  created_at: string;
  updated_at: string;
}
