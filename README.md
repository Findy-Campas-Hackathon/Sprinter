# HackSprinter

エンジニア向けイベント管理プラットフォーム

## 技術スタック

### Backend
- **言語**: Go 1.25
- **フレームワーク**: [Echo v4](https://echo.labstack.com/)
- **DB**: PostgreSQL 16
- **DB ドライバ**: [pgx v5](https://github.com/jackc/pgx)
- **認証**: JWT ([golang-jwt v5](https://github.com/golang-jwt/jwt))

### Frontend
- **フレームワーク**: [Next.js 16](https://nextjs.org/) (Turbopack)
- **言語**: TypeScript 5
- **UI**: React 19
- **CSS**: Tailwind CSS 4

### インフラ
- Docker / Docker Compose
- PostgreSQL 16 (Alpine)

## セットアップ

```bash
docker compose up --build
```

| サービス | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8081 |
| PostgreSQL | localhost:5432 |

## TablePlus で DB に接続する

Docker コンテナが起動している状態で、TablePlus から以下の設定で接続できます。

1. TablePlus を開き、左下の **「+」** → **「New Connection」** → **「PostgreSQL」** を選択
2. 以下の接続情報を入力:

| 項目 | 値 |
|------|-----|
| **Name** | HackSprinter (任意) |
| **Host** | `127.0.0.1` |
| **Port** | `5432` |
| **User** | `postgres` |
| **Password** | `postgres` |
| **Database** | `sprinter` |

3. **「Test」** ボタンで接続確認（全項目が緑になれば OK）
4. **「Connect」** で接続

### DB スキーマ

接続すると以下のテーブルが確認できます:

- **users** - ユーザー情報（email, name, role 等）
- **events** - イベント情報（title, category, max_participants 等）
- **participants** - イベント参加者（event_id, user_id の中間テーブル）

## プロジェクト構成

```
HackSprinter/
├── backend/
│   ├── cmd/                  # エントリポイント
│   ├── db/init/              # DB スキーマ (初期化 SQL)
│   └── pkg/
│       ├── db/               # DB 接続
│       ├── internal/domain/  # ドメインモデル
│       └── server/           # HTTP サーバー・ルーティング
├── frontend/
│   ├── app/                  # Next.js App Router
│   └── ...
└── docker-compose.yml
```
