export const bookRegExp =
  /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\d\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~\p{Emoji}]+$/u;

export const commentRegexp =
  /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~\d\p{Emoji}]+$/u;

export const namesValidator =
  /^[A-Za-zА-Яа-яҐґЄєЖжИиІіЇїЙйКкЛлМмНнОоПпРрСсТтУуФфХхЦцЧчШшЩщьЮюЯя']+$/;

export const passwordRegexp =
  /^(?=.*\d)(?=.*[A-Z])(?=.*[!@#$%^&*])?[A-Za-z\d!@#$%^&*]{8,}$/;

export const emailRegexp = /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
