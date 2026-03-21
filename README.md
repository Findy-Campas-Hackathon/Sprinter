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

## ログイン

- `POST /v1/auth/login` は、入力された `email`（フロントでは「メールアドレス or ユーザー名」）でユーザーを検索します。
- メールで見つからない場合は、ユーザー名 `name` でも検索します（メール未登録のユーザーもログイン可能）。

## TablePlus で DB に接続する

Docker コンテナが起動している状態で、以下のコマンドで TablePlus を開けます:

```bash
open -a TablePlus "postgresql://postgres:postgres@127.0.0.1:5432/sprinter?name=HackSprinter&statusColor=007F3D&env=Local"
```

または手動で接続する場合:

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

## マイページプロフィール更新

自分のプロフィール（`name` / `avatar_url`）を更新できます。

- `PUT /v1/auth/me`
- 認証: `Authorization: Bearer <JWT>`
- リクエスト例:
  ```json
  { "name": "新しい名前", "avatar_url": "https://example.com/avatar.png" }
  ```
- `avatar_url` は空文字 / 未指定で未設定（`NULL` 扱い）になります。

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
