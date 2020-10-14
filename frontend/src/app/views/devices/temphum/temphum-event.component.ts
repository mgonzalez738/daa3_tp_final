import { AfterViewChecked, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { CollapseDirective} from 'ngx-bootstrap/collapse';
import { Router, ActivatedRoute, ParamMap } from '@angular/router'
import { NgForm } from '@angular/forms';

import { SensorTempHumService } from '../../../services/sensorTempHum/sensorTempHum.service';

import { SensorTempHum, EventTempHum } from '../../../models/sensorTempHumModel';
import { PaginationData } from '../../../models/paginationDataModel';

@Component({
  templateUrl: 'tempHum-event.component.html',
})
export class TempHumEventComponent implements OnInit {

  // NavBar

  private _isCollapsed: boolean = true;
  set isCollapsed(value) {
    this._isCollapsed = value;
  }
  get isCollapsed() {
    if (this.collapseRef) {
      // temp fix for "overflow: hidden"
      if (getComputedStyle(this.collapseRef.nativeElement).getPropertyValue('display') === 'flex') {
       this.renderer.removeStyle(this.collapseRef.nativeElement, 'overflow');
      }
    }
    return this._isCollapsed;
  }
  @ViewChild(CollapseDirective, { read: ElementRef, static: false }) collapse !: CollapseDirective;
  collapseRef;

  // Pagination

  public dataTotalItems: number;
  public dataItemsPerPage = 25;
  public dataCurrentPage: number = 1;
  public paginatorMaxSize: number = 5;
  public dataFirstItemShown: number;
  public dataLastItemShown: number;

  maxSize: number = 5;
  bigTotalItems: number = 675;
  bigCurrentPage: number = 1;

  public radioPeriod: string;

  public isLoading: boolean;

  public sensorid: string;
  public sensor: SensorTempHum;
  public event: EventTempHum[];
  public pagination: PaginationData;
  public loaded = false;

  constructor (
    private router: Router,
    private route: ActivatedRoute,
    private sensorTempHumService: SensorTempHumService,
    private renderer: Renderer2,
  ) {
      this.route.paramMap.subscribe(map => {
      this.sensorid = map.get('sensorid');
    });
    this.radioPeriod = 'Day';
  }

  async ngOnInit(): Promise<void> {

    try {
      this.sensor = await this.sensorTempHumService.getSensorById(this.sensorid);
    } catch (error) {
      console.log(error);
      return;
    }

    // Carga la tabla
    this.loadTable(this.radioPeriod, this.dataCurrentPage);

    this.loaded = true;
  }

  ngAfterViewChecked (): void {
    this.collapseRef = this.collapse;
  }

  private async loadTable(period: string, page: number) {

    this.isLoading = true;

    let to = new Date(Date.now());
    let from = new Date();
    switch(period) {
      case 'Hour':
        from.setHours(to.getHours()-1);
        break;
      case 'Day':
        from.setDate(to.getDate()-1);
        break;
      case 'Week':
        from.setDate(to.getDate()-7);
        break;
    }

    try {
      let result = await this.sensorTempHumService.getSensorsEvent(this.sensor._id, from, to, this.dataItemsPerPage, (page - 1)*this.dataItemsPerPage);
      this.event = result.Data;
      this.pagination = result.Pagination;
      this.dataTotalItems = this.pagination.Total;
      this.dataFirstItemShown = this.pagination.From;
      this.dataLastItemShown = this.pagination.To;
    } catch (error) {
      console.log(error);
      return;
    }

    this.isLoading = false;

  }


  onPeriodChange(event) {
      this.loadTable(this.radioPeriod, this.dataCurrentPage);
  }

  pageChanged(event: any): void {
    this.loadTable(this.radioPeriod, event.page);
  }


}
