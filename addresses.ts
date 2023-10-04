import { CoreAddresses } from './scripts/models/CoreAddresses';
import { ToolsAddresses } from './scripts/models/ToolsAddresses';
import { BaseCoreAddresses } from './addresses_core_base';
import { BaseToolsAddresses } from './addresses_tools_base';

export class Addresses {

  public static CORE = new Map<string, CoreAddresses>([
    ['8453', BaseCoreAddresses.ADDRESSES],
  ]);

  public static TOOLS = new Map<string, ToolsAddresses>([
    ['8453', BaseToolsAddresses.ADDRESSES],
  ]);
}
