# Asset Store Invoice Verifier Bot
This is a Discord bot that will verify Invoice Numbers from the Unity Asset Store API and assign a role to the user submitting the invoice for verification.

![The bot help response](help.png?raw=true "Help")

# Functional Process
1. A user in your server DMs the bot an invoice number.
2. The bot uses the UAS web API to verify it.
3. If it contains a product name that matches something in the hard-coded map then it assigns the corresponding Role and reports the action to the discord report channel.
4. User now has XYZ role(s), and can see channels restricted to those roles.

# Base Requirements
* Create a Application/Bot through Discord's developer dashboard.
* Assign your Secret Discord Bot Token in Heroku Settings
* Assign your Secret UAS API Token in Heroku Settings
* Modify the code to suit your server channel IDs role IDs and asset names.

# Heroku Setup
Currently I am running this on Heroku using a worker dyno. If you have a CC on file with Heroku then you get 1,000h/mo for free which covers the bot entirely. Below is the video I used to figure out how to set it up. You can hook Heroku into GitHub directly to auto-update when you issue commits to your bot repo.
[![Heroku Setup Tutorial](https://img.youtube.com/vi/OFearuMjI4s/0.jpg)](https://www.youtube.com/watch?v=OFearuMjI4s)

# Discord Setup
You need to setup a unique bot for yourself in the Discord application dashboard.
https://discord.com/developers/applications

You will also need to get the Channel IDs, the Role IDs and Guild ID from your Discord desktop application. You can do this by putting Discord into Developer mode (Settings > Advanced) and getting access to new right-click options in the app to fetch IDs needed for your bot (Dont use the included ones, those are IDs to my servers stuff and wont work for you).

# Repl.it alternative
You can host this on other services such as Repl.it but you need to use a service like uptimerobot and run an express app inside the bot to ping the app every few minutes to prevent the host from sleeping it. This was the original way the bot was designed, but repl.it things got buggy after they started to monetize always-on features.