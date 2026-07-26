-- Migration V17: Manual-Payment Paper Credits, Unlimited VIP Access, and Payment Requests Schema

-- 1. Add paper_credits and has_unlimited_access to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS paper_credits INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_unlimited_access BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add is_free_trial to exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_free_trial BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark first three seeded PYP papers as free trial (JEE Main 1, JEE Main 2, SSC CGL)
UPDATE exams SET is_free_trial = TRUE WHERE description LIKE 'PYP_PAPER:%' AND id IN (
  SELECT id FROM exams WHERE description LIKE 'PYP_PAPER:%' ORDER BY created_at ASC LIMIT 3
);

-- 3. Create paper_unlocks table (tracks permanent candidate unlocks per paper)
CREATE TABLE IF NOT EXISTS paper_unlocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_paper_unlock UNIQUE (user_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_paper_unlocks_user ON paper_unlocks(user_id);

-- 4. Create payment_requests table (manual UPI claim requests with Telegram notification support)
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credits_claimed INT NOT NULL,
    amount_claimed_inr NUMERIC(10,2) NOT NULL,
    order_reference VARCHAR(50) NOT NULL UNIQUE,
    utr_reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL, -- PENDING, APPROVED, REJECTED
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
