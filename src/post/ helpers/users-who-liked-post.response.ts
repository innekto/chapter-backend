export const mapUserToResponse = (user, currentUser) => ({
  userId: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  nickName: user.nickName,
  userStatus: user.userStatus,
  location: user.location,
  avatarUrl: user.avatarUrl,
  isSubscribed: currentUser.subscribers.some((sub) => sub.id === user.id),
});
