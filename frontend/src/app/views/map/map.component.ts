import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router'
import { environment } from '../../../environments/environment';
import * as atlas from 'azure-maps-control';
import { ResizedEvent } from 'angular-resize-event';

import { SensorTempHumService } from '../../services/sensorTempHum/sensorTempHum.service';
import { SensorTempHum } from '../../models/sensorTempHumModel';

@Component({
  templateUrl: 'map.component.html',

})

export class MapComponent implements OnInit, AfterViewInit {

  private cameraLatitude: number;
  private cameraLongitude: number;
  private cameraZoom: number;
  private sensorid: string;
  private sensor: SensorTempHum;
  private sensorList: SensorTempHum[];

  @ViewChild('mapContainer') public mapContainer: ElementRef;
  public map: any;

  constructor (
    private route: ActivatedRoute,
    private sensorTempHumService: SensorTempHumService
  ) {
      this.route.paramMap.subscribe(map => {
        this.sensorid = map.get('sensorid');
      });
  }

  async ngOnInit() {

   }

  async ngAfterViewInit() {

    if(this.sensorid) {
      try {
        this.sensor = await this.sensorTempHumService.getSensorById(this.sensorid);
        this.cameraLatitude = +this.sensor.Location.Latitude;
        this.cameraLongitude = +this.sensor.Location.Longitude;
        this.cameraZoom = 16;
      } catch (error) {
        console.log(error);
      }
    } else {
      this.cameraLatitude = -34.5633026;
      this.cameraLongitude = -58.7054605;
      this.cameraZoom = 5;
    }

    this.map = new atlas.Map(this.mapContainer.nativeElement, {
      center: [this.cameraLongitude, this.cameraLatitude],
      zoom: this.cameraZoom,
      view: 'Auto',
      authOptions: environment.azureMapAuthOptions,
      //showLogo: false,
    });

    //Construct a zoom control and add it to the map.
    this.map.controls.add(new atlas.control.ZoomControl(), {
       position: 'bottom-right'
    });

    //Construct a pitch control and add it to the map.
    this.map.controls.add(new atlas.control.PitchControl(), {
      position: 'top-right'
    });

    //Construct a compass control and add it to the map.
    this.map.controls.add(new atlas.control.CompassControl, {
      position: 'top-right'
    });

    //Construct a compass control and add it to the map.
    this.map.controls.add(new atlas.control.StyleControl, {
      position: 'top-right'
    });

    try {
      this.sensorList = await this.sensorTempHumService.getSensors();
    } catch (error) {
      console.log(error);
    }

    //Wait until the map resources are ready.
    this.map.events.add('ready', () => {

      for(let i=0; i<this.sensorList.length; i++) {

        //Create a HTML marker and add it to the map.
        let marker = new atlas.HtmlMarker({
          color: 'DodgerBlue',
          text: 'S',
          position: [this.sensorList[i].Location.Longitude, this.sensorList[i].Location.Latitude],
          popup: new atlas.Popup({
            content: `<div style="padding:10px">${this.sensorList[i].Name}</div>`,
            pixelOffset: [0, -30]
          })
        });
        this.map.markers.add(marker);

        this.map.events.add('click',marker, () => {
          marker.togglePopup();
        });
      }

      this.map.map.resize();


  });




  }

  onResized(event: ResizedEvent) {
    this.map.map.resize();
    this.map.setStyle({ 'style': 'road_shaded_relief' });
  }



}
