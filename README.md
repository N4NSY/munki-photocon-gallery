# むんきちゃんフォトコン Photo Gallery

`#むんきフォトコン` の公開応募作品を、Pinterest風のギャラリーと「1作品ずつ見る」モードで閲覧する静的サイトです。

## 主な仕様

- 1ツイート = 1作品
- 複数画像投稿は1作品内で切り替え
- Pinterest風Masonry一覧
- Tinder風の「1作品ずつ見る」モード
- お気に入りはブラウザの `localStorage` に保存（他人には見えません）
- 公開Like数・ランキング・コメントなし
- 元のX投稿へのリンクあり
- `#tweet_id` で特定作品を直接共有可能
- サーバー / DB / 外部ライブラリ不要

## 画像について

今回の初版は**元画像をリサイズ・クロップしていません**。
CSSで表示サイズだけを整え、作品の縦横比と構図を維持しています。`loading="lazy"` で画面付近の画像から読み込みます。

505枚をすべてスクロールすると通信量は大きくなるため、アクセスが増えた場合は後からWebPサムネイルを追加するのがおすすめです。

## GitHub Pagesで公開する

1. GitHubで新しいRepositoryを作成（例: `munki-photocon-gallery`）
2. このフォルダの**中身**をRepository直下へpush
3. `Settings` → `Pages`
4. `Build and deployment` → Source: `Deploy from a branch`
5. Branch: `main` / Folder: `/ (root)` → Save

公開URL例:

```text
https://<GitHubユーザー名>.github.io/munki-photocon-gallery/
```

## ローカル確認

`index.html` を直接開くと `fetch()` がブロックされる場合があります。Pythonがあればフォルダ内で:

```bash
python -m http.server 8000
```

その後 `http://localhost:8000/` を開いてください。

## データ

- `data/gallery.json`: 作品・投稿者・画像情報
- 表示名とusernameは収集時点の情報
- Xリンクはusername変更の影響を受けにくい `https://x.com/i/web/status/<tweet_id>` を使用

## 権利について

このRepositoryに含まれる画像について、第三者への再利用許諾を示すものではありません。
