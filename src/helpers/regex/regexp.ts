export const unifiedRegexp =
  /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\d\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~\u00a9\u00ae\u2000-\u3300\uD83C-\uDBFF\uDC00-\uDFFF]+$/u;

export const namesValidator =
  /^[A-Za-zА-Яа-яҐґЄєЖжИиІіЇїЙйКкЛлМмНнОоПпРрСсТтУуФфХхЦцЧчШшЩщьЮюЯя']+$/;

export const passwordRegexp =
  /^(?=.*\d)(?=.*[A-Z])(?=.*[!@#$%^&*])?[A-Za-z\d!@#$%^&*]{8,}$/;

export const emailRegexp = /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
