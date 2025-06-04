/* eslint-disable no-await-in-loop */
import { LionizationPickItem, showQuickPick, showInputBox, showDateFormatQuickPick, showPlaceholderQuickPick, includeInCustomPattern, includeInDecimalDigits, includeInSymbol, validNumberFormats, PlaceholderType, camelize, Placeholder, extractInterpolatedVariables } from "../utils/utils";

import { CommandParameters } from "../commands/translate_and_extract_value_to_arb/commandParameters";
import { EditFilesParameters } from "../commands/translate_and_extract_value_to_arb/editFilesParameters";
import { KeyValuePair } from "./keyValuePair";

async function getPlaceholder(variable: string) {
  const name = await showInputBox(
    `Enter the name of the variable ${variable}`,
    camelize(variable)
  );
  const placeholderType = await showPlaceholderQuickPick(name);

  let placeholder = new Placeholder(name, variable, placeholderType);

  switch (placeholderType) {
    case PlaceholderType.DateTime: {
      const format = await showDateFormatQuickPick(name);
      placeholder = placeholder.addFormat(format);
      break;
    }
    case PlaceholderType.int:
    case PlaceholderType.num:
    case PlaceholderType.double: {
      const numberFormats: string[] = [];
      if (placeholderType === PlaceholderType.int) {
        numberFormats.push("none");
      }
      numberFormats.push(...validNumberFormats);
      const format = await showQuickPick(
        `Choose the number format for the variable ${variable}`,
        numberFormats.map((p) => new LionizationPickItem(p))
      );
      if (format !== "none") {
        placeholder = placeholder.addFormat(format);
        if (includeInSymbol(format)) {
          const symbol = await showInputBox(
            `Choose the symbol for the variable ${name}`,
            ""
          );
          placeholder = placeholder.addSymbol(symbol);
        }
        if (includeInDecimalDigits(format)) {
          const decimalDigits = await showInputBox(
            `Choose the decimal digits for the variable ${name}`,
            ""
          );
          placeholder = placeholder.addDecimalDigits(Number(decimalDigits));
        }
        if (includeInCustomPattern(format)) {
          const customPattern = await showInputBox(
            `Choose the custom pattern for the variable ${name}`,
            ""
          );
          placeholder = placeholder.addCustomPattern(customPattern);
        }
      }
      break;
    }
    default:
      break;
  }

  return placeholder;
}

export async function setEditFilesParameters(
  commandParameters: CommandParameters
): Promise<EditFilesParameters> {
  const key = await showInputBox(
    "Enter the message name",
    camelize(commandParameters.key)
  );

  let description: string | null = null;
  // if (Configuration.getInstance().getHaveDescription()) {
  //   description = await showInputBox("Enter the description", "");
  // }

  const variables = extractInterpolatedVariables(commandParameters.value);
  const placeholders: Placeholder[] = [];
  if (Array.isArray(variables)) {
    for (const variable of variables) {
      placeholders.push(await getPlaceholder(variable));
    }
  }

  return new EditFilesParameters(
    commandParameters.uri,
    commandParameters.range,
    new KeyValuePair(key, commandParameters.value),
    description,
    placeholders
  );
}
