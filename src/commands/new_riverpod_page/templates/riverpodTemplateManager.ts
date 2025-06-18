export interface RiverpodTemplates {
  getPageTemplate: (feature: string) => string;
  getViewModelTemplate: (feature: string) => string;
  getStateTemplate: (feature: string) => string;
}

import { getPageTemplate as getPageTemplateMultiModule } from "./riverpod_page_multi_module.template";
import { getViewModelTemplate as getViewModelTemplateMultiModule } from "./view_model_multi_module.template";
import { getStateTemplate as getStateTemplateMultiModule } from "./state_multi_module.template";

import { getPageTemplate as getPageTemplateSingleModule } from "./riverpod_page_single_module.template";
import { getViewModelTemplate as getViewModelTemplateSingleModule } from "./view_model_single_module.template";
import { getStateTemplate as getStateTemplateSingleModule } from "./state_single_module.template";

const templates: { [key: string]: RiverpodTemplates } = {
  multiModule: {
    getPageTemplate: getPageTemplateMultiModule,
    getViewModelTemplate: getViewModelTemplateMultiModule,
    getStateTemplate: getStateTemplateMultiModule,
  },
  singleModule: {
    getPageTemplate: getPageTemplateSingleModule,
    getViewModelTemplate: getViewModelTemplateSingleModule,
    getStateTemplate: getStateTemplateSingleModule,
  },
};

export function getRiverpodTemplates(
  name: string | undefined
): RiverpodTemplates {
  if (name && templates[name]) {
    return templates[name];
  }
  return templates["singleModule"];
}
