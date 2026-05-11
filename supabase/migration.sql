-- =============================================
-- 야메(YAME) MVP 데이터베이스 스키마
-- Supabase SQL Editor에서 실행
-- =============================================

-- 1. teams 테이블
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- KBO 10개 팀 시드 데이터
INSERT INTO teams (id, name, city) VALUES
  ('KIA',  'KIA 타이거즈',   '광주'),
  ('LG',   'LG 트윈스',      '서울'),
  ('SSG',  'SSG 랜더스',     '인천'),
  ('KT',   'KT 위즈',        '수원'),
  ('NC',   'NC 다이노스',    '창원'),
  ('두산',  '두산 베어스',    '서울'),
  ('한화',  '한화 이글스',    '대전'),
  ('롯데',  '롯데 자이언츠',  '부산'),
  ('삼성',  '삼성 라이온즈',  '대구'),
  ('키움',  '키움 히어로즈',  '서울');

-- 2. profiles 테이블 (auth.users 확장)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT UNIQUE NOT NULL,
  favorite_team_id TEXT REFERENCES teams(id),
  rating_avg NUMERIC(2,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. games 테이블
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id TEXT REFERENCES teams(id) NOT NULL,
  away_team_id TEXT REFERENCES teams(id) NOT NULL,
  date DATE NOT NULL,
  time TIME,
  stadium TEXT,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','live','finished','cancelled')),
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. predictions 테이블
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  game_id UUID REFERENCES games(id) NOT NULL,
  prediction TEXT NOT NULL CHECK (prediction IN ('home','away','draw')),
  reason TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- 5. match_posts 테이블
CREATE TABLE match_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  game_id UUID REFERENCES games(id) NOT NULL,
  seat_area TEXT CHECK (seat_area IN ('1루','3루','외야','미정')),
  gender_pref TEXT CHECK (gender_pref IN ('무관','동성만')),
  group_size TEXT CHECK (group_size IN ('1:1','단체')),
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','closed','matched')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. match_requests 테이블
CREATE TABLE match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES match_posts(id) NOT NULL,
  requester_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 회원가입 시 profiles 자동 생성 트리거
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'user_' || substr(NEW.id::text, 1, 8)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

-- teams: 누구나 읽기
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_read" ON teams FOR SELECT USING (true);

-- profiles: 누구나 읽기, 본인만 수정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- games: 누구나 읽기
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games_read" ON games FOR SELECT USING (true);

-- predictions: 인증 유저만 생성, 같은 경기 유저 읽기
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predictions_read" ON predictions FOR SELECT USING (true);
CREATE POLICY "predictions_insert" ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "predictions_update" ON predictions FOR UPDATE
  USING (auth.uid() = user_id);

-- match_posts: 인증 유저만 생성, 전체 읽기
ALTER TABLE match_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match_posts_read" ON match_posts FOR SELECT USING (true);
CREATE POLICY "match_posts_insert" ON match_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "match_posts_update" ON match_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- match_requests: 인증 유저만 생성, 관련자만 읽기
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match_requests_read" ON match_requests FOR SELECT
  USING (
    auth.uid() = requester_id
    OR auth.uid() IN (
      SELECT user_id FROM match_posts WHERE id = post_id
    )
  );
CREATE POLICY "match_requests_insert" ON match_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "match_requests_update" ON match_requests FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM match_posts WHERE id = post_id
    )
  );

