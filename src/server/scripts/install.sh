# This is a redundant file. Use this only at the very beginning of installation, or refer to the README for its usage.

# Install utilities.
apt-get install nginx git ufw fail2ban

# Download nvm.
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash 
source ~/.profile

# Install Node.JS via nvm.
nvm install 14.16.0
npm i -g npm

# Install PM2 globally.
npm i pm2 -g

# Clone repositories.
cd /opt

git clone --depth=1 https://krewiogit:J5nETmjUkf59z9A@github.com/Krew-io/krew2.io.git
git clone --depth=1 https://github.com/Krew-io/krew-wiki.git

cd krew2.io

# Unlink the old NGINX configuration.
unlink /etc/nginx/sites-enabled/default

# Copy the NGINX configuration from the repository to the working directory.
cp nginx.conf /etc/nginx/sites-available/krew.conf
ln -s /etc/nginx/sites-available/krew.conf /etc/nginx/sites-enabled/krew.conf

# Copy SSL certificates from repository.
mkdir -p /etc/letsencrypt/live/krew.io
mkdir -p /etc/letsencrypt/live/wiki.krew.io

cp src/server/certs/* /etc/letsencrypt/live/krew.io/
cp src/server/certs/* /etc/letsencrypt/live/wiki.krew.io/

# Restart NGINX.
systemctl restart nginx

# Get MongoDB repository key.
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

# Update available packages and install MongoDB.
apt-get update
apt-get install -y mongodb-org

# Start MongoDB
systemctl enable --now mongod

# Build and run the project.
npm i
npm run prod