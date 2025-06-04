export interface RiverpodTemplates {
  getPageTemplate: (feature: string) => string;
  getViewModelTemplate: (feature: string) => string;
  getStateTemplate: (feature: string) => string;
}

import { getPageTemplate } from "./riverpod_page.template";
import { getViewModelTemplate } from "./view_model.template";
import { getStateTemplate } from "./state.template";

const templates: { [key: string]: RiverpodTemplates } = {
  template1: {
    getPageTemplate,
    getViewModelTemplate,
    getStateTemplate,
  },
};

export function getRiverpodTemplates(_: string | undefined = undefined): RiverpodTemplates {
  return templates["template1"];
}
