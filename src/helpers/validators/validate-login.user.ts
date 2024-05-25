import { User } from 'src/users/entities/user.entity';

export const createResponseUser = (
  user: User,
  subscribers: User[],
  isUpadate: boolean = true,
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
    ...(isUpadate && { socialId: user.socialId }),
    ...(isUpadate && { IsAccessCookie: user.IsAccessCookie }),
    userBooks: user.books,
    myFollowersCount: subscribers?.length || null,
    myFollowingCount: user.subscribers?.length || null,
  };
};
