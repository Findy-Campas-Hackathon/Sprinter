-- ユーザーテーブル
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,  -- bcryptでハッシュ化
    name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),  -- 画像URLまたはS3のパス
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- メールアドレスの検索高速化
CREATE INDEX idx_users_email ON users(email);

-- イベントテーブル
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,  -- 最大2000文字はアプリケーション側で制御
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE,  -- 任意
    category VARCHAR(50) NOT NULL CHECK (category IN ('勉強会', 'ハッカソン', 'LT会', 'もくもく会', 'その他')),
    max_participants INTEGER NOT NULL CHECK (max_participants >= 1 AND max_participants <= 100),
    location_url VARCHAR(500),  -- 任意
    organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 開催日時での検索・ソートの高速化
CREATE INDEX idx_events_start_datetime ON events(start_datetime);
-- 主催者での絞り込み高速化
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
-- カテゴリーでの絞り込み高速化
CREATE INDEX idx_events_category ON events(category);

-- 参加者テーブル（多対多の中間テーブル）
CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- 同じユーザーが同じイベントに重複参加できないようにする
    CONSTRAINT unique_event_user UNIQUE(event_id, user_id)
);

-- イベントごとの参加者取得の高速化
CREATE INDEX idx_participants_event_id ON participants(event_id);
-- ユーザーごとの参加イベント取得の高速化
CREATE INDEX idx_participants_user_id ON participants(user_id);

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- usersテーブルの更新日時自動更新
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- eventsテーブルの更新日時自動更新
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### ER図（テキスト表現）
```
users (1) ──< organizer_id (N) events
users (N) ──< participants >── (N) events

users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── name
├── avatar_url
├── created_at
└── updated_at

events
├── id (PK)
├── title
├── description
├── start_datetime
├── end_datetime
├── category
├── max_participants
├── location_url
├── organizer_id (FK → users.id)
├── created_at
└── updated_at

participants
├── id (PK)
├── event_id (FK → events.id)
├── user_id (FK → users.id)
└── joined_at
    UNIQUE(event_id, user_id)