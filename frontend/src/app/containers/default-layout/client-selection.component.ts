import { Component, EventEmitter } from '@angular/core';

import { Client } from '../../models/clientModel';

@Component({
  selector: 'client-selection',
  inputs: ['clientSelected', 'clientList', 'isLoading'],
  outputs: ['clientSelectedChanged'],
  templateUrl: './client-selection.component.html'
})
export class ClientSelectionComponent {

  public clientList: Client[];
  public clientSelected: Client;
  public clientSelectedChanged = new EventEmitter<Client>();
  public isLoading = false;

  constructor( ) {}

  public onClientSelectedChanged(event, client: Client) {
    // Emite el nuevo cliente seleccionado
    this.clientSelectedChanged.emit(client);
  }
}
