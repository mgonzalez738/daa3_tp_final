import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'
import { NgForm, PatternValidator } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../services/auth/auth.service';
import { UsersService } from '../../../services/users/users.service';
import { ClientsService } from '../../../services/clients/clients.service';
import { ProjectsService } from '../../../services/projects/projects.service';
import { SensorTempHumService } from '../../../services/sensorTempHum/sensorTempHum.service';

import { User, UserPopulated } from '../../../models/userModel';
import { Client } from '../../../models/clientModel';
import { Project } from '../../../models/projectModel';
import { SensorTempHum } from '../../../models/sensorTempHumModel';

@Component({
  templateUrl: 'temphum-new.component.html'
})
export class NewTempHumComponent implements OnInit {

  authUser: UserPopulated;
  sensor: SensorTempHum;

  isLoading = false;
  storeError = false;
  storeErrorMessage = "";

  constructor(
    private sensorTempHumService: SensorTempHumService,
    private usersService: UsersService,
    private clientsService: ClientsService,
    private projectsService: ProjectsService,
    private authService: AuthService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {

    try {
      this.authUser = await this.authService.getAuthUser();
    } catch (error) {
      console.log(error);
    }
  }

  async OnOk(form: NgForm) {
    let error = false;
    this.isLoading = true;

    this.sensor = new SensorTempHum();
    this.sensor.Name = form.value.name;
    this.sensor.Location = {
      Latitude: parseFloat(form.value.latitude),
      Longitude: parseFloat(form.value.longitude)
    }
    this.sensor.ClientId = this.authUser.Client._id;
    this.sensor.ProjectId = this.authUser.Project._id;
    if(form.value.id !== "")
      this.sensor._id = form.value.id;
    if(form.value.key !== "")
      this.sensor.ConnectionString = form.value.key;

    try {
      let res = await this.sensorTempHumService.storeSensor(this.sensor);
      this.storeError = false;
      this.storeErrorMessage = "";
      this.isLoading = false;
      this.router.navigate(['/devices/temphum']);
    }
    catch (error) {
      this.storeError = true;
      this.storeErrorMessage = error.message;
      this.isLoading = false;
    }

    return;
  }

}
