import { Component, Input, OnInit } from '@angular/core';
import { L_Device } from '../../util/types';
import { PluginService } from '../../plugin.service';
import { DEFAULT_CAMERACONFIG_VALUES, DEFAULT_CONFIG_VALUES } from '../../util/default-config-values';
import { ChargingType } from '../../util/types';
import { ConfigOptionsInterpreter } from '../config-options-interpreter';

import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgbCollapse, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-enable-hsv',
  templateUrl: './enable-hsv.component.html',
  styles: [],
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    RouterLink,
    NgFor,
    NgbCollapse,
    FaIconComponent,
    NgbTooltip,
  ],
})
export class EnableHsvComponent extends ConfigOptionsInterpreter implements OnInit {

  faQuestionCircle = faQuestionCircle;

  constructor(
    pluginService: PluginService,
  ) {
    super(pluginService);
  }

  ngOnInit(): void {
    this.readValue();
  }

  /** Customize from here */
  /** updateConfig() will overwrite any settings that you'll provide */
  /** Don't try and 'append'/'push' to arrays this way - add a custom method instead */
  /** see config option to ignore devices as example */

  /** updateConfig() takes an optional second parameter to specify the accessoriy for which the setting is changed */

  @Input() device?: L_Device;
  value = DEFAULT_CAMERACONFIG_VALUES.hsv;

  chargingStatus = ChargingType.PLUGGED;
  camerasOnSameStation: string[] = [];
  standalone = true;

  ignoreMultipleDevicesWarning = DEFAULT_CONFIG_VALUES.ignoreMultipleDevicesWarning;

  async readValue() {
    const config = await this.getCameraConfig(this.device?.uniqueId || '');

    if (config && Object.prototype.hasOwnProperty.call(config, 'hsv')) {
      this.value = config['hsv'];
    }

    try {

      if (this.device) {

        this.chargingStatus = this.device.chargingStatus!;
        this.standalone = this.device.standalone!;

        if (Object.prototype.hasOwnProperty.call(this.config, 'ignoreMultipleDevicesWarning')) {
          this.ignoreMultipleDevicesWarning = this.config['ignoreMultipleDevicesWarning'];
        }

        if (this.camerasOnSameStation.length > 1 && !this.ignoreMultipleDevicesWarning) {
          this.value = false;
          this.update();
        }

      }
    } catch (error) {
      console.log(error);
    }

  }

  update() {
    this.updateDeviceConfig({
      hsv: this.value,
    }, this.device!);
  }
}