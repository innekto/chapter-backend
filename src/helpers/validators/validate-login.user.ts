export const createResponseUser = (
  user: any,
  subscribers: number,
  isUpadate: boolean = true,
  following?: number,
) => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    nickName: user.nickName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    location: user.location,
    userStatus: user.userStatus,
    role: user.role,
    status: user.status,
    ...(isUpadate && { provider: user.provider }),
    ...(isUpadate && { socialId: user.cosialId }),
    ...(isUpadate && {
      IsAccessCookie: user.user_IsAccessCookie || user.IsAccessCookie,
    }),
    userBooks: user.books,
    myFollowersCount: subscribers || null,
    myFollowingCount:
      following !== undefined && following !== null
        ? following
        : user.subscribers.length > 0
        ? user.subscribers.length
        : null,
  };
};
