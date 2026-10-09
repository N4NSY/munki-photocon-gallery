# むんきちゃんフォトコン Photo Gallery

`#むんきフォトコン` の公開応募作品を見返すための静的フォトギャラリーです。

- 開催期間: 2026-09-20 ～ 2026-10-03
- 応募投稿: 329
- 掲載写真: 505
- 公開先: https://n4nsy.github.io/munki-photocon-gallery/

## 機能

### ギャラリー

Pinterest風のMasonryレイアウトで応募作品を一覧表示します。

- 1投稿を1作品として表示
- 複数画像投稿は1つの作品としてまとめて表示
- 一覧では長辺800px以下のWebPサムネイルを使用
- 作品を開くと投稿者名・Xユーザー名・元投稿リンクを確認可能
- 縦横比を維持し、画像をクロップせず表示

### 1枚ずつ

505枚の写真を画像単位で1枚ずつ閲覧できます。

- 縦長・横長とも中央配置
- 左右スワイプ対応
- 画像の左右をクリック / タップして前後移動
- シャッフル表示
- 投稿者名・Xユーザー名・元投稿リンクを表示
- 同一投稿に複数画像がある場合は「投稿内 1/4」のように表示
- 通信節約モードや低速回線でない場合、前後1枚だけ先読み

### 保存済み

気になった作品をブラウザ内に保存できます。

- 保存単位は「画像」ではなく「投稿 / 作品」
- `localStorage` にのみ保存
- サーバーへの送信なし
- 他ユーザーからは見えない
- 別端末・別ブラウザとの同期なし
- ブラウザのサイトデータを削除すると保存内容も消えます

### ブラウザ操作

サイト内の画面遷移はブラウザ履歴に対応しています。

- 戻る / 進む
- マウスのサイドボタン
- 詳細表示から元のギャラリー位置へ復帰
- 作品URLの直接共有

## 表示仕様

詳細表示と「1枚ずつ」では元画像をそのまま使用し、CSSの `object-fit: contain` を基本として縦横比と構図を維持します。

一覧表示だけは通信量削減のため、`thumbs/` に生成したWebPサムネイルを利用します。元画像ファイルは変更しません。

PC・スマートフォンの両方に対応し、iOS Safariでは `VisualViewport` を利用してブラウザUIを含む実際の表示領域に合わせて調整しています。

## 自動生成アセット

`scripts/generate_assets.py` と GitHub Actions により、以下を自動生成します。

- `thumbs/*.webp`: 一覧用サムネイル
- `assets/ogp.jpg`: X / Discord等のリンクプレビュー用画像
- `data/gallery.json` 内の `thumb` / `thumbWidth` / `thumbHeight`

`images/` または生成スクリプトが更新されると、`.github/workflows/generate-assets.yml` が再生成して `main` にコミットします。

## 技術構成

外部フレームワーク・DB・バックエンドは使用していません。

```text
munki-photocon-gallery/
├─ index.html
├─ notice.html
├─ favicon.svg
├─ style.css
├─ app.js
├─ .nojekyll
├─ README.md
├─ NOTICE.md
├─ .github/
│  └─ workflows/
│     └─ generate-assets.yml
├─ scripts/
│  └─ generate_assets.py
├─ assets/
│  └─ ogp.jpg
├─ data/
│  └─ gallery.json
├─ thumbs/
│  ├─ 0001.webp
│  ├─ ...
│  └─ 0505.webp
└─ images/
   ├─ 0001.jpg
   ├─ ...
   └─ 0505.jpg
```

- HTML
- CSS
- Vanilla JavaScript
- GitHub Pages
- GitHub Actions
- Pillow（アセット生成時のみ）

## データ

`data/gallery.json` に、表示に必要な作品情報を保持しています。

主な項目:

- X投稿ID
- 投稿者ID
- Xユーザー名
- プロフィール表示名
- 元投稿URL
- 投稿日時
- 元画像ファイル名・サイズ
- サムネイルファイル名・サイズ
- 投稿内画像番号

表示名・ユーザー名などは収集時点の情報です。X側で変更された場合、サイト内表示と現在のプロフィールが一致しない場合があります。

元投稿リンクはユーザー名変更の影響を受けにくい `https://x.com/i/web/status/<tweet_id>` 形式を使用しています。

## ローカル確認

`index.html` を直接開くと、ブラウザの制約により `fetch()` が失敗する場合があります。

```bash
python -m http.server 8000
```

その後 `http://localhost:8000/` を開いてください。

## GitHub Pages

`main` ブランチの `/ (root)` をGitHub Pagesとして公開します。

## 掲載・権利について

このサイトは `#むんきフォトコン` に公開投稿された応募作品を見返しやすくする目的で作成しています。

- 各画像・作品の権利は各投稿者・権利者に帰属します
- Repositoryへの掲載は、第三者への転載・再利用・再配布を許諾するものではありません
- 公開Like数・ランキング・コメント機能はありません
- 元のX投稿への導線を設けています
- 掲載取り下げの希望があった場合は対応します

詳細は [NOTICE.md](NOTICE.md) および公開サイトの [掲載について・削除依頼](https://n4nsy.github.io/munki-photocon-gallery/notice.html) を参照してください。

## License

このRepositoryには現在、OSSライセンスを付与していません。

特に `images/`、`thumbs/`、`data/` および応募作品由来のアセットは、将来コード部分にライセンスを付与する場合でも自動的にその対象にはしません。
