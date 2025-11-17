let navigateFn: (path: string) => void;

export const setNavigator = (nav: (path: string) => void) => {
  navigateFn = nav;
};

export const navigateTo = (path: string) => {
  if (navigateFn) navigateFn(path);
};
