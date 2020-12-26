cd /opt/krew2.io
sudo rm -r node_modules
sudo git clone --depth=1 https://github.com/Krew-io/krew2-io.git
sudo npm i
pm2 restart all