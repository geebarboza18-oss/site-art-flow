/*
  # Design Requests Management System

  ## Overview
  This migration creates the complete database schema for a design request management system
  that integrates with Trello for project tracking.

  ## Tables Created
  
  ### design_requests
  Main table storing all design requests submitted by users
  - `id` (uuid, primary key) - Unique identifier for each request
  - `requester_name` (text) - Name of the person requesting the design
  - `requester_email` (text) - Email for communication
  - `department` (text) - Department making the request
  - `request_type` (text) - Type of design: social_media, print, digital, branding, presentation, other
  - `title` (text) - Brief title of the request
  - `description` (text) - Detailed description of what's needed
  - `objective` (text) - Goal/purpose of the design
  - `target_audience` (text) - Who will see this design
  - `deadline` (date) - Requested completion date
  - `priority` (text) - Priority level: urgent, high, medium, low
  - `dimensions` (text, optional) - Size/format requirements
  - `color_preferences` (text, optional) - Color guidelines or preferences
  - `reference_links` (text, optional) - URLs to reference materials
  - `additional_notes` (text, optional) - Any extra information
  - `status` (text) - Current status: pending, in_progress, completed, cancelled
  - `trello_card_id` (text, optional) - ID of the created Trello card
  - `trello_card_url` (text, optional) - URL to the Trello card
  - `created_at` (timestamptz) - Timestamp when request was created
  - `updated_at` (timestamptz) - Timestamp of last update

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public can insert new requests (anyone can submit)
  - Public can read all requests (transparency)
  - Only authenticated users can update/delete (admin control)

  ## Notes
  - All requests are stored permanently for historical tracking
  - Trello integration fields are populated by Edge Function after card creation
  - Status is automatically set to 'pending' on creation
*/

-- Create design_requests table
CREATE TABLE IF NOT EXISTS design_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  department text NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('social_media', 'print', 'digital', 'branding', 'presentation', 'other')),
  title text NOT NULL,
  description text NOT NULL,
  objective text NOT NULL,
  target_audience text NOT NULL,
  deadline date NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  dimensions text,
  color_preferences text,
  reference_links text,
  additional_notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  trello_card_id text,
  trello_card_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE design_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert new requests (public submission)
CREATE POLICY "Anyone can create design requests"
  ON design_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to view all requests (transparency)
CREATE POLICY "Anyone can view design requests"
  ON design_requests
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to view all requests
CREATE POLICY "Authenticated users can view all requests"
  ON design_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update requests (admin/designer access)
CREATE POLICY "Authenticated users can update requests"
  ON design_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete requests if needed
CREATE POLICY "Authenticated users can delete requests"
  ON design_requests
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_design_requests_status ON design_requests(status);
CREATE INDEX IF NOT EXISTS idx_design_requests_created_at ON design_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_design_requests_priority ON design_requests(priority);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_design_requests_updated_at ON design_requests;
CREATE TRIGGER update_design_requests_updated_at
  BEFORE UPDATE ON design_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
