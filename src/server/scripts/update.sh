cd /opt
sudo rm -r krew2.io
sudo git clone --depth=1 https://krewio-git:jf83sod*du&HDmr83ms034j0JQJKdoes0@github.com/Krew-io/krew2.io.git
cd /opt/krew2.io
npm i
npm run build
pm2 restart all