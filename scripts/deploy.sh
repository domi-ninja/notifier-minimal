#!/bin/bash
set -e

cd $(dirname $0)
cd ..
npx expo export --platform web

export VERCEL_ORG_ID="team_uJW950BeuxJ0BwHvWVzDLG8M"
export VERCEL_PROJECT_ID="prj_pFj4Po9ef3CZW3kqdUcfXCIxKmt4"
npx vercel dist --prod --yes