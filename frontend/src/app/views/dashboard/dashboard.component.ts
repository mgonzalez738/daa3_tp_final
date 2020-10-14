import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router'

import { AuthService } from '../../services/auth/auth.service';
import { SensorTempHumService } from '../../services/sensorTempHum/sensorTempHum.service';
import { SocketioService } from '../../services/socketio/socketio.service';

import { UserPopulated } from '../../models/userModel';
import { SensorTempHum, DataTempHum, EventTempHum } from '../../models/sensorTempHumModel';
import { Subscription } from 'rxjs';

@Component({
  templateUrl: 'dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  private authUser: UserPopulated;
  public selectedProjectId: string;
  public sensorTempHumList: SensorTempHum[] = [];
  public dataTempHumList: DataTempHum[] = [];
  public eventTempHumList: EventTempHum[] = [];
  public ledList: boolean[] = [];
  public ledEnabled: boolean[] = [];
  private dataSubscription: Subscription;
  private eventSubscription: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private sensorTmpHumService: SensorTempHumService,
    private socketIoService: SocketioService
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
        let dt = await this.sensorTmpHumService.getSensorsLastData(this.sensorTempHumList[i]._id);
        this.dataTempHumList.push(dt);
        let et = await this.sensorTmpHumService.getSensorLastEvent(this.sensorTempHumList[i]._id,);
        this.eventTempHumList.push(et);
      }
      console.log(this.eventTempHumList);
    }
    catch(error) {
      console.log(error);
      return
    }

    // Suscribe a datos
    this.dataSubscription = this.socketIoService
      .getDataListener()
      .subscribe(data => {
        this.updateData(data);
      });

    // Suscribe a eventos
    this.eventSubscription = this.socketIoService
      .getEventListener()
      .subscribe(event => {
        this.updateEvent(event);
      });

    try {
      for(let i=0; i<this.sensorTempHumList.length; i++)
      {
        let ledStatus = await this.sensorTmpHumService.getLedStatus(this.sensorTempHumList[i]._id);
        this.ledList.push(ledStatus);
        this.ledEnabled[i] = true;
      }
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

  updateData(dt: DataTempHum) {
    for(let i = 0; i < this.dataTempHumList.length; i++) {
      if(this.dataTempHumList[i].SensorId === dt.SensorId) {
        this.dataTempHumList[i] = dt;
        break;
      }
    }
  }

  updateEvent(et: EventTempHum) {
    for(let i = 0; i < this.eventTempHumList.length; i++) {
      if(this.eventTempHumList[i].SensorId === et.SensorId) {
        this.eventTempHumList[i] = et;
        break;
      }
    }
  }


}
