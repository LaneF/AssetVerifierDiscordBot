// ===================
// Informational Links
// ===================
//
// === Setup up Discord App and Bot + Set UptimeRobot
// https://youtu.be/SPTfmiYiuok?t=113
// https://youtu.be/SPTfmiYiuok?t=3817
//
// === DiscordAPIError: Missing Permission
// https://support.glitch.com/t/discordapierror-missing-permission/12519/2
//
// === Eric's original bot code
// https://repl.it/@sonicbloomeric/Unity-AS-Invoice-Verification-Bot#index.js
//
// === Discord Server ID
// To get Guild ID and Channel IDs, put discord into Developer mode and right click the server/channel to reveal "Copy ID".
//
// === UAS Store API Key & Docs
// https://publisher.assetstore.unity3d.com/verify-invoice.html
// https://api.assetstore.unity3d.com/api-docs/#!/invoice

const discord = require("discord.js");
const express = require("express");
const fs = require("fs");
const https = require("https");

// ===================
// = EXPRESS/DISCORD =
// ===================
const app = express();
app.get("/", (req, res) => {res.send("Still alive!");});
app.listen(3000, () => console.log("Started Listening..."));
const client = new discord.Client();

// Credentials/Secrets stored as environment variables. See: https://docs.repl.it/repls/secret-keys
const DISCORD_TOKEN               = process.env.DISCORD_TOKEN;              // Discord API Token - this lets this code log into Discord as the Bot.
const DISCORD_GUILD_ID            = process.env.DISCORD_GUILD_ID;           // Discord Guild (Server) ID - this is your Discord server ID.
const DISCORD_REPORT_CHANNEL_ID   = process.env.DISCORD_REPORT_CHANNEL_ID;  // Discord Channel for Verified Reports - "Copy ID" on the private channel.
const UAS_HOST                    = "api.assetstore.unity3d.com";           // Asset Store API Domain (never changes)
const UAS_PATH                    = process.env.UAS_PATH;                   // Asset Store API Endpoint (see below)
const ROLE_NAME                   = process.env.ROLE_NAME;                  // The name of the role to assign when invoice is verified

// Example: (your store api key is mashed in here. we slap the invoice number on the end to ship it to Unity.)
// UAS_PATH=/publisher/v1/invoice/verify.json?key=**__STORE_API_KEY__**&invoice=

// Map of Product Name to Discord Server Role name.
// Add custom role assignments for products here.
const assetToRoleMap = new Map();
assetToRoleMap.set("Vault Core", ROLE_NAME);
assetToRoleMap.set("Vault Inventory", ROLE_NAME);
assetToRoleMap.set("Vault Inventory (fill-your-toolbox)", ROLE_NAME);
assetToRoleMap.set("Vault Attributes", ROLE_NAME);
assetToRoleMap.set("Prodigy", ROLE_NAME);
assetToRoleMap.set("Zed", ROLE_NAME);
assetToRoleMap.set("That Hurt! Damage Floaties", ROLE_NAME);
assetToRoleMap.set("Deftly: Top Down Shooter Framework", ROLE_NAME);
assetToRoleMap.set("Quinn Stylized Animset", ROLE_NAME);
assetToRoleMap.set("Stylized Fantasy Character Pack", ROLE_NAME);

client.on("ready", () => {console.log("Connected!");});
client.on("message", message => 
{
    // Early fail options.
    if (message.author.bot) return;
    if (message.channel.type != "dm") return;

    // Disable gracefully. (when true)
    if (false)
    {
      message.channel.send(`I'm currently offline! A human will get me up and running soon. Sorry for the inconvenience!`);
      return;
    }

    // ======================
    // PARSE THE MESSAGE FROM THE USER
    // ======================
    if (message.cleanContent.length > 15) // UAS API responds 500 if you give it more than 15 characters. Will this be forever? Who knows. Could we handle this better? Yep.
    {
      message.channel.send(`... _${message.cleanContent}_ does not look like a valid invoice or order id. Here is some help:`);
      respondWithHelp(message);
      return;
    }
    if (/^\d+$/.test(message.cleanContent)) // UAS orders are always complete numbers. test for it.
    {
      message.channel.send(`... Looks like an Asset Store _order id_ ! I'm looking into it... (_${message.cleanContent}_)`);
      validateAssetStore(message);
      return;
    }
    else if (message.cleanContent.startsWith('IN')) // UAS invoice numbers start with "IN". Not all orders have Invoice IDs
    {
      message.channel.send(`... Looks like an Asset Store _invoice id_ ! I'm looking into it... (_${message.cleanContent}_)`);
      validateAssetStore(message);
      return;
    }
    else if (message.cleanContent.includes('help')) // maybe they're confused.
    {
      respondWithHelp(message);
      return;
    }
    else // gibberish? if you use FastSpring you'll validate that somewhere in here, I presume.
    {
      message.channel.send(`I don't understand! Here is some help:`);
      respondWithHelp(message);
      return;
    }
});

