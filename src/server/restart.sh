cd /opt
sudo rm -r krew2.io
sudo git clone --depth=1 https://Krewio:QqstZahYs3kUzF9du3Yq9rM43VuLR2zt@github.com/Krew-io/krew2.io.git
cd /opt/krew2.io
npm i
pm2 stop all
pm2 kill
npm run prod