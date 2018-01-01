# abort on first error
set -e

# get latest changes from repo
git fetch --all
git reset --hard origin/master

# set port to 80
sed -i -E 's/port: [0-9]+/port: 80/g' app-configs.js

npm install --only=production
npm run build:prod

pm2 delete all
pm2 start server/server.js

echo Successfully deployed!
