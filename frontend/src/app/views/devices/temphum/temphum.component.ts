import { Component, OnInit, ViewChild } from '@angular/core';
import {ModalDirective} from 'ngx-bootstrap/modal';
import { Router } from '@angular/router'

import { AuthService } from '../../../services/auth/auth.service';
import { UserPopulated } from '../../../models/userModel';
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
  public authUser: UserPopulated;

  constructor(
    private sensorTempHumService: SensorTempHumService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {

    try {
      this.authUser = this.authService.getAuthUser();
    }
    catch(error) {
      console.log(error);
      return
    }

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

  onEvent(event, sensor: SensorTempHum) {
    this.router.navigate([`devices/temphum/event`, sensor._id]);
  }

  onEdit(event, sensor: SensorTempHum) {
    //this.router.navigate(['/sensorsTempHum', sensor.Name]);
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