-- =============================================
-- 샘플 경기 데이터 (테스트용)
-- =============================================
-- 7. chat_messages 테이블 (응원토크)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 200),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_game_created
  ON chat_messages (game_id, created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_read" ON chat_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "chat_messages_insert" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- =============================================
-- 샘플 경기 데이터 (테스트용)
-- =============================================
INSERT INTO games (home_team_id, away_team_id, date, time, stadium, status) VALUES
  ('KIA',  'LG',   CURRENT_DATE, '18:30', '광주-기아 챔피언스 필드', 'scheduled'),
  ('SSG',  '두산', CURRENT_DATE, '18:30', '인천 SSG 랜더스필드', 'scheduled'),
  ('KT',   '한화', CURRENT_DATE, '18:30', '수원 KT 위즈 파크', 'scheduled'),
  ('NC',   '롯데', CURRENT_DATE, '18:30', '창원 NC 파크', 'scheduled'),
  ('삼성',  '키움', CURRENT_DATE, '18:30', '대구 삼성 라이온즈 파크', 'scheduled');

-- =============================================
-- 직관매칭 메시징 기능
-- =============================================

-- match_requests에 메시지 컬럼 추가
ALTER TABLE match_requests
  ADD COLUMN message TEXT CHECK (char_length(message) <= 100);

-- match_messages 테이블 (1:1 쪽지)
CREATE TABLE match_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES match_requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_match_messages_request_created
  ON match_messages (request_id, created_at);

ALTER TABLE match_messages ENABLE ROW LEVEL SECURITY;

-- RLS: 수락된 매칭의 두 당사자만 읽기/쓰기
CREATE POLICY "match_messages_read" ON match_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM match_requests mr
      JOIN match_posts mp ON mp.id = mr.post_id
      WHERE mr.id = request_id
        AND mr.status = 'accepted'
        AND (auth.uid() = mr.requester_id OR auth.uid() = mp.user_id)
    )
  );

CREATE POLICY "match_messages_insert" ON match_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM match_requests mr
      JOIN match_posts mp ON mp.id = mr.post_id
      WHERE mr.id = request_id
        AND mr.status = 'accepted'
        AND (auth.uid() = mr.requester_id OR auth.uid() = mp.user_id)
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE match_messages;

-- =============================================
-- KBO 팀 로고 URL 업데이트
-- =============================================
UPDATE teams SET logo_url = 'https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_HT.png' WHERE id = 'KIA';
UPDATE teams SET logo_url = 'https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_LG.png' WHERE id = 'LG';
UPDATE teams SET logo_url = 'https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_SK.png' WHERE id = 'SSG';
UPDATE teams SET logo_url = 'https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_KT.png' WHERE id = 'KT';
UPDATE teams SET logo_url = 'https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_NC.png' WHERE id = 'NC';
UPDATE teams SET logo_url = 'https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_OB.png' WHERE id = '두산';
UPDATE teams SET logo_url = 'https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_HH.png' WHERE id = '한화';
UPDATE teams SET logo_url = 'https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_LT.png' WHERE id = '롯데';
UPDATE teams SET logo_url = 'https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_SS.png' WHERE id = '삼성';
UPDATE teams SET logo_url = 'https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_WO.png' WHERE id = '키움';

-- =============================================
-- 직관 평점 (Rating System)
-- =============================================

CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID REFERENCES profiles(id) NOT NULL,
  rated_id UUID REFERENCES profiles(id) NOT NULL,
  match_request_id UUID REFERENCES match_requests(id) NOT NULL,
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT CHECK (char_length(comment) <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rater_id, match_request_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings_read" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "ratings_insert" ON ratings
  FOR INSERT WITH CHECK (
    auth.uid() = rater_id
    AND rater_id != rated_id
    AND EXISTS (
      SELECT 1 FROM match_requests mr
      JOIN match_posts mp ON mp.id = mr.post_id
      JOIN games g ON g.id = mp.game_id
      WHERE mr.id = match_request_id
        AND mr.status = 'accepted'
        AND g.status = 'finished'
        AND (
          (auth.uid() = mr.requester_id AND rated_id = mp.user_id)
          OR (auth.uid() = mp.user_id AND rated_id = mr.requester_id)
        )
    )
  );

-- 평점 후 profiles.rating_avg 자동 업데이트
CREATE OR REPLACE FUNCTION update_rating_avg()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET rating_avg = (
    SELECT ROUND(AVG(score)::numeric, 1)
    FROM ratings
    WHERE rated_id = NEW.rated_id
  )
  WHERE id = NEW.rated_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rating_insert
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_rating_avg();

-- =============================================
-- 응모/추첨 시스템 (Raffle System)
-- =============================================

CREATE TABLE raffle_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  prize TEXT NOT NULL DEFAULT '치킨 1마리',
  winner_count INT NOT NULL DEFAULT 10,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE raffle_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  round_id UUID REFERENCES raffle_rounds(id) NOT NULL,
  source TEXT NOT NULL DEFAULT 'prediction'
    CHECK (source IN ('prediction', 'bonus')),
  prediction_id UUID REFERENCES predictions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, prediction_id)
);

