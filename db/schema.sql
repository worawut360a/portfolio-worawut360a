-- =====================================================================
--  schema.sql — โครงสร้างฐานข้อมูลสำหรับ Turso (libSQL)
--
--  Turso คือ SQLite ที่ทำเป็นบริการ ไวยากรณ์เหมือน SQLite ทุกอย่าง
--  จึงยกโครงเดิมมาได้เกือบทั้งหมด สิ่งที่เปลี่ยนคือ "วิธีอ้างถึงรูปและไฟล์"
--
--  ── โมเดลสื่อแบบใหม่ (source + ref) ──────────────────────────────
--  เดิม  : เก็บ path ของไฟล์บนเซิร์ฟเวอร์ เช่น 'works/2026/07/abc.webp'
--  ใหม่  : เก็บ 2 คอลัมน์คู่กันเสมอ
--            source = 'drive'  → ref คือ Google Drive FILE ID
--            source = 'static' → ref คือ path ใต้ /public เช่น 'media/seed/w5_1.jpg'
--
--  เหตุผลที่เก็บ "ID" ไม่ใช่ URL เต็ม:
--    lh3.googleusercontent.com เป็น endpoint ที่ Google ไม่ได้ประกาศรองรับ
--    ถ้าวันหนึ่งเปลี่ยนรูปแบบ เราแก้ที่ src/lib/media.ts ไฟล์เดียวจบ
--    ไม่ต้องไล่แก้ทุกแถวในฐานข้อมูลของลูกค้าทุกคน
--
--  หมายเหตุ: ไม่มี thumb แล้ว เพราะย่อขนาดได้ที่ปลายทาง
--            drive  → ต่อท้าย =w400
--            static → ผ่าน Netlify Image CDN
--
--  updated_at ให้โค้ดฝั่ง TypeScript เป็นคนใส่ (ไม่ใช้ trigger)
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
--  บัญชีผู้ดูแล — ระบบนี้ออกแบบมาสำหรับ "แอดมินคนเดียว"
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  last_login_at TEXT NULL,
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
--  โปรไฟล์ครู (มีแถวเดียวเสมอ id = 1)
--  avatar_focus_x/y = จุดโฟกัสของรูป 0–100 (%) ใช้กับ CSS object-position
--  แก้ปัญหา "ครอบตัดรูปแล้วหัวหาย" โดยไม่ต้องสร้างไฟล์ใหม่
--  ซึ่งจำเป็น เพราะรูปจาก Google Drive เราแก้ไขไฟล์ต้นทางไม่ได้
-- ---------------------------------------------------------------------
CREATE TABLE teacher_profile (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name         TEXT NOT NULL,
  nickname          TEXT NOT NULL DEFAULT '',
  position          TEXT NOT NULL DEFAULT '',
  academic_standing TEXT NOT NULL DEFAULT '',
  subject_group     TEXT NOT NULL DEFAULT '',
  school            TEXT NOT NULL DEFAULT '',
  affiliation       TEXT NOT NULL DEFAULT '',
  area_office       TEXT NOT NULL DEFAULT '',
  email             TEXT NOT NULL DEFAULT '',
  phone             TEXT NOT NULL DEFAULT '',
  facebook          TEXT NOT NULL DEFAULT '',
  line_id           TEXT NOT NULL DEFAULT '',
  avatar_source     TEXT CHECK(avatar_source IN ('drive','static')) NULL,
  avatar_ref        TEXT NULL,
  avatar_focus_x    INTEGER NOT NULL DEFAULT 50,
  avatar_focus_y    INTEGER NOT NULL DEFAULT 35,
  motto             TEXT NOT NULL DEFAULT '',
  philosophy        TEXT NOT NULL DEFAULT '',
  bio               TEXT NULL,
  experience_years  INTEGER NOT NULL DEFAULT 0,
  teaching_hours    REAL NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE educations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  year_th    INTEGER NOT NULL,
  degree     TEXT NOT NULL,
  institute  TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT NULL
);

CREATE TABLE career_paths (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  period     TEXT NOT NULL,
  position   TEXT NOT NULL,
  school     TEXT NOT NULL DEFAULT '',
  is_current INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT NULL
);

