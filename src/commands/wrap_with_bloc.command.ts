import { wrapWith } from "../utils";

const blocBuilderSnippet = (widget: string) => {
  return `BlocBuilder<\${1:\${TM_FILENAME_BASE/(.*)_page/\${1:/pascalcase}/}}Bloc, $1State>(
    buildWhen: (previous, current) => previous.\${2:name} != current.$2,
    builder: (context, state) {
    return ${widget};
  },
)`;
};

const blocSelectorSnippet = (widget: string) => {
  return `BlocSelector<\${1:\${TM_FILENAME_BASE/(.*)_page/\${1:/pascalcase}/}}Bloc, $1State>(
  selector: (state) {
    return state.\${2:name};
  },
  builder: (context, state) {
    return ${widget};
  },
)`;
};

const blocListenerSnippet = (widget: string) => {
  return `BlocListener<\${1:\${TM_FILENAME_BASE/(.*)_page/\${1:/pascalcase}/}}Bloc, $1State>(
  listenWhen: (previous, current) => previous.\${2:name} != current.$2,
  listener: (context, state) {
    
  },
  child: ${widget},
)`;
};

const blocConsumerSnippet = (widget: string) => {
  return `BlocConsumer<\${1:\${TM_FILENAME_BASE/(.*)_page/\${1:/pascalcase}/}}Bloc, $1State>(
  listenWhen: (previous, current) => previous.\${2:name} != current.$2,
  buildWhen: (previous, current) => previous.\${3:name} != current.$3,
  listener: (context, state) {
    
  },
  builder: (context, state) {
    return ${widget};
  },
)`;
};

export const wrapWithBlocBuilder = async () => wrapWith(blocBuilderSnippet);
export const wrapWithBlocSelector = async () => wrapWith(blocSelectorSnippet);
export const wrapWithBlocListener = async () => wrapWith(blocListenerSnippet);
export const wrapWithBlocConsumer = async () => wrapWith(blocConsumerSnippet);
