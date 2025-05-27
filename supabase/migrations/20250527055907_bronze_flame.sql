/*
  # Create bookings table

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `event_name` (text)
      - `date` (date)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `duration` (integer)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `bookings` table
    - Add policies for authenticated users to:
      - Create their own bookings
      - Read their own bookings
      - Update their own bookings
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  event_name text NOT NULL,
  date date NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration integer NOT NULL CHECK (duration > 0),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to create their own bookings
CREATE POLICY "Users can create their own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to read their own bookings
CREATE POLICY "Users can read their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to update their own bookings
CREATE POLICY "Users can update their own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to check booking availability
CREATE OR REPLACE FUNCTION check_booking_availability(
  check_date date,
  check_start_time timestamptz,
  check_end_time timestamptz
) RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE date = check_date
    AND status = 'confirmed'
    AND (
      (start_time <= check_start_time AND end_time > check_start_time)
      OR (start_time < check_end_time AND end_time >= check_end_time)
      OR (start_time >= check_start_time AND end_time <= check_end_time)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;