-- ---------------------------------------------------------------------
--  3 ด้าน + 15 ตัวชี้วัด ตามเกณฑ์ วPA ว9/2564
-- ---------------------------------------------------------------------
CREATE TABLE domains (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        INTEGER NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color       TEXT NOT NULL DEFAULT '#1D4ED8',
  icon        TEXT NOT NULL DEFAULT '📚',
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE indicators (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id   INTEGER NOT NULL,
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
--  ผลงาน / หลักฐาน
-- ---------------------------------------------------------------------
CREATE TABLE works (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  indicator_id  INTEGER NOT NULL,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL,
  summary       TEXT NOT NULL DEFAULT '',
  content       TEXT NULL,
  academic_year INTEGER NOT NULL,
  semester      INTEGER NOT NULL DEFAULT 1,
  work_date     TEXT NULL,
  cover_source  TEXT CHECK(cover_source IN ('drive','static')) NULL,
  cover_ref     TEXT NULL,
  video_url     TEXT NOT NULL DEFAULT '',
  tags          TEXT NOT NULL DEFAULT '',
  view_count    INTEGER NOT NULL DEFAULT 0,
  is_featured   INTEGER NOT NULL DEFAULT 0,
  status        TEXT CHECK(status IN ('draft','published')) NOT NULL DEFAULT 'published',
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at    TEXT NULL,
  FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON DELETE CASCADE
);

CREATE TABLE work_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  work_id    INTEGER NOT NULL,
  source     TEXT CHECK(source IN ('drive','static')) NOT NULL DEFAULT 'drive',
  ref        TEXT NOT NULL,
  caption    TEXT NOT NULL DEFAULT '',
  width      INTEGER NOT NULL DEFAULT 0,
  height     INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
);

CREATE TABLE work_files (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  work_id       INTEGER NOT NULL,
  source        TEXT CHECK(source IN ('drive','static')) NOT NULL DEFAULT 'drive',
  ref           TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type     TEXT NOT NULL DEFAULT '',
  size_bytes    INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
--  ข้อตกลงในการพัฒนางาน (PA) แยกรายปีงบประมาณ
-- ---------------------------------------------------------------------
CREATE TABLE pa_agreements (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  fiscal_year       INTEGER NOT NULL,
  round             INTEGER NOT NULL DEFAULT 1,
  period_start      TEXT NULL,
  period_end        TEXT NULL,
  position          TEXT NOT NULL DEFAULT '',
  academic_standing TEXT NOT NULL DEFAULT '',
  school            TEXT NOT NULL DEFAULT '',
  affiliation       TEXT NOT NULL DEFAULT '',
  subject_group     TEXT NOT NULL DEFAULT '',
  teaching_hours    REAL NOT NULL DEFAULT 0,
  support_hours     REAL NOT NULL DEFAULT 0,
  status            TEXT CHECK(status IN ('draft','in_progress','evaluated')) NOT NULL DEFAULT 'draft',
  evaluation_score  REAL NULL,
  evaluation_result TEXT CHECK(evaluation_result IN ('pass','fail')) NULL,
  pdf_source        TEXT CHECK(pdf_source IN ('drive','static')) NULL,
  pdf_ref           TEXT NULL,
  pdf_name          TEXT NULL,
  note              TEXT NOT NULL DEFAULT '',
  created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at        TEXT NULL
);

CREATE TABLE pa_details (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  agreement_id      INTEGER NOT NULL,
  indicator_id      INTEGER NOT NULL,
  task_description  TEXT NOT NULL,
  expected_quantity TEXT NOT NULL DEFAULT '',
  expected_quality  TEXT NOT NULL DEFAULT '',
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agreement_id) REFERENCES pa_agreements(id) ON DELETE CASCADE,
  FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON DELETE CASCADE
);

CREATE TABLE pa_challenges (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  agreement_id      INTEGER NOT NULL,
  topic             TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  method            TEXT NOT NULL,
  expected_outcome  TEXT NOT NULL,
  created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agreement_id) REFERENCES pa_agreements(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
--  การพัฒนาตนเอง / รางวัล
-- ---------------------------------------------------------------------
CREATE TABLE self_developments (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  title               TEXT NOT NULL,
  organizer           TEXT NOT NULL DEFAULT '',
  type                TEXT CHECK(type IN ('อบรม','สัมมนา','ศึกษาดูงาน','PLC','วิทยากร')) NOT NULL DEFAULT 'อบรม',
  start_date          TEXT NULL,
  end_date            TEXT NULL,
  hours               INTEGER NOT NULL DEFAULT 0,
  fiscal_year         INTEGER NOT NULL,
  certificate_source  TEXT CHECK(certificate_source IN ('drive','static')) NULL,
  certificate_ref     TEXT NULL,
  note                TEXT NOT NULL DEFAULT '',
  summary             TEXT NOT NULL DEFAULT '',
  content             TEXT NULL,
  video_url           TEXT NOT NULL DEFAULT '',
  link_url            TEXT NOT NULL DEFAULT '',
  link_label          TEXT NOT NULL DEFAULT '',
  created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at          TEXT NULL
);

CREATE TABLE awards (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  awarder      TEXT NOT NULL DEFAULT '',
  level        TEXT CHECK(level IN ('โรงเรียน','เขตพื้นที่','จังหวัด','ภาค','ชาติ','นานาชาติ')) NOT NULL DEFAULT 'โรงเรียน',
  award_date   TEXT NULL,
  image_source TEXT CHECK(image_source IN ('drive','static')) NULL,
  image_ref    TEXT NULL,
  note         TEXT NOT NULL DEFAULT '',
  summary      TEXT NOT NULL DEFAULT '',
  content      TEXT NULL,
  video_url    TEXT NOT NULL DEFAULT '',
  link_url     TEXT NOT NULL DEFAULT '',
  link_label   TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at   TEXT NULL
);

-- รูป/ไฟล์แนบของรางวัลและการพัฒนาตนเอง (ใช้ตารางกลางร่วมกัน)
CREATE TABLE item_images (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT CHECK(entity_type IN ('award','self_dev')) NOT NULL,
  entity_id   INTEGER NOT NULL,
  source      TEXT CHECK(source IN ('drive','static')) NOT NULL DEFAULT 'drive',
  ref         TEXT NOT NULL,
  caption     TEXT NOT NULL DEFAULT '',
  width       INTEGER NOT NULL DEFAULT 0,
  height      INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE item_files (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type   TEXT CHECK(entity_type IN ('award','self_dev')) NOT NULL,
  entity_id     INTEGER NOT NULL,
  source        TEXT CHECK(source IN ('drive','static')) NOT NULL DEFAULT 'drive',
  ref           TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type     TEXT NOT NULL DEFAULT '',
  size_bytes    INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
--  ความปลอดภัย / ระบบ
-- ---------------------------------------------------------------------
CREATE TABLE login_attempts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ip         TEXT NOT NULL,
  username   TEXT NOT NULL DEFAULT '',
  success    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NULL,
  action     TEXT NOT NULL,
  table_name TEXT NOT NULL DEFAULT '',
  record_id  INTEGER NULL,
  detail     TEXT NOT NULL DEFAULT '',
  ip         TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_settings (
  key        TEXT NOT NULL PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
--  ดัชนี
-- ---------------------------------------------------------------------
CREATE UNIQUE INDEX uq_users_username ON users (username);
CREATE UNIQUE INDEX uq_domain_code    ON domains (code);
CREATE UNIQUE INDEX uq_work_slug      ON works (slug);
CREATE INDEX idx_ind_domain    ON indicators (domain_id, sort_order);
CREATE INDEX idx_works_ind     ON works (indicator_id, status, deleted_at);
CREATE INDEX idx_works_year    ON works (academic_year, deleted_at);
CREATE INDEX idx_wi_work       ON work_images (work_id, sort_order);
CREATE INDEX idx_wf_work       ON work_files (work_id, sort_order);
CREATE INDEX idx_pad_agreement ON pa_details (agreement_id, sort_order);
CREATE INDEX idx_sd_year       ON self_developments (fiscal_year, deleted_at);
CREATE INDEX idx_ii_entity     ON item_images (entity_type, entity_id, sort_order);
CREATE INDEX idx_if_entity     ON item_files (entity_type, entity_id, sort_order);
CREATE INDEX idx_la_ip         ON login_attempts (ip, created_at);