function respondWithHelp(message)
{
  message.channel.send(`
  I can verify your purchase if you send me a message with _only_ the order/invoice id. If you include anything else in the message I'll be confused!
  
  Asset Store _Order_ IDs look like a big string of numbers: **1301234567890**
  Asset Store _Invoice_ IDs look like numbers but start with "IN": **IN1234567890**
  You can find your orders by going to the asset store, clicking your profile, then clicking My Orders, or click the link below.
  
  https://assetstore.unity.com/orders`);
  return;
}

function validateAssetStore(message)
{
  // Guild object for use throughout.
  const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
  try
  {
    const memberPromise = guild.members.fetch(message.author.id);
    memberPromise.then(member => 
    {
      const invoiceID = message.cleanContent;
      console.log(`Received message with contents: ${invoiceID}`);
      const options = 
      {
        host: UAS_HOST,
        path: UAS_PATH + invoiceID,
        method: "GET",
      };

      console.log(`Verifying invoice at: ${UAS_HOST + UAS_PATH + invoiceID}`);

      const req = https.request(options, res => 
      {
        console.log(`Invoice verification response status: ${res.statusCode}`);
        res.setEncoding("utf8");

        // TODO: Handle multi-part data packets? Does this ever happen?
        res.on("data", chunk => 
        {
          const data = JSON.parse(chunk);

          // For JSON format info, see: https://api.assetstore.unity3d.com/api-docs/#!/invoice
          if (Array.isArray(data.invoices) && data.invoices.length > 0)
          {
            const purchaseReports = [];
            for (const invoice of data.invoices)
            {
              const roleToAdd = assetToRoleMap.get(invoice.package);
              if (roleToAdd !== undefined)
              {
                const role = guild.roles.cache.find(role => role.name === roleToAdd);
                member.roles.add(role);
                message.channel.send(`I verified your _${invoice.package}_ purchase and assigned you the **${roleToAdd}** role!`);

                // For reporting purposes.
                purchaseReports.push(
                {
                  invoice: invoice,
                  role: roleToAdd,
                });
              }
            }

            // In case none of the packages we care about were found.
            if (purchaseReports.length === 0)
            {
              // This should basically never happen, you probably have all valid products mapped to at least one role
              // so the error basically suggests 'yes, this order has our products because the API let us see it, but theres nothing we verify via the bot here.'
              message.channel.send(`Hmm... I don't see any verifiable products in there. Are you sure that's the right order?`);
            }
            else
            {
              // Report the purchase to the invoice reporting channel.
              const reportChannel = guild.channels.cache.find(channel => channel.id === DISCORD_REPORT_CHANNEL_ID);
              for (const report of purchaseReports)
              {
                reportChannel.send(`Verified **${member.displayName}** for their purchase of _${report.invoice.package}_ (${report.invoice.quantity} seat${(report.invoice.quantity > 1 ? "s" : "")}). Invoice#: [${report.invoice.invoice}] (UAS).`);
              }
            }
          }
          else
          {
            message.channel.send(`That number (${invoiceID}) doesn't seem valid or doesn't contain any of our products. Please double check it and try again.\nIf the problem persists, message a human with the Admin role.`);
          }
        });
      });

      // Handle the error case.
      req.on("error", error => 
      {
        console.error(error);
        message.channel.send("Sorry, my connection failed... Try again later or message a human with the Admin role.");
      });
      req.end();
    });
  }
  catch (e)
  {
    console.error(e);
    message.channel.send("I ran into an error. Have you joined the Discord server?");
    return;
  }
}

client.login(DISCORD_TOKEN);
