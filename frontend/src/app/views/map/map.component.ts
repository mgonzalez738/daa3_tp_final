import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import * as atlas from 'azure-maps-control';

@Component({
  templateUrl: 'map.component.html',
  styles: ['#map {height: 300px; width: 95vw;}']
})

export class MapComponent implements OnInit, AfterViewInit {


  @ViewChild('mapContainer') public mapContainer: ElementRef;
  public map: any;

  ngOnInit() {

  }

  ngAfterViewInit(): void {
    console.log(this.mapContainer);
    this.map = new atlas.Map(this.mapContainer.nativeElement, {
      authOptions: environment.azureMapAuthOptions
    });
  }

}
