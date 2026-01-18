-- 添加软删除支持
-- 为 cards 和 decks 表添加 deleted_at 字段

-- 为 cards 表添加 deleted_at 字段
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 为 decks 表添加 deleted_at 字段
ALTER TABLE decks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_cards_deleted_at ON cards(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decks_deleted_at ON decks(deleted_at) WHERE deleted_at IS NOT NULL;

-- 更新 RLS 策略，允许用户查看自己的已删除项目
-- 注意：现有的 RLS 策略已经允许用户查看自己的数据，所以不需要修改
