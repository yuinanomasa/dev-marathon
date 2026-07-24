#!/bin/bash
# 使用方法: deploy_test.sh <ユーザー名>
# このスクリプトはユーザーのウェブディレクトリに最新のコードを更新し、
# ユーザーの環境に対してCypressテストを実行する自動化処理を行います。

# コマンドが非ゼロステータスで終了した場合、直ちにスクリプトを終了します。
set -e

# 第一引数をユーザー名として割り当てます。
USER_NAME=$1

# ユーザー名が提供されているかどうかを確認します。
if [ -z "$USER_NAME" ]; then
    echo "エラー: ユーザー名が提供されていません。"
    echo "使用方法: $0 hir-yokoyama"
    exit 1
fi

# アプリとウェブディレクトリの基本パスを定義します。
APP_DIR="/app/$USER_NAME"
WEB_DIR="/usr/share/nginx/html/$USER_NAME"
CYPRESS_DIR="/ci"

# gitリポジトリから最新の変更を引き出します。
cd "$APP_DIR"
git pull

# nginxのhtmlディレクトリに更新されたソースファイルをコピーします。
rm -rf "$WEB_DIR"/*
cp -ipr ./src/web/* "$WEB_DIR/"
