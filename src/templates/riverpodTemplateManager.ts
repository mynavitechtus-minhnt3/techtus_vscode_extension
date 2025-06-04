export interface RiverpodTemplates {
  getPageTemplate: (feature: string) => string;
  getViewModelTemplate: (feature: string) => string;
  getStateTemplate: (feature: string) => string;
}

import { getPageTemplate as getPageTemplate1 } from "./riverpod_page.template";
import { getViewModelTemplate as getViewModelTemplate1 } from "./view_model.template";
import { getStateTemplate as getStateTemplate1 } from "./state.template";

import { getPageTemplate as getPageTemplate2 } from "./riverpod_page.template_2";
import { getViewModelTemplate as getViewModelTemplate2 } from "./view_model.template_2";
import { getStateTemplate as getStateTemplate2 } from "./state.template_2";

const templates: { [key: string]: RiverpodTemplates } = {
  template1: {
    getPageTemplate: getPageTemplate1,
    getViewModelTemplate: getViewModelTemplate1,
    getStateTemplate: getStateTemplate1,
  },
  template2: {
    getPageTemplate: getPageTemplate2,
    getViewModelTemplate: getViewModelTemplate2,
    getStateTemplate: getStateTemplate2,
  },
};

export function getRiverpodTemplates(name: string | undefined): RiverpodTemplates {
  if (name && templates[name]) {
    return templates[name];
  }
  return templates["template1"];
}
