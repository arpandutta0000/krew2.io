# Krew.io
This is the production repository (working title) for Krew.io.

### Prequisites
 * Node.js v14
 * NPM v7
 * NGINX
 * MongoDB

**Running in development**
``npm run dev``

**Running in production** (using pm2 to keep process alive)
``npm run prod``

Running in production mode serves to ``localhost:8200``.
Running in dev mode serves to ``localhost:8080``.

In production, Nginx proxies the local webfront port to 443 and redirects 80 to 443. 

## Webserver Setup


### Install needed utilities.

```sh
cd ~
apt-get install nginx git ufw fail2ban

# Download nvm.
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash 
source ~/.profile

# Install Node.JS via nvm.
nvm install 14.16.0
npm i -g npm

# Install PM2 globally.
npm i pm2 -g

# Get MongoDB repository key.
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

# Update available packages and install MongoDB.
apt-get update
apt-get install -y mongodb-org

# Start MongoDB
systemctl enable --now mongod
```

### Clone repositories.

```sh
cd /opt

git clone --depth=1 https://krewiogit:J5nETmjUkf59z9A@github.com/Krew-io/krew2.io.git
git clone --depth=1 https://github.com/Krew-io/krew-wiki.git
```

### Get SSL Certificate

If the SSL certificate is not present, get one via LetsEncrypt.

```sh
# Install certbot
apt-get install certbot

# Make sure NGINX is not running during this process. This is not necessary if it is not installed yet.
systemctl stop nginx

certbot --certonly -d krew.io
certbot --certonly -d wiki.krew.io
```

Otherwise, if you have a wildcard certificate, copy it from the repository into working directories.
```sh
# Create folders for the certificates to go into.
mkdir -p /etc/letsencrypt/live/krew.io
mkdir -p /etc/letsencrypt/live/wiki.krew.io

# Copy the certificates from the repository.
cp /opt/krew2.io/src/server/certs/* /etc/letsencrypt/live/krew.io/
cp /opt/krew2.io/src/server/certs/* /etc/letsencrypt/live/wiki.krew.io/
```

### Configure NGINX.

```sh
# Unlink the old NGINX configuration.
unlink /etc/nginx/sites-enabled/default

# Copy the NGINX configuration from the repository to the working directory.
cp /opt/krew2.io/nginx.conf /etc/nginx/sites-available/krew.conf
ln -s /etc/nginx/sites-available/krew.conf /etc/nginx/sites-enabled/krew.conf

# Restart NGINX.
systemctl restart nginx
```

### Build and run the project.
```sh
cd /opt/krew2.io

npm i
npm run prod
```


## Admin Commands
 ```
 ;;login
 ```
 - Set playerEntity.isAdmin to ``true`` (otherwise other admin commands won't work).

 ```
 ;;say <message>
 ```
 - Send an admin message to all players online.

 ```
 ;;whois <seadog123>
 ```
 - Get player ID of specified seadog (in this case seadog123).

 ```
 ;;kick <Identifier> [reason]
 ```
 - Disconnect a player's socket connection (kick them) and display reason on his screen.
 - Identifier can be either a playerID or displayname.
 - Reason is optional.

 ```
 ;;ban <Identifier> [reason]
 ```
 - Disconnect a player's socket connection (kick them) and display reason on his screen.
 - Additionally adds them to the permanent ban list, barrciading them from using their account.
 - Identifier can be either a playerID or displayname.
 - Reason is optional.

 ```
 ;;unban <Identifier>
 ```
 - Removes a user from the permanent ban list and sends a webhook to Discord.
 - Identifier can be either a playerID or displayname.
 - Reason is optional.

 ```
 ;;nick <name>
 ```
 - Set the name in the chat to a specified string (for easier admin communication).

 ```
 ;;restart
 ```
 - Saves the current game progress of all players which are logged in. Then, disconnects all players from the server.
 - Detailed information about how to smoothly restart the server is located further down in this document.

 ## Mod Commands
 ```
 ;;login
 ```
 - Set playerEntity.isMod to ``true`` (otherwise other mod commands won't work).

 ```
 ;;report <Identifier> [reason]
 ```
 - Report a player (sends him a warning and a webhook message to Discord. When a player gets reported the second time, he is kicked from the server).

 ```
 ;;mute <Identifier> [reason]
 ```
 - Mute a player (for 5 minutes) and display a message to him telling him that he has been muted. Sends a webhook message to Discord with the reason.

 ```
 ;;tempban <Identifier> [reason]
 ```
 - Temporarily ban a player.

 ```
 ;;ban <Identifier> [reason]
 ```
 - Permanently ban an account. This player will be unable to use this account

## Smooth Server Restart
 - Login to the game with your user account.
 - Authenticate yourself as admin in the chat:
 ```
 ;;login
 ```

 - Save the current progress of all players and "kick" them from the game.
 ```
 ;;update
 ```
 - The game will automatically kick all players and pull the latest commit from GitHub. Once done, it will restart itself and allow players to join back.


## Documentation

### Network Types

 ```
 -1: Entity
 0: Player
 1: Boat    
 2: Projectile
 3: Impact
 4: Pickup ( Fish / crab / shell / cargo / chest)
 5: Island
 ```

### Ship States

 ```
 -1: Starting
 0: Sailing
 1: Docking
 2: Finished Docking
 3: Anchored
 4: Departing
 ```

### Projectiles

 ```
 0: Cannonball
 1: Fishing Hook
 ```

### Weapons

 ```
 -1: Nothing
 0: Cannon
 1: Fishing Rod
 2: Telescope
 ```
