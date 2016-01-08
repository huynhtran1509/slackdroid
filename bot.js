var Botkit = require('botkit');
var os = require('os');
var androidsdk = require('./helpers/androidsdk');
var config = require('./conf/config');

var controller = Botkit.slackbot({
    debug: true
});

var bot = controller.spawn({
    token: config.slack_api_token
}).startRTM();

controller.hears(['help','halp'],'direct_message,direct_mention,mention',function(bot, message) {
    bot.reply(message, 'Usage:');
    bot.reply(message, 'sdk [Android API object] -- example: sdk FragmentManager');
});

controller.hears(['sdk','android'],'direct_message,direct_mention,mention',function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'android',
    },function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(',err);
        }
    });
    var query = message.text;
    query = query.replace('sdk', '').trim();
    bot.botkit.log('New sdk query: ' + query);
    var result = androidsdk.query(query);

    if (result != null && result != undefined) {
        var messageObj = {
            text: 'https://developer.android.com/' + result.link,
            unfurl_links: true,
            unfurl_media: true
        };
        bot.reply(message, messageObj);
    } else {
        bot.botkit.log('No result found for: ' + query);
        bot.reply(message, 'Not gonna be able to do it!');
    }
});