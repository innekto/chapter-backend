export const createResponseUser = (
  user: any,
  subscribers: number,
  isUpadate: boolean = true,
) => {
  return {
    id: user.user_id,
    firstName: user.user_firstName || user.firstName,
    lastName: user.user_lastName || user.lastName,
    nickName: user.user_nickName || user.nickName,
    email: user.user_email || user.email,
    avatarUrl: user.user_avatarUrl || user.avatarUrl,
    location: user.user_location || user.location,
    userStatus: user.user_userStatus || user.userStatus,
    role: user.user_role || user.Role,
    status: user.user_status || user.user_status,
    ...(isUpadate && { provider: user.user_provider || user.provider }),
    ...(isUpadate && { socialId: user.user_socialId || user.cosialId }),
    ...(isUpadate && {
      IsAccessCookie: user.user_IsAccessCookie || user.IsAccessCookie,
    }),
    userBooks: user.user_books || user.books,
    myFollowersCount: subscribers || null,
    myFollowingCount: +user.followingCount || user.subscribers.length || null,
  };
};
