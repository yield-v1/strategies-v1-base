import { IAnnouncer, IBookkeeper, IController, ISmartVault, IStrategy, IVaultController } from '../typechain';

export class CoreContractsWrapper {

  public controller: IController;
  public bookkeeper: IBookkeeper;
  public announcer: IAnnouncer;

  constructor(
    controller: IController,
    bookkeeper: IBookkeeper,
    announcer: IAnnouncer,
  ) {
    this.controller = controller;
    this.bookkeeper = bookkeeper;
    this.announcer = announcer;
  }
}
