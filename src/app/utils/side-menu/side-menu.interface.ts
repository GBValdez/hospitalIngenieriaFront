export type clickType = string | (() => void);
export interface sideMenuInterfaceInternal extends sideMenuInterface {
  openChild?: boolean;
  present?: boolean;
  child?: sideMenuInterfaceInternal[];
}

export interface sideMenuInterface {
  text: string;
  icon: string;
  click?: clickType;
  child?: sideMenuInterface[];
  show?: boolean;
}

//int4rfqa
