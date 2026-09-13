<?php
/**
 * export-from-php.php — ย้ายข้อมูลจากเทมเพลต PHP เดิม มาเป็น SQL ของ schema ใหม่
 *
 * อ่านได้ทั้งฐานข้อมูล SQLite ของเทมเพลต และ MySQL ของเว็บตัวจริง
 * เขียนเป็นไฟล์ .sql ที่นำเข้า Turso ได้ทันที (ไม่แตะต้นทางเลย อ่านอย่างเดียว)
 *
 * วิธีใช้
 *   php scripts/export-from-php.php --sqlite=/path/to/portfolio.sqlite \
 *       --uploads=/path/to/uploads --out=db/migrated.sql --copy
 *
 *   php scripts/export-from-php.php --config=/path/to/config/config.php \
 *       --uploads=/path/to/uploads --out=db/migrated.sql --copy
 *
 *   --copy  คัดลอกไฟล์รูป/เอกสารเดิมไปไว้ใน public/media/ ด้วย
 *           เว็บใหม่จะแสดงผลได้ทันทีโดยยังไม่ต้องย้ายอะไรขึ้น Google Drive
 *           (ภายหลังค่อยทยอยเปลี่ยนทีละรูปเป็นลิงก์ Drive ในหน้าหลังบ้าน)
 */
declare(strict_types=1);

$opt = getopt('', ['sqlite:', 'config:', 'uploads:', 'out:', 'copy']);
$out = $opt['out'] ?? __DIR__ . '/../db/migrated.sql';
$uploadsDir = isset($opt['uploads']) ? rtrim($opt['uploads'], '/') : null;
$doCopy = isset($opt['copy']);
$publicMedia = __DIR__ . '/../public/media';

function fail(string $m): never { fwrite(STDERR, "ผิดพลาด: $m\n"); exit(1); }

