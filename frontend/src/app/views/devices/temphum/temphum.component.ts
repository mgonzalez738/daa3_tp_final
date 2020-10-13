import { Component, OnInit, ViewChild } from '@angular/core';
import {ModalDirective} from 'ngx-bootstrap/modal';
import { Router } from '@angular/router'

import { SensorTempHumService } from '../../../services/sensorTempHum/sensorTempHum.service';

import { SensorTempHum } from '../../../models/sensorTempHumModel';

@Component({
  templateUrl: 'tempHum.component.html'
})
export class TempHumComponent implements OnInit {

  public sensors: SensorTempHum[];
  public selectedSensor: SensorTempHum = null;
  @ViewChild('warningModal') public warningModal: ModalDirective;
  public isDeleting: boolean = false;

  constructor(
    private sensorTempHumService: SensorTempHumService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.sensors = await this.sensorTempHumService.getSensors();
    } catch (error) {
      console.log(error);
    }
  }

  onLocation(event, sensor: SensorTempHum) {
    this.router.navigate([`map`, sensor._id]);
  }

  onData(event, sensor: SensorTempHum) {
    this.router.navigate([`devices/temphum/data`, sensor._id]);
  }

  onEdit(event, sensor: SensorTempHum) {
    this.router.navigate(['/sensorsTempHum', sensor.Name]);
  }

  onDeleteRequest(event, sensor: SensorTempHum) {
    this.selectedSensor = sensor;
    this.warningModal.show();
  }

  onDeleteCancel(event) {
    this.selectedSensor = null;
    this.warningModal.hide();
  }

  async onDeleteOk(event) {
    this.isDeleting = true;
    try {
      await this.sensorTempHumService.deleteSensor(this.selectedSensor._id);
      this.sensors = await this.sensorTempHumService.getSensors();
    } catch (error) {
      console.log(error);
    }
    this.selectedSensor = null;
    this.warningModal.hide();
    this.isDeleting = false;
  }

}