CREATE TABLE raffle_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES raffle_rounds(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(round_id, user_id)
);

-- RLS
ALTER TABLE raffle_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "raffle_rounds_read" ON raffle_rounds
  FOR SELECT USING (true);

ALTER TABLE raffle_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "raffle_tickets_read_own" ON raffle_tickets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "raffle_tickets_insert" ON raffle_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE raffle_winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "raffle_winners_read" ON raffle_winners
  FOR SELECT USING (true);

-- (응모권은 예측 적중 시 judge_predictions에서 발급)

-- 첫 번째 추첨 라운드
INSERT INTO raffle_rounds (round_number, start_date, end_date, prize, winner_count, status)
VALUES (1, date_trunc('week', CURRENT_DATE)::date, (date_trunc('week', CURRENT_DATE) + interval '6 days')::date, '치킨 1마리', 10, 'active');

-- =============================================
-- 경기 종료 시 예측 적중 자동 판정
-- =============================================

CREATE OR REPLACE FUNCTION judge_predictions()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  correct_prediction TEXT;
  active_round_id UUID;
BEGIN
  -- status가 finished로 변경되거나, finished 상태에서 스코어가 수정될 때 판정
  IF NEW.status = 'finished' AND (
    OLD.status IS DISTINCT FROM 'finished'
    OR OLD.home_score IS DISTINCT FROM NEW.home_score
    OR OLD.away_score IS DISTINCT FROM NEW.away_score
  ) THEN
    IF NEW.home_score > NEW.away_score THEN
      correct_prediction := 'home';
    ELSIF NEW.home_score < NEW.away_score THEN
      correct_prediction := 'away';
    ELSE
      correct_prediction := 'draw';
    END IF;

    UPDATE predictions
    SET is_correct = (prediction = correct_prediction)
    WHERE game_id = NEW.id;

    -- 기존 응모권 삭제 후 적중자에게만 재발급
    DELETE FROM raffle_tickets
    WHERE prediction_id IN (
      SELECT id FROM predictions WHERE game_id = NEW.id
    );

    SELECT id INTO active_round_id
    FROM raffle_rounds
    WHERE status = 'active'
      AND CURRENT_DATE BETWEEN start_date AND end_date
    LIMIT 1;

    IF active_round_id IS NOT NULL THEN
      INSERT INTO raffle_tickets (user_id, round_id, source, prediction_id)
      SELECT user_id, active_round_id, 'prediction', id
      FROM predictions
      WHERE game_id = NEW.id
        AND prediction = correct_prediction
      ON CONFLICT (user_id, prediction_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_game_finished
  AFTER UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION judge_predictions();

-- =============================================
-- games 테이블 unique index (Edge Function upsert용)
-- =============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_games_unique_matchup
  ON games (home_team_id, away_team_id, date);

-- =============================================
-- 선발투수 컬럼 추가
-- =============================================
ALTER TABLE games ADD COLUMN IF NOT EXISTS home_pitcher TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS away_pitcher TEXT;

-- =============================================
-- pg_cron: 경기 데이터 자동 수집
-- KST 10:00~23:00 매 1시간 (UTC 01:00~14:00)
-- + KST 21:00~22:30 매 15분 (경기 종료 시간대 집중)
-- 오늘 ±3일 (7일치) 수집, 변경분만 업데이트
-- =============================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'fetch-kbo-games-hourly',
  '0 1-14 * * *',
  $$
  SELECT net.http_post(
    url := 'https://qreaxunrhkdqwcgqmxcr.supabase.co/functions/v1/fetch-kbo-games',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 경기 종료 시간대 집중 수집 (KST 21:00~23:00, 매 15분)
SELECT cron.schedule(
  'fetch-kbo-games-frequent',
  '*/15 12-13 * * *',
  $$
  SELECT net.http_post(
    url := 'https://qreaxunrhkdqwcgqmxcr.supabase.co/functions/v1/fetch-kbo-games',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- =============================================
-- 직관 기록 (Attendance Record)
-- =============================================

-- attendance_records 테이블
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  game_id UUID REFERENCES games(id) NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('match', 'manual')),
  match_request_id UUID REFERENCES match_requests(id),
  memo TEXT CHECK (char_length(memo) <= 200),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- attendance_photos 테이블
CREATE TABLE attendance_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID REFERENCES attendance_records(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: attendance_records
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_records_read" ON attendance_records
  FOR SELECT USING (true);

CREATE POLICY "attendance_records_insert" ON attendance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "attendance_records_update" ON attendance_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "attendance_records_delete" ON attendance_records
  FOR DELETE USING (auth.uid() = user_id);

-- RLS: attendance_photos (본인만)
ALTER TABLE attendance_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_photos_read" ON attendance_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attendance_records
      WHERE id = attendance_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "attendance_photos_insert" ON attendance_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM attendance_records
      WHERE id = attendance_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "attendance_photos_delete" ON attendance_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM attendance_records
      WHERE id = attendance_id AND user_id = auth.uid()
    )
  );

-- Storage 정책: attendance-photos 버킷
CREATE POLICY "attendance_photos_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attendance-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "attendance_photos_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'attendance-photos');

CREATE POLICY "attendance_photos_remove"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attendance-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 사진 5장 제한 트리거
CREATE OR REPLACE FUNCTION check_attendance_photo_limit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM attendance_photos WHERE attendance_id = NEW.attendance_id) >= 5 THEN
    RAISE EXCEPTION '사진은 경기당 최대 5장까지 업로드할 수 있습니다.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_photo_limit
  BEFORE INSERT ON attendance_photos
  FOR EACH ROW EXECUTE FUNCTION check_attendance_photo_limit();

