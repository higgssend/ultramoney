-- Migration: Create Notifications Table with Realtime & Multi-Device Sync
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  lender_id TEXT NOT NULL,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Lenders can select, insert, update and delete their own notifications
DROP POLICY IF EXISTS "Lenders can manage their notifications" ON notifications;
CREATE POLICY "Lenders can manage their notifications"
  ON notifications
  FOR ALL
  USING (lender_id = auth.uid() OR auth.uid() IS NULL);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_lender_read ON notifications(lender_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
