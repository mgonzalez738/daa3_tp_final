import { Component } from '@angular/core';

@Component({
  selector: 'dashboard-button',
  inputs: ['enabled'],
  templateUrl: './dashboard-button.component.html'
})
export class DashboardButtonComponent {

  public enabled = false;

  constructor( ) {}
}
