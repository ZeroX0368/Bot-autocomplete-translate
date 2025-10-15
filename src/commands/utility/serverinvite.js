
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinvite')
    .setDescription('Get an invite link for a server')
    .addStringOption(option =>
      option.setName('server')
        .setDescription('The server to get an invite link for')
        .setRequired(true)
        .setAutocomplete(true)),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    
    // Get all guilds the bot is in
    const guilds = interaction.client.guilds.cache.map(guild => ({
      name: guild.name,
      value: guild.id
    }));

    // Filter based on user input
    const filtered = guilds.filter(guild => 
      guild.name.toLowerCase().includes(focusedValue)
    ).slice(0, 25);

    await interaction.respond(filtered);
  },

  async execute(interaction) {
    const serverId = interaction.options.getString('server');
    
    try {
      const guild = interaction.client.guilds.cache.get(serverId);

      if (!guild) {
        return await interaction.reply({
          content: 'Server not found! Make sure the bot is in that server.',
          ephemeral: true
        });
      }

      // Check if the bot has permission to create invites
      const botMember = guild.members.me;
      if (!botMember.permissions.has(PermissionFlagsBits.CreateInstantInvite)) {
        return await interaction.reply({
          content: 'I don\'t have permission to create invites in that server.',
          ephemeral: true
        });
      }

      // Find a suitable channel to create an invite
      const channel = guild.channels.cache.find(ch => 
        ch.isTextBased() && 
        ch.permissionsFor(botMember).has(PermissionFlagsBits.CreateInstantInvite)
      );

      if (!channel) {
        return await interaction.reply({
          content: 'No suitable channel found to create an invite.',
          ephemeral: true
        });
      }

      // Create the invite
      const invite = await channel.createInvite({
        maxAge: 86400, // 24 hours
        maxUses: 0, // unlimited uses
        reason: `Requested by ${interaction.user.tag}`
      });

      await interaction.reply({
        content: `**Invite link for ${guild.name}:**\n${invite.url}\n\n*This invite expires in 24 hours*`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Server invite error:', error);
      await interaction.reply({
        content: 'An error occurred while creating the invite link.',
        ephemeral: true
      });
    }
  }
};
