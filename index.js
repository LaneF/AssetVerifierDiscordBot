// UAS
const UAS_HOST = "api.assetstore.unity3d.com";
const UAS_PATH = "/publisher/v1/invoice/verify.json?key="+process.env.UAS_TOKEN+"&invoice=";
// Discord
const DISCORD_GUILD_ID      = "504309807876931586";
const DISCORD_REPORT_CHANNEL_ID = "816347143425491005";
const ROLE_ID_VERIFIED      = "796799179930206259";
const ROLE_ID_VCORE         = "933411053700792460";
const ROLE_ID_VATTRIBUTES   = "933410927938781304";
const ROLE_ID_VINVENTORY    = "933411084885450752";
const ROLE_ID_PRODIGY       = "933411165055361044";
const ROLE_ID_THATHURT      = "933417015476121600";
const ROLE_ID_QUINN         = "933411189369745448";
const ROLE_ID_ZED           = "933416260362977280";
const ROLE_ID_STYLIZED      = "933416171674431528";
const ROLE_ID_DEFTLY        = "933416063310368818";
const HELPMESSAGE           = "I can verify your purchase if you send me a message with _only_ the order/invoice id. If you include anything else in the message Ill be confused!\n\nAsset Store _Order_ IDs look like a big string of numbers: **1301234567890**\nAsset Store _Invoice_ IDs look like numbers but start with IN: **IN1234567890**\nYou can find your orders by going to the asset store, clicking your profile, then clicking My Orders, or click the link below.\n\nhttps://assetstore.unity.com/orders";

// Map of Product Name to Discord Server Role name.
// Add custom role assignments for products here.
const assetToRoleMap = new Map();
assetToRoleMap.set("Vault Core",                            ROLE_ID_VCORE);
assetToRoleMap.set("Vault Inventory",                       ROLE_ID_VINVENTORY);
assetToRoleMap.set("Vault Inventory (fill-your-toolbox)",   ROLE_ID_VINVENTORY); // Official sales often have unique product names for them.
assetToRoleMap.set("Vault Attributes",                      ROLE_ID_VATTRIBUTES);
assetToRoleMap.set("Prodigy Game Framework",                ROLE_ID_PRODIGY);
assetToRoleMap.set("That Hurt! Damage Floaties",            ROLE_ID_THATHURT);
assetToRoleMap.set("Zed",                                   ROLE_ID_ZED);
assetToRoleMap.set("Deftly: Top Down Shooter Framework",    ROLE_ID_DEFTLY);
assetToRoleMap.set("Quinn Stylized Animset",                ROLE_ID_QUINN);
assetToRoleMap.set("Stylized Fantasy Character Pack",       ROLE_ID_STYLIZED);

const https = require("https");

// Setup Discord Client (^14.3)
// Not all of these are required. Partials.Channel gives access to DMs (I have no idea why).
// Intents is the biggest problem when updating discord.js because they have provide confusing support layer.
// I think you can just send the actual bit, but the online bit calculators fot that are built for various versions so results may vary.
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});
client.on("ready", () => {
    console.log("Logged into Discord!");
    const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
    guild.channels.cache.get(DISCORD_REPORT_CHANNEL_ID)
        .send(`Bot has rebooted. [${new Date()}].`)
        .catch(() => console.log("Ready message to report channel failed to send!"));
});
client.on("messageCreate",
    message => {
        // Ignore anything sent to the verify report channel
        if (message.channel.id === DISCORD_REPORT_CHANNEL_ID) { return; }
        // Ignore anything sent by bots (such as itself)
        if (message.author.bot) { return; }
        // This seems to change between discord versions and can be a hassle to debug.
        if (message.channel.type !== 1 && message.channel.type.toString() !== "DM" && message.channel.type.toString() !== "dm") { return; }

        const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
        const memberPromise = guild.members.fetch(message.author.id);
        memberPromise.then(member =>
        {
            // ======================
            // PARSE THE MESSAGE FROM THE USER
            // ======================
            if (message.cleanContent.length > 15)
            {
                message.channel
                    .send(`... _${message.cleanContent}_ does not look like a valid invoice or order id. Here is some help:`)
                    .catch(err => console.error(err.message));
                message.channel.send(HELPMESSAGE).catch(err => console.error(err.message));
                return;
            } else if (message.cleanContent.includes("help"))
            {
                message.channel.send(HELPMESSAGE).catch(err => console.error(err.message));
                return;
            }

            if (/^\d+$/.test(message.cleanContent) || message.cleanContent.startsWith("IN")) {
                message.channel.send(`Thanks, I'm looking into it! (id _${message.cleanContent}_)`)
                    .catch(err => console.error(err.message));
                console.log(`INPUT from ${member.displayName}`);

                try {
                    const invoiceId = message.cleanContent;
                    const options =
                    {
                        host: UAS_HOST,
                        path: UAS_PATH + invoiceId,
                        method: "GET"
                    };

                    console.log(`Verifying '${invoiceId}'`);

                    const req = https.request(options,
                        res => {
                            console.log(`Response: ${res.statusCode}`);
                            res.setEncoding("utf8");
                            res.on("data",
                                chunk => {
                                    const data = JSON.parse(chunk);
                                    if (Array.isArray(data.invoices) && data.invoices.length > 0)
                                    {
                                        const purchaseReports = [];

                                        for (const invoice of data.invoices)
                                        {
                                            const roleIdToAdd = assetToRoleMap.get(invoice.package);
                                            const role = guild.roles.cache.get(roleIdToAdd);
                                            const verifiedRole = guild.roles.cache.get(ROLE_ID_VERIFIED);

                                            if (roleIdToAdd !== undefined)
                                            {
                                                // give verified role and special role
                                                member.roles.add(role);
                                                member.roles.add(verifiedRole);
                                                message.channel
                                                    .send(`I verified your _${invoice.package}_ purchase and assigned you the **${role.name}** role! You can verify other invoices for more roles.`)
                                                    .catch(err => console.error(err.message));

                                                // For reporting purposes.
                                                purchaseReports.push(
                                                    {
                                                        invoice: invoice,
                                                        role: roleIdToAdd
                                                    });
                                            }
                                        }

                                        // In case none of the packages we care about were found.
                                        if (purchaseReports.length === 0)
                                        {
                                            message.channel
                                                .send(`Hmm... I don't see any verifiable products in there. Are you sure that's the right order? If the product was in an official sale or is brand new, message an Admin for help.`)
                                                .catch(err => console.error(err.message));
                                        }
                                        else
                                        {
                                            // Report the purchase to the invoice reporting channel.
                                            for (const report of purchaseReports)
                                            {
                                                guild.channels.cache.get(DISCORD_REPORT_CHANNEL_ID).send(`Verified **${member}** for their purchase of _${report.invoice.package}_ (${report.invoice.quantity} seat${(report.invoice.quantity > 1 ? "s" : "")}). Invoice#: [${report.invoice.invoice}] (UAS).`);
                                            }
                                        }
                                    }
                                    else
                                    {
                                        message.channel
                                            .send(`That number (${invoiceId}) doesn't seem valid or doesn't contain any of our products. Please double check it and try again.\nIf the problem persists, message a human with the Admin role.`)
                                            .catch(err => console.error(err.message));
                                    }
                                });
                        });

                    // Handle the error case.
                    req.on("error",
                        error => {
                            console.error(error);
                            message.channel
                                .send("Sorry, my connection failed... Try again later or message a human with the Admin role.")
                                .catch(err => console.error(err.message));
                        });
                    req.end();
                } catch (e) {
                    console.error(e);
                    message.channel.send("I ran into an error. Have you joined the Discord server?")
                        .catch(err => console.error(err.message));
                    return;
                }
            } else
            {
                message.channel.send(`I don't understand! Here is some help:`).catch(err => console.error(err.message));
                message.channel.send(HELPMESSAGE).catch(err => console.error(err.message));
                return;
            }
        });
    });

client.login(process.env.DISCORD_TOKEN);