import { wrapWith } from "../../utils";

const consumerSnippet = (widget: string) => {
  return `Consumer(
  builder: (BuildContext context, WidgetRef ref, _) {
    return ${widget};
  },
)`;
};

const expandedSnippet = (widget: string) => {
  return `Expanded(
  child: ${widget},
)`;
};

const flexibleSnippet = (widget: string) => {
  return `Flexible(
  child: ${widget},
)`;
};

const inkWellSnippet = (widget: string) => {
  return `InkWell(
  onTap: () {},
  child: ${widget},
)`;
}

const gestureDetectorSnippet = (widget: string) => {
  return `GestureDetector(
  onTap: () {},
  child: ${widget},
)`;
}

const commonContainerSnippet = (widget: string) => {
  return `CommonContainer(
  child: ${widget},
)`;
}

const horizontalPaddingSnippet = (widget: string) => {
  return `Padding(
  padding: EdgeInsets.symmetric(horizontal: 16.rps),
  child: ${widget},
)`;
}

const verticalPaddingSnippet = (widget: string) => {
  return `Padding(
  padding: EdgeInsets.symmetric(vertical: 16.rps),
  child: ${widget},
)`;
}

const singleChildScrollViewSnippet = (widget: string) => {
  return `SingleChildScrollView(
  child: ${widget},
)`;
}

const stackSnippet = (widget: string) => {
  return `Stack(
  children: [
    ${widget},
  ],
)`;
};

export const wrapWithConsumer = async () => wrapWith(consumerSnippet);
export const wrapWithExpanded = async () => wrapWith(expandedSnippet);
export const wrapWithFlexible = async () => wrapWith(flexibleSnippet);
export const wrapWithInkWell = async () => wrapWith(inkWellSnippet);
export const wrapWithGestureDetector = async () => wrapWith(gestureDetectorSnippet);
export const wrapWithStack = async () => wrapWith(stackSnippet);
export const wrapWithCommonContainer = async () => wrapWith(commonContainerSnippet);
export const wrapWithHorizontalPadding = async () => wrapWith(horizontalPaddingSnippet);
export const wrapWithVerticalPadding = async () => wrapWith(verticalPaddingSnippet);
export const wrapWithSingleChildScrollView = async () => wrapWith(singleChildScrollViewSnippet);
