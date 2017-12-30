# get latest changes from repo
git fetch --all
git reset --hard origin/master

# set port to 80
sed -i -E 's/port: [0-9]+/port: 80/g' app-configs.js

npm run build:prod
node server/server.js
