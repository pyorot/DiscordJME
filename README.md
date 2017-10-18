# DiscordJME
Umbrella for various functions of Pyobot on Discord.

## Features
* `@Pyobot`: Replies with a random JME quotation.
* `~[command]`: Replies with FAQ entries that can be added/edited by editing a hidden (collaborative) JSONBlob JSON (the object has keys commands and values responses).
* `!breakpoints`: Calculates, then lists attack damage breakpoints in raid matchups per this: https://www.reddit.com/r/TheSilphRoad/comments/6r4tee/info_various_raid_counters_damage_breakpoints/.
* `!raidiv`: Calculates the possible IV combinations for a raid encounter given its CP.

## Files
* ./index.js is a script executed by a server to run the Discord bot and listen for messages.
* ./RD.js is a library of calculation/parsing functions for some of the features.
* ./get_react.js is an independent script to be run locally to list reactions to posts (which represent votes).
* ./jme.json stores JME quotations.
* ./key.json stores bot tokens and JSON urls.
* ./RDC/ stores data for use by the calculators.