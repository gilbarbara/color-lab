const { beforeUserCreated } = require('firebase-functions/v2/identity');
const { logger } = require('firebase-functions');

exports.beforeCreate = beforeUserCreated(event => {
  const { additionalUserInfo, data: user } = event;
  const providerId = additionalUserInfo?.providerId;

  // Set emailVerified for OAuth providers only (not email/password)
  if (user.email && !user.emailVerified && providerId && providerId !== 'password') {
    logger.info('Setting emailVerified to true for OAuth provider', { providerId });

    return { emailVerified: true };
  }
});
