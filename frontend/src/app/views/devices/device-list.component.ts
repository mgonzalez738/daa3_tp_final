import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'

class DeviceType {
  public name: string;
  public description: string;
  public link: string;
};

@Component({
  templateUrl: 'device-list.component.html'
})
export class DeviceListComponent implements OnInit {

  public deviceList: DeviceType[];

  constructor(private router: Router) {}

  ngOnInit(): void {

    let deviceType: DeviceType;
    this.deviceList = [];

    deviceType = new DeviceType();
    deviceType.name = "Temperatura Humedad";
    deviceType.description = "Sensores de temperatura y humedad implementados con Dht22 y Esp32";
    deviceType.link = "/devices/temphum";
    this.deviceList.push(deviceType);

  }

  onLink(event, device: DeviceType) {
    this.router.navigate([device.link]);
  }

}
