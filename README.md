# krew2
This is the repository for a remake of Krew.io.

**Running in development** (using grunt-nodemon as a watchscript)
``npm run dev``

**Running in production** (using forever to keep process alive)
``npm run prod``

Running in production mode serves to ``localhost:8200``.
Running in dev mode serves to ``localhost:8080``.

In production, Nginx proxies the local webfront port to 443 and redirects 80 to 443. 

### Admin Commands
 ```
 !!login <password>
 ```
 - Set playerEntity.isAdmin to ``true`` (otherwise other admin commands won't work).

 ```
 !!say <message>
 ```
 - Send an admin message to all players online.

 ```
 !!whois <seadog123>
 ```
 - Get player ID of specified seadog (in this case seadog123).

 ```
 !!kick <Identifier> [reason]
 ```
 - Disconnect a player's socket connection (kick them) and display reason on his screen.
 - Identifier can be either a playerID or displayname.
 - Reason is optional.

 ```
 !!ban <Identifier> [reason]
 ```
 - Disconnect a player's socket connection (kick them) and display reason on his screen.
 - Additionally adds them to the permanent ban list, barrciading them from using their account.
 - Identifier can be either a playerID or displayname.
 - Reason is optional.

 ```
 !!unban <Identifier>
 ```
 - Removes a user from the permanent ban list and sends a webhook to Discord.
 - Identifier can be either a playerID or displayname.
 - Reason is optional.

 ```
 !!nick <name>
 ```
 - Set the name in the chat to a specified string (for easier admin communication).

 ```
 !!restart
 ```
 - Saves the current game progress of all players which are logged in. Then, disconnects all players from the server.
 - Detailed information about how to smoothly restart the server is located further down in this document.

 ### Mod Commands
 ```
 //login <password>
 ```
 - Set playerEntity.isMod to ``true`` (otherwise other mod commands won't work).

 ```
 //report <Identifier> [reason]
 ```
 - Report a player (sends him a warning and a webhook message to Discord. When a player gets reported the second time, he is kicked from the server).

 ```
 //mute <Identifier> [reason]
 ```
 - Mute a player (for 5 minutes) and display a message to him telling him that he has been muted. Sends a webhook message to Discord with the reason.

 ```
 //tempban <Identifier> [reason]
 ```
 - Temporarily ban a player.

 ```
 //ban <Identifier> [reason]
 ```
 - Permanently ban an account. This player will be unable to use this account

## Smooth Server Restart
 - Login to the game with your user account.
 - Authenticate yourself as admin in the chat:
 ```
 !!login <password>
 ```

 - Inform players about the upcoming server restart.
 ```
 !!say Server is restarting in 5 minutes for an update.
 ```

 - Save the current progress of all players and "kick" them from the game.
 - Be prepared to stop the tmux session immediately after this command (before players manage to reconnect again).
 ```
 !!restart
 ```

 - Enter the tmux session (do this via command line).
 ```
 ssh root@155.138.227.17
 tmux a
 ```

 - After running the `tmux a` command you should see the game logs in real time. Be careful what you do whiel connected to the tmux session, it can have massive impact on the game.
 - Type `npm run stop` to kill the application (this will stop the game). Then run the following command:
 ```
 npm run prod
 ```
 - Now you shoudl see the game logs arriving again.
 - To exit the tmux session press `Control + B` and then `D`.

## Installation Guide for MongoDB
 - Install the npm package for MongoDB:
 ```
 npm i mongodb
 ```

 - Check if MongoDB server is already installed.
 ```
 apt list -- installed | grep mongodb
 ```
 - If not, get the public key.
 ```
 wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -
 ```

 - Check your linux distribution (and version) and get the correct command (this one is for Ubuntu 16.04).
 ```
 uname -i
 echp "deb [ archo=amd64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list
 ```

 - Update the available packages and install MongoDB.
 ```
 apt update
 apt install -y mongodb-org
 ```
 - Check if MongoDB is running. If it is not, restart the service (either through the service command or systemctl).
 ```
 service mongod status
 service mongod restart
 ```

## Documentation

#### netType (network types):
 ```
 -1: Entity
 0: Player
 1: Boat
 2: Projectile
 3: Impact
 4: Pickup ( Fish / crab / shell / cargo / chest)
 5: Island
 6: Bot
 ```

#### Ship states:
 ```
 -1: Starting
 0: Sailing
 1: Docking
 2: Finished Docking
 3: Anchored
 4: Departing
 ```

#### Projectiles:
 ```
 0: Cannonball
 1: Fishing Hook
 ```

#### Weapons:
 ```
 -1: Nothing
 0: Cannon
 1: Fishing Rod
