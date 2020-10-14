import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router'

import { AuthService } from '../../services/auth/auth.service';
import { SensorTempHumService } from '../../services/sensorTempHum/sensorTempHum.service';


import { UserPopulated } from '../../models/userModel';
import { SensorTempHum, DataTempHum, EventTempHum } from '../../models/sensorTempHumModel';

@Component({
  templateUrl: 'dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  private authUser: UserPopulated;
  public selectedProjectId: string;
  public sensorTempHumList: SensorTempHum[] = [];
  public ledList: boolean[] = [];
  public ledEnabled: boolean[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private sensorTmpHumService: SensorTempHumService,
  ) {
    this.route.paramMap.subscribe(map => {
      this.selectedProjectId = map.get('projectid');
    });
  }


  async ngOnInit(): Promise<void> {

    try {
      this.authUser = this.authService.getAuthUser();
    }
    catch(error) {
      console.log(error);
      return
    }

    try {
      this.sensorTempHumList = await this.sensorTmpHumService.getSensorsByProjectId(this.authUser.Project._id);
      for(let i=0; i<this.sensorTempHumList.length; i++)
      {
        this.ledEnabled.push(false);
      }
    }
    catch(error) {
      console.log(error);
      return
    }

    try {
      for(let i=0; i<this.sensorTempHumList.length; i++)
      {
        let ledStatus = await this.sensorTmpHumService.getLedStatus(this.sensorTempHumList[i]._id);
        this.ledList.push(ledStatus);
        this.ledEnabled[i] = true;
      }
      console.log(this.ledList);
    }
    catch(error) {
      console.log(error);
      return
    }

  }

  async onLedChange(event, index) {
      this.ledEnabled[index] = false;
      try {
        await this.sensorTmpHumService.setLedStatus(this.sensorTempHumList[index]._id, event.target.checked);
      }
      catch (error) {
        console.log(error);
      }
      this.ledEnabled[index] = true;
  }


}
