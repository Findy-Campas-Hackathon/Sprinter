-- Seed data: realistic dummy data for development
-- Password for all seed users: "password123"
-- bcrypt hash generated with cost 10

DO $$
DECLARE
  v_admin_id INTEGER;
  v_user1_id INTEGER;
  v_user2_id INTEGER;
  v_user3_id INTEGER;
  v_user4_id INTEGER;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Skip if seed data already exists
  IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com') THEN
    RETURN;
  END IF;

  -- Users
  INSERT INTO users (email, password_hash, name, role)
  VALUES ('admin@example.com', '$2a$10$2pllxyJt9d1Pbd42Vnckp.o3Jjm72UhVGTuk7ryndpg0hJ64izsUa', '管理者 田中', 'admin')
  RETURNING id INTO v_admin_id;

  INSERT INTO users (email, password_hash, name, role)
  VALUES ('sato@example.com', '$2a$10$2pllxyJt9d1Pbd42Vnckp.o3Jjm72UhVGTuk7ryndpg0hJ64izsUa', '佐藤 美咲', 'user')
  RETURNING id INTO v_user1_id;

  INSERT INTO users (email, password_hash, name, role)
  VALUES ('suzuki@example.com', '$2a$10$2pllxyJt9d1Pbd42Vnckp.o3Jjm72UhVGTuk7ryndpg0hJ64izsUa', '鈴木 健太', 'user')
  RETURNING id INTO v_user2_id;

  INSERT INTO users (email, password_hash, name, role)
  VALUES ('takahashi@example.com', '$2a$10$2pllxyJt9d1Pbd42Vnckp.o3Jjm72UhVGTuk7ryndpg0hJ64izsUa', '高橋 あゆみ', 'user')
  RETURNING id INTO v_user3_id;

  INSERT INTO users (email, password_hash, name, role)
  VALUES ('watanabe@example.com', '$2a$10$2pllxyJt9d1Pbd42Vnckp.o3Jjm72UhVGTuk7ryndpg0hJ64izsUa', '渡辺 翔太', 'user')
  RETURNING id INTO v_user4_id;

  -- Events (10 events across all categories with realistic content)
  -- Event 1: ハッカソン (Hackathon)
  INSERT INTO events (title, description, start_datetime, end_datetime, category, max_participants, organizer_id)
  VALUES (
    '春のAIハッカソン 2026',
    '生成AIを活用したプロダクトを48時間で開発するハッカソンです。チームでもソロでも参加OK！優勝チームには豪華賞品あり。初心者も大歓迎、メンターがサポートします。',
    v_now + interval '1 day', v_now + interval '3 days',
    'ハッカソン', 20, v_admin_id
  );

  -- Event 2: 勉強会 (Study Session)
  INSERT INTO events (title, description, start_datetime, end_datetime, category, max_participants, organizer_id)
  VALUES (
    'Go言語ハンズオン勉強会 〜基礎から学ぶ並行処理〜',
    'Go言語のgoroutineとchannelを使った並行処理をハンズオン形式で学びます。実際にコードを書きながら基礎から応用まで段階的に理解を深めましょう。ノートPC必須。',
    v_now + interval '2 days', v_now + interval '2 days 3 hours',
    '勉強会', 10, v_user1_id
  );

  -- Event 3: LT会 (Lightning Talk)
  INSERT INTO events (title, description, start_datetime, end_datetime, category, max_participants, organizer_id)
  VALUES (
    '第15回 テック系LT大会 〜推し技術を5分で語れ！〜',
    '自分の好きな技術・ツール・ライブラリを5分のLTで紹介するイベントです。発表者も聴講のみも歓迎。LT後は懇親会も予定しています。',
    v_now + interval '3 days', v_now + interval '3 days 2 hours',
    'LT会', 30, v_user2_id
  );

  -- Event 4: もくもく会 (Silent Co-working)
  INSERT INTO events (title, description, start_datetime, end_datetime, category, max_participants, organizer_id)
  VALUES (
    'フロントエンドもくもく会 vol.12',
    'React, Next.js, Vue.js などフロントエンド技術に取り組むもくもく会です。各自の課題を持ち込んで集中して作業しましょう。途中で質問・相談タイムもあります。',
    v_now + interval '4 days', v_now + interval '4 days 4 hours',
    'もくもく会', 15, v_user3_id
  );

  -- Event 5: その他 (Other)
  INSERT INTO events (title, description, start_datetime, end_datetime, category, max_participants, organizer_id)
  VALUES (
    'エンジニアキャリア座談会 〜新卒3年目のリアル〜',
    '新卒3年目のエンジニア3名が、キャリアの悩み・転職・スキルアップについて本音で語ります。質疑応答の時間もたっぷり用意しています。',
    v_now + interval '5 days', v_now + interval '5 days 2 hours',
    'その他', 5, v_user4_id
  );

  -- Event 6: 勉強会
  INSERT INTO events (title, description, start_datetime, end_datetime, category, max_participants, organizer_id)
  VALUES (
    'Docker & Kubernetes 入門ワークショップ',
    'コンテナ技術の基礎からKubernetesでのデプロイまでを一気に学ぶワークショップです。実際にクラスタを構築してアプリをデプロイする実践形式で進めます。',
    v_now + interval '6 days', v_now + interval '6 days 4 hours',
    '勉強会', 8, v_admin_id
  );

  -- Event 7: ハッカソン
  INSERT INTO events (title, description, start_datetime, end_datetime, category, max_participants, organizer_id)
  VALUES (
    'サステナビリティ×テック ミニハッカソン',
    '環境問題・社会課題をテクノロジーで解決するアイデアを1日で形にするミニハッカソンです。SDGsをテーマにしたプロトタイプ開発に挑戦しましょう。',
    v_now + interval '7 days', v_now + interval '7 days 10 hours',
    'ハッカソン', 12, v_user2_id
  );

  -- Event 8: LT会
  INSERT INTO events (title, description, start_datetime, end_datetime, category, max_participants, organizer_id)
  VALUES (
    'しくじりエンジニアLT 〜失敗から学んだこと〜',
    '本番障害、設計ミス、技術選定の失敗...エンジニアなら誰しも経験する「しくじり」をLT形式で共有し合うイベントです。笑いあり学びありの90分。',
    v_now + interval '8 days', v_now + interval '8 days 1.5 hours',
    'LT会', 6, v_user1_id
  );

  -- Event 9: その他
  INSERT INTO events (title, description, start_datetime, end_datetime, category, max_participants, organizer_id)
  VALUES (
    'OSS コントリビュート体験会',
    'OSSへの初めてのコントリビュートを体験するイベントです。Issue選びからPR作成まで、メンターと一緒に進めます。Git/GitHubの基本操作ができればOK。',
    v_now + interval '9 days', v_now + interval '9 days 3 hours',
    'その他', 9, v_user3_id
  );

  -- Event 10: もくもく会
  INSERT INTO events (title, description, start_datetime, end_datetime, category, max_participants, organizer_id)
  VALUES (
    '朝活もくもく会 〜早起きしてコード書こう〜',
    '毎週土曜の朝8時から開催するオンラインもくもく会です。朝の静かな時間に集中して個人開発を進めましょう。最初と最後に目標共有・成果発表タイムあり。',
    v_now + interval '10 days', v_now + interval '10 days 3 hours',
    'もくもく会', 18, v_user4_id
  );

  -- Participants
  INSERT INTO participants (event_id, user_id) VALUES
    (1, v_admin_id), (1, v_user1_id), (1, v_user2_id), (1, v_user3_id),
    (2, v_user1_id), (2, v_user2_id),
    (3, v_user2_id), (3, v_user3_id), (3, v_user4_id),
    (4, v_user3_id), (4, v_user4_id),
    (5, v_user4_id),
    (6, v_admin_id), (6, v_user1_id),
    (7, v_user2_id), (7, v_user3_id),
    (8, v_user1_id), (8, v_user4_id),
    (9, v_user3_id),
    (10, v_user4_id), (10, v_admin_id), (10, v_user2_id);

  RAISE NOTICE 'Seed data inserted successfully';
END;
$$;
