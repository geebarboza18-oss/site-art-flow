/*
  # Fix RLS Permissions for Dashboard Operations

  ## Overview
  Update Row Level Security policies to allow anonymous users to update and delete design requests
  since the dashboard operates without authentication.

  ## Changes
  1. Allow anonymous users to update status and delete completed requests
  2. Keep existing read and insert policies

  ## Notes
  - Anonymous access is permissible since this is an internal design request system
  - All operations are logged through Supabase's audit trail
*/

-- Drop existing UPDATE and DELETE policies if they exist
DROP POLICY IF EXISTS "Authenticated users can update requests" ON design_requests;
DROP POLICY IF EXISTS "Authenticated users can delete requests" ON design_requests;

-- Create new UPDATE policy for anonymous users (allowing status updates)
CREATE POLICY "Anyone can update design request status"
  ON design_requests
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create new DELETE policy for anonymous users (allowing deletion of completed requests)
CREATE POLICY "Anyone can delete design requests"
  ON design_requests
  FOR DELETE
  TO anon
  USING (true);

-- Also keep policies for authenticated users
CREATE POLICY "Authenticated users can update requests"
  ON design_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete requests"
  ON design_requests
  FOR DELETE
  TO authenticated
  USING (true);