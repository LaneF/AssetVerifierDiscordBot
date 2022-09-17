# Asset Store Invoice Verifier Bot
This is a Discord bot that will verify Invoice Numbers from the Unity Asset Store API and assign a role to the user submitting the invoice for verification.

Forum Support link:
https://forum.unity.com/threads/free-invoice-verifier-bot-for-discord.1034953/

![The bot help response](help.png?raw=true "Help")

# Functional Process
1. A user in your server DMs the bot an invoice number.
2. The bot uses the UAS web API to verify it.
3. If it contains a product name that matches something in the hard-coded map then it assigns the generic "Verified" role and the corresponding asset Role.
4. User now has XYZ role(s), and can see channels restricted to those roles.
5. The bot dumps a message into your 'report' or 'audit' channel about what it did.

# Base Requirements
* Create a Application/Bot through Discord's developer dashboard.
* Clone this repo to your own private repo and hook the Heroku app into it.
* Assign your Secret Discord Bot Token in Heroku Settings (named **DISCORD_TOKEN**)
* Assign your Secret UAS API Token in Heroku Settings (named **UAS_TOKEN**)
* **Modify** the code to suit your server **channel IDs, role IDs, and Asset Names**. (really only some stuff in the first ~30 lines)
* Give your bot a role in your server that allows it to assign roles to users, read messages, see the appropriate channels, etc.

Note: If you're in a sale/megabundle then there may be unique asset names eg "Your Asset" vs "Your Asset (fill-your-toolbox)".

Make sure all of the Role IDs, Channel IDs, etc correspond properly to your server's specific properties. Heroku will throw errors if Discord has issues with anything you've got setup and you need to troubleshoot those issues if they occur. Fortunately, the errors are easy to follow and you can correlate them to things easily.

# Heroku Setup
Currently I am running this on Heroku using a worker dyno. If you have a CC on file with Heroku then you get 1,000h/mo for free which covers the bot entirely. Below is the video I used to figure out how to set it up. You can hook Heroku into GitHub directly to auto-update when you issue commits to your bot repo.

[![Heroku Setup Tutorial](https://img.youtube.com/vi/OFearuMjI4s/0.jpg)](https://www.youtube.com/watch?v=OFearuMjI4s)

Heroku will reboot the app every day, so if you are trying to add any features where you cache data then be sure to do it in a safe/static place.

# Discord Setup
You need to setup a unique bot for yourself in the Discord application dashboard.
https://discord.com/developers/applications

You will also need to get the Channel IDs, the Role IDs and Guild ID from your Discord desktop application. You can do this by putting Discord into Developer mode (Settings > Advanced) and getting access to new right-click options in the app to fetch IDs needed for your bot (Dont use the included ones, those are IDs to my servers stuff and wont work for you).

# Repl.it alternative
You can host this on other services such as Repl.it but you need to use a service like uptimerobot and run an express app inside the bot to ping the app every few minutes to prevent the host from sleeping it. This was the original way the bot was designed, but repl.it things got buggy after they started to monetize always-on features. This is not recommended anymore.
