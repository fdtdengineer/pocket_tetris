# Pocket Tetris

iPhone・Android・PCで遊べる、GitHub Pages向けのレスポンシブなテトリス風Webゲームです。

## 特徴

- ビルド不要。HTML / CSS / JavaScriptのみ
- iPhoneを含むスマホ画面に自動調整
- タッチボタン対応
- PCの十字キー対応
- ハードドロップ、ホールド、次ブロック表示
- 一時停止、ゴースト表示、レベルアップ
- PWA対応。ホーム画面に追加可能
- Service Workerによるオフラインキャッシュ

## 操作

### PC

- `←` / `→`: 左右移動
- `↓`: ソフトドロップ
- `↑`: 回転
- `Space`: ハードドロップ
- `C`: ホールド
- `P` または `Esc`: 一時停止

### スマホ

画面下部のタッチボタンを使用します。左右移動と下移動は長押しにも対応しています。

## ローカル起動

Service Workerを含めて確認する場合は、ファイルを直接開かず簡易HTTPサーバーを使ってください。

```bash
python -m http.server 8000
```

その後、ブラウザで `http://localhost:8000` を開きます。

## GitHub Pages

このリポジトリにはGitHub Pages用のActionsワークフローが含まれています。リポジトリの `Settings` → `Pages` でSourceを `GitHub Actions` に設定すると、`main` ブランチへの更新時に自動公開されます。

公開URL:

```text
https://fdtdengineer.github.io/pocket_tetris/
```

Pages deployment trigger: 2026-07-19

## ライセンス

MIT License