-- 경기 종료 시 매칭 성사 유저에게 직관 기록 자동 생성
CREATE OR REPLACE FUNCTION auto_create_attendance()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'finished' AND OLD.status IS DISTINCT FROM 'finished' THEN
    INSERT INTO attendance_records (user_id, game_id, source, match_request_id)
    SELECT DISTINCT sub.uid, NEW.id, 'match', sub.request_id
    FROM (
      -- 매칭 글 작성자
      SELECT mp.user_id AS uid, mr.id AS request_id
      FROM match_posts mp
      JOIN match_requests mr ON mr.post_id = mp.id
      WHERE mp.game_id = NEW.id AND mr.status = 'accepted'
      UNION
      -- 매칭 신청자
      SELECT mr.requester_id AS uid, mr.id AS request_id
      FROM match_requests mr
      JOIN match_posts mp ON mp.id = mr.post_id
      WHERE mp.game_id = NEW.id AND mr.status = 'accepted'
    ) sub
    ON CONFLICT (user_id, game_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_game_finished_attendance
  AFTER UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION auto_create_attendance();

-- =============================================
-- 예측 적중률 랭킹 뷰
-- =============================================
CREATE OR REPLACE VIEW prediction_rankings AS
SELECT
  p.id AS user_id,
  p.nickname,
  p.favorite_team_id,
  t.name AS team_name,
  COUNT(pr.id) AS total_predictions,
  COUNT(pr.id) FILTER (WHERE pr.is_correct IS NOT NULL) AS judged,
  COUNT(pr.id) FILTER (WHERE pr.is_correct = true) AS correct,
  CASE
    WHEN COUNT(pr.id) FILTER (WHERE pr.is_correct IS NOT NULL) > 0
    THEN ROUND(
      (COUNT(pr.id) FILTER (WHERE pr.is_correct = true)::numeric /
       COUNT(pr.id) FILTER (WHERE pr.is_correct IS NOT NULL)::numeric) * 100, 1
    )
    ELSE 0
  END AS accuracy_pct
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
LEFT JOIN teams t ON t.id = p.favorite_team_id
GROUP BY p.id, p.nickname, p.favorite_team_id, t.name
HAVING COUNT(pr.id) FILTER (WHERE pr.is_correct IS NOT NULL) >= 5;

-- =============================================
-- pg_cron: 치킨 추첨 자동화 (매주 일요일 KST 00:05)
-- =============================================
SELECT cron.schedule(
  'draw-raffle-weekly',
  '5 15 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://qreaxunrhkdqwcgqmxcr.supabase.co/functions/v1/draw-raffle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- =============================================
-- 노쇼 대비 시스템
-- =============================================

-- match_requests에 노쇼 신고 컬럼 추가
ALTER TABLE match_requests
  ADD COLUMN no_show_reported_by UUID REFERENCES profiles(id);

-- profiles에 노쇼 횟수 컬럼 추가
ALTER TABLE profiles
  ADD COLUMN no_show_count INT DEFAULT 0;

-- 노쇼 신고 시 카운트 증가 트리거
CREATE OR REPLACE FUNCTION handle_no_show_report()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF NEW.no_show_reported_by IS NOT NULL AND OLD.no_show_reported_by IS NULL THEN
    IF NEW.no_show_reported_by = NEW.requester_id THEN
      SELECT user_id INTO target_user_id FROM match_posts WHERE id = NEW.post_id;
    ELSE
      target_user_id := NEW.requester_id;
    END IF;

    UPDATE profiles
    SET no_show_count = no_show_count + 1
    WHERE id = target_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_no_show_report
  AFTER UPDATE ON match_requests
  FOR EACH ROW EXECUTE FUNCTION handle_no_show_report();

-- RLS: 글 주인 OR 수락된 신청자 본인이 no_show 신고 가능하도록 확장
DROP POLICY IF EXISTS "match_requests_update" ON match_requests;
CREATE POLICY "match_requests_update" ON match_requests FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM match_posts WHERE id = post_id
    )
    OR (auth.uid() = requester_id AND status = 'accepted')
  );