/* ---------------- เชื่อมต่อต้นทาง ---------------- */
if (isset($opt['sqlite'])) {
    is_file($opt['sqlite']) || fail("ไม่พบไฟล์ {$opt['sqlite']}");
    $pdo = new PDO('sqlite:' . $opt['sqlite'], null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $srcLabel = 'SQLite ' . basename($opt['sqlite']);
} elseif (isset($opt['config'])) {
    is_file($opt['config']) || fail("ไม่พบไฟล์ {$opt['config']}");
    $cfg = require $opt['config'];
    $d = $cfg['db'] ?? $cfg;
    if (($d['driver'] ?? 'mysql') === 'sqlite') {
        $pdo = new PDO('sqlite:' . $d['path'], null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $srcLabel = 'SQLite (จาก config)';
    } else {
        $pdo = new PDO(
            "mysql:host={$d['host']};dbname={$d['database']};charset=utf8mb4",
            $d['username'], $d['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        $srcLabel = "MySQL {$d['database']}";
    }
} else {
    fail("ต้องระบุ --sqlite=... หรือ --config=... อย่างใดอย่างหนึ่ง");
}

/* ---------------- ตัวช่วย ---------------- */
$q = fn($v) => $v === null ? 'NULL' : "'" . str_replace("'", "''", (string)$v) . "'";
$n = fn($v) => $v === null || $v === '' ? 'NULL' : (string)(0 + $v);
$i = fn($v) => (string)(int)$v;

$stats = ['ตาราง' => 0, 'แถว' => 0, 'ไฟล์ที่คัดลอก' => 0, 'ไฟล์ที่หาไม่เจอ' => 0];
$warn = [];

/** แปลง path ไฟล์เดิม → คู่ (source, ref) ของ schema ใหม่ + คัดลอกไฟล์ถ้าสั่ง --copy */
$media = function (?string $path) use ($uploadsDir, $doCopy, $publicMedia, &$stats, &$warn, $q): array {
    $path = trim((string)$path);
    if ($path === '') return ['NULL', 'NULL'];
    $rel = 'media/' . ltrim($path, '/');
    if ($uploadsDir !== null) {
        $abs = $uploadsDir . '/' . ltrim($path, '/');
        if (is_file($abs)) {
            if ($doCopy) {
                $dest = $publicMedia . '/' . ltrim($path, '/');
                if (!is_dir(dirname($dest))) { mkdir(dirname($dest), 0775, true); }
                if (!is_file($dest) && copy($abs, $dest)) { $stats['ไฟล์ที่คัดลอก']++; }
            }
        } else {
            $stats['ไฟล์ที่หาไม่เจอ']++;
            if (count($warn) < 5) { $warn[] = $path; }
        }
    }
    return ["'static'", $q($rel)];
};

/** ดึงทุกแถวของตาราง ข้ามตารางที่ไม่มีในต้นทาง */
$all = function (string $table) use ($pdo): array {
    try { return $pdo->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC); }
    catch (Throwable $e) { return []; }
};

$sql = [];
$sql[] = "-- migrated.sql — สร้างโดย scripts/export-from-php.php";
$sql[] = "-- ต้นทาง: $srcLabel  ·  เวลา: " . date('Y-m-d H:i:s');
$sql[] = "-- นำเข้า: turso db shell <ชื่อฐานข้อมูล> < db/migrated.sql";
$sql[] = "";
$sql[] = "PRAGMA foreign_keys = OFF;";
$sql[] = "BEGIN TRANSACTION;";
$sql[] = "";

$emit = function (string $table, array $rows, callable $row) use (&$sql, &$stats) {
    if (!$rows) return;
    $sql[] = "-- $table (" . count($rows) . " แถว)";
    foreach ($rows as $r) { $sql[] = $row($r); }
    $sql[] = "";
    $stats['ตาราง']++;
    $stats['แถว'] += count($rows);
};

/* ---------------- โปรไฟล์ครู ---------------- */
$emit('teacher_profile', $all('teacher_profile'), function ($r) use ($q, $i, $media) {
    [$src, $ref] = $media($r['avatar_path'] ?? null);
    return "UPDATE teacher_profile SET "
        . "full_name={$q($r['full_name'])}, nickname={$q($r['nickname'])}, position={$q($r['position'])}, "
        . "academic_standing={$q($r['academic_standing'])}, subject_group={$q($r['subject_group'])}, "
        . "school={$q($r['school'])}, affiliation={$q($r['affiliation'])}, area_office={$q($r['area_office'])}, "
        . "email={$q($r['email'])}, phone={$q($r['phone'])}, facebook={$q($r['facebook'])}, line_id={$q($r['line_id'])}, "
        . "avatar_source=$src, avatar_ref=$ref, "
        . "motto={$q($r['motto'])}, philosophy={$q($r['philosophy'])}, bio={$q($r['bio'])}, "
        . "experience_years={$i($r['experience_years'])}, teaching_hours={$r['teaching_hours']} "
        . "WHERE id=1;";
});

/* ---------------- ประวัติ ---------------- */
$emit('educations', $all('educations'), fn($r) =>
    "INSERT INTO educations (id, year_th, degree, institute, sort_order, deleted_at) VALUES "
    . "({$i($r['id'])}, {$i($r['year_th'])}, {$q($r['degree'])}, {$q($r['institute'])}, {$i($r['sort_order'])}, {$q($r['deleted_at'])});");

$emit('career_paths', $all('career_paths'), fn($r) =>
    "INSERT INTO career_paths (id, period, position, school, is_current, sort_order, deleted_at) VALUES "
    . "({$i($r['id'])}, {$q($r['period'])}, {$q($r['position'])}, {$q($r['school'])}, {$i($r['is_current'])}, {$i($r['sort_order'])}, {$q($r['deleted_at'])});");

/* ---------------- ผลงาน ---------------- */
$emit('works', $all('works'), function ($r) use ($q, $i, $n, $media) {
    [$src, $ref] = $media($r['cover_image'] ?? null);
    return "INSERT INTO works (id, indicator_id, title, slug, summary, content, academic_year, semester, work_date, "
        . "cover_source, cover_ref, video_url, tags, view_count, is_featured, status, created_at, deleted_at) VALUES ("
        . "{$i($r['id'])}, {$i($r['indicator_id'])}, {$q($r['title'])}, {$q($r['slug'])}, {$q($r['summary'])}, "
        . "{$q($r['content'])}, {$i($r['academic_year'])}, {$i($r['semester'])}, {$q($r['work_date'])}, "
        . "$src, $ref, {$q($r['video_url'])}, {$q($r['tags'])}, {$i($r['view_count'])}, {$i($r['is_featured'])}, "
        . "{$q($r['status'])}, {$q($r['created_at'])}, {$q($r['deleted_at'])});";
});

$emit('work_images', $all('work_images'), function ($r) use ($q, $i, $media) {
    [$src, $ref] = $media($r['file_path']);
    return "INSERT INTO work_images (id, work_id, source, ref, caption, width, height, sort_order) VALUES ("
        . "{$i($r['id'])}, {$i($r['work_id'])}, $src, $ref, {$q($r['caption'])}, "
        . "{$i($r['width'])}, {$i($r['height'])}, {$i($r['sort_order'])});";
});

$emit('work_files', $all('work_files'), function ($r) use ($q, $i, $media) {
    [$src, $ref] = $media($r['file_path']);
    return "INSERT INTO work_files (id, work_id, source, ref, original_name, mime_type, size_bytes) VALUES ("
        . "{$i($r['id'])}, {$i($r['work_id'])}, $src, $ref, {$q($r['original_name'])}, "
        . "{$q($r['mime_type'])}, {$i($r['size_bytes'])});";
});

/* ---------------- ข้อตกลง PA ---------------- */
$emit('pa_agreements', $all('pa_agreements'), function ($r) use ($q, $i, $n, $media) {
    [$src, $ref] = $media($r['pdf_path'] ?? null);
    return "INSERT INTO pa_agreements (id, fiscal_year, round, period_start, period_end, position, academic_standing, "
        . "school, affiliation, subject_group, teaching_hours, support_hours, status, evaluation_score, evaluation_result, "
        . "pdf_source, pdf_ref, pdf_name, note, deleted_at) VALUES ("
        . "{$i($r['id'])}, {$i($r['fiscal_year'])}, {$i($r['round'])}, {$q($r['period_start'])}, {$q($r['period_end'])}, "
        . "{$q($r['position'])}, {$q($r['academic_standing'])}, {$q($r['school'])}, {$q($r['affiliation'])}, "
        . "{$q($r['subject_group'])}, {$r['teaching_hours']}, {$r['support_hours']}, {$q($r['status'])}, "
        . "{$n($r['evaluation_score'])}, {$q($r['evaluation_result'])}, $src, $ref, {$q($r['pdf_name'])}, "
        . "{$q($r['note'])}, {$q($r['deleted_at'])});";
});

$emit('pa_details', $all('pa_details'), fn($r) =>
    "INSERT INTO pa_details (id, agreement_id, indicator_id, task_description, expected_quantity, expected_quality, sort_order) VALUES ("
    . "{$i($r['id'])}, {$i($r['agreement_id'])}, {$i($r['indicator_id'])}, {$q($r['task_description'])}, "
    . "{$q($r['expected_quantity'])}, {$q($r['expected_quality'])}, {$i($r['sort_order'])});");

$emit('pa_challenges', $all('pa_challenges'), fn($r) =>
    "INSERT INTO pa_challenges (id, agreement_id, topic, problem_statement, method, expected_outcome) VALUES ("
    . "{$i($r['id'])}, {$i($r['agreement_id'])}, {$q($r['topic'])}, {$q($r['problem_statement'])}, "
    . "{$q($r['method'])}, {$q($r['expected_outcome'])});");

/* ---------------- การพัฒนาตนเอง / รางวัล ---------------- */
$emit('self_developments', $all('self_developments'), function ($r) use ($q, $i, $media) {
    [$src, $ref] = $media($r['certificate_path'] ?? null);
    return "INSERT INTO self_developments (id, title, organizer, type, start_date, end_date, hours, fiscal_year, "
        . "certificate_source, certificate_ref, note, summary, content, video_url, link_url, link_label, deleted_at) VALUES ("
        . "{$i($r['id'])}, {$q($r['title'])}, {$q($r['organizer'])}, {$q($r['type'])}, {$q($r['start_date'])}, "
        . "{$q($r['end_date'])}, {$i($r['hours'])}, {$i($r['fiscal_year'])}, $src, $ref, {$q($r['note'])}, "
        . "{$q($r['summary'] ?? '')}, {$q($r['content'] ?? null)}, {$q($r['video_url'] ?? '')}, "
        . "{$q($r['link_url'] ?? '')}, {$q($r['link_label'] ?? '')}, {$q($r['deleted_at'])});";
});

$emit('awards', $all('awards'), function ($r) use ($q, $i, $media) {
    [$src, $ref] = $media($r['image_path'] ?? null);
    return "INSERT INTO awards (id, title, awarder, level, award_date, image_source, image_ref, note, summary, "
        . "content, video_url, link_url, link_label, deleted_at) VALUES ("
        . "{$i($r['id'])}, {$q($r['title'])}, {$q($r['awarder'])}, {$q($r['level'])}, {$q($r['award_date'])}, "
        . "$src, $ref, {$q($r['note'])}, {$q($r['summary'] ?? '')}, {$q($r['content'] ?? null)}, "
        . "{$q($r['video_url'] ?? '')}, {$q($r['link_url'] ?? '')}, {$q($r['link_label'] ?? '')}, {$q($r['deleted_at'])});";
});

$emit('item_images', $all('item_images'), function ($r) use ($q, $i, $media) {
    [$src, $ref] = $media($r['file_path']);
    return "INSERT INTO item_images (id, entity_type, entity_id, source, ref, caption, width, height, sort_order) VALUES ("
        . "{$i($r['id'])}, {$q($r['entity_type'])}, {$i($r['entity_id'])}, $src, $ref, {$q($r['caption'])}, "
        . "{$i($r['width'])}, {$i($r['height'])}, {$i($r['sort_order'])});";
});

$emit('item_files', $all('item_files'), function ($r) use ($q, $i, $media) {
    [$src, $ref] = $media($r['file_path']);
    return "INSERT INTO item_files (id, entity_type, entity_id, source, ref, original_name, mime_type, size_bytes, sort_order) VALUES ("
        . "{$i($r['id'])}, {$q($r['entity_type'])}, {$i($r['entity_id'])}, $src, $ref, {$q($r['original_name'])}, "
        . "{$q($r['mime_type'])}, {$i($r['size_bytes'])}, {$i($r['sort_order'])});";
});

/* ---------------- ตั้งค่า + บัญชีผู้ดูแล ---------------- */
$emit('site_settings', $all('site_settings'), fn($r) =>
    "INSERT INTO site_settings (key, value) VALUES ({$q($r['key'])}, {$q($r['value'])}) "
    . "ON CONFLICT(key) DO UPDATE SET value=excluded.value;");

$emit('users', $all('users'), fn($r) =>
    "INSERT INTO users (id, username, password_hash, full_name, role) VALUES ("
    . "{$i($r['id'])}, {$q($r['username'])}, {$q($r['password_hash'])}, {$q($r['full_name'])}, {$q($r['role'])});");

$sql[] = "COMMIT;";
$sql[] = "PRAGMA foreign_keys = ON;";

if (!is_dir(dirname($out))) { mkdir(dirname($out), 0775, true); }
file_put_contents($out, implode("\n", $sql) . "\n");

echo "อ่านจาก : $srcLabel\n";
echo "เขียนที่ : $out\n";
foreach ($stats as $k => $v) { printf("  %-16s %s\n", $k, number_format($v)); }
if ($warn) {
    echo "  ไฟล์ตัวอย่างที่หาไม่เจอ: " . implode(', ', array_slice($warn, 0, 3)) . "\n";
}
echo "\nขั้นต่อไป:\n";
echo "  turso db shell <ชื่อฐานข้อมูล> < db/schema.sql\n";
echo "  turso db shell <ชื่อฐานข้อมูล> < db/seed-core.sql\n";
echo "  turso db shell <ชื่อฐานข้อมูล> < $out\n";
