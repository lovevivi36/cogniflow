-- ============================================
-- 更新卡片表结构：将 front 和 back 合并为 content
-- 请在 Supabase Dashboard > SQL Editor 中执行
-- ============================================

-- 添加新字段 content（如果不存在）
ALTER TABLE cards ADD COLUMN IF NOT EXISTS content TEXT;

-- 将现有的 front 和 back 合并到 content（如果已有数据）
UPDATE cards 
SET content = CASE 
  WHEN front IS NOT NULL AND back IS NOT NULL THEN front || E'\n\n' || back
  WHEN front IS NOT NULL THEN front
  WHEN back IS NOT NULL THEN back
  ELSE ''
END
WHERE content IS NULL OR content = '';

-- 注意：暂时保留 front 和 back 字段以兼容旧数据
-- 如果需要完全迁移，可以执行以下命令（请先备份数据）：
-- ALTER TABLE cards ALTER COLUMN content SET NOT NULL;
-- ALTER TABLE cards DROP COLUMN front;
-- ALTER TABLE cards DROP COLUMN back;