-- =============================================
-- 팀 변경 월 1회(30일) 제한
-- =============================================

-- profiles에 팀 변경 시각 기록 컬럼
ALTER TABLE profiles
  ADD COLUMN team_changed_at TIMESTAMPTZ;

-- 기존 데이터: 팀이 설정된 유저는 가입일을 team_changed_at으로 설정
UPDATE profiles SET team_changed_at = created_at WHERE favorite_team_id IS NOT NULL;

-- 팀 변경 제한 트리거
CREATE OR REPLACE FUNCTION check_team_change_limit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.favorite_team_id IS NOT NULL
    AND NEW.favorite_team_id IS DISTINCT FROM OLD.favorite_team_id
    AND OLD.team_changed_at IS NOT NULL
    AND OLD.team_changed_at > now() - interval '30 days'
  THEN
    RAISE EXCEPTION '팀 변경은 30일에 1회만 가능합니다. 다음 변경 가능일: %',
      (OLD.team_changed_at + interval '30 days')::date;
  END IF;

  IF NEW.favorite_team_id IS DISTINCT FROM OLD.favorite_team_id THEN
    NEW.team_changed_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_team_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION check_team_change_limit();

-- =============================================
-- 구단 순위표 (SQL 뷰)
-- =============================================

CREATE OR REPLACE VIEW team_standings_view AS
WITH results AS (
  SELECT home_team_id AS team_id,
    CASE WHEN home_score > away_score THEN 1 ELSE 0 END AS win,
    CASE WHEN home_score < away_score THEN 1 ELSE 0 END AS loss,
    CASE WHEN home_score = away_score THEN 1 ELSE 0 END AS draw
  FROM games
  WHERE status = 'finished'
    AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
  UNION ALL
  SELECT away_team_id AS team_id,
    CASE WHEN away_score > home_score THEN 1 ELSE 0 END AS win,
    CASE WHEN away_score < home_score THEN 1 ELSE 0 END AS loss,
    CASE WHEN home_score = away_score THEN 1 ELSE 0 END AS draw
  FROM games
  WHERE status = 'finished'
    AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
)
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.logo_url,
  COALESCE(SUM(r.win), 0)::int AS wins,
  COALESCE(SUM(r.loss), 0)::int AS losses,
  COALESCE(SUM(r.draw), 0)::int AS draws,
  COALESCE(SUM(r.win) + SUM(r.loss) + SUM(r.draw), 0)::int AS games_played,
  CASE WHEN COALESCE(SUM(r.win) + SUM(r.loss), 0) > 0
    THEN ROUND(SUM(r.win)::numeric / (SUM(r.win) + SUM(r.loss))::numeric, 3)
    ELSE 0
  END AS win_rate,
  RANK() OVER (ORDER BY
    CASE WHEN COALESCE(SUM(r.win) + SUM(r.loss), 0) > 0
      THEN SUM(r.win)::numeric / (SUM(r.win) + SUM(r.loss))::numeric
      ELSE 0 END DESC
  ) AS rank
FROM teams t
LEFT JOIN results r ON r.team_id = t.id
GROUP BY t.id, t.name, t.logo_url;
