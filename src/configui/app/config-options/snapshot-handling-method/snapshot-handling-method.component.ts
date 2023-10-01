import { Component, Input, OnInit } from '@angular/core';
import { Accessory } from '../../../app/accessory';
import { PluginService } from '../../../app/plugin.service';
import { DEFAULT_CAMERACONFIG_VALUES, DEFAULT_CONFIG_VALUES } from '../../../app/util/default-config-values';
import { ConfigOptionsInterpreter } from '../config-options-interpreter';

import { faPlusCircle, faMinusCircle, faCircle } from '@fortawesome/free-solid-svg-icons';
import { AccessoryService } from '../../accessory.service';
import { ChargingStatus } from '../../util/eufy-security-client.utils';

@Component({
  selector: 'app-snapshot-handling-method',
  templateUrl: './snapshot-handling-method.component.html',
  styles: [],
})
export class SnapshotHandlingMethodComponent extends ConfigOptionsInterpreter implements OnInit {
  constructor(
    pluginService: PluginService,
    private accessoryService: AccessoryService,
  ) {
    super(pluginService);
  }

  ngOnInit(): void {
    this.readValue();
  }

  // Custom icons
  plusIcon = faPlusCircle;
  minusIcon = faMinusCircle;
  mediumIcon = faCircle;

  @Input() accessory?: Accessory;
  value = DEFAULT_CAMERACONFIG_VALUES.snapshotHandlingMethod;

  chargingStatus = ChargingStatus.PLUGGED;
  camerasOnSameStation: string[] = [];

  ignoreMultipleDevicesWarning = DEFAULT_CONFIG_VALUES.ignoreMultipleDevicesWarning;

  async readValue() {
    const config = await this.getCameraConfig(this.accessory?.uniqueId || '');

    // Check for ignoreMultipleDevicesWarning in config using hasOwnProperty
    if (config && config.hasOwnProperty('ignoreMultipleDevicesWarning')) {
      this.ignoreMultipleDevicesWarning = config['ignoreMultipleDevicesWarning'];
    }

    if (this.accessory) {
      // Get charging status asynchronously
      this.accessoryService.getChargingStatus(this.accessory.uniqueId)
        .then((chargingStatus) => this.chargingStatus = chargingStatus);
      
      // Check for snapshotHandlingMethod in config using hasOwnProperty
      if (config && config.hasOwnProperty('snapshotHandlingMethod')) {
        this.value = config['snapshotHandlingMethod'];
      } else if (config && config.hasOwnProperty('forcerefreshsnap')) {
        this.value = config['forcerefreshsnap'] ? 1 : 3;
      }

      // Get cameras on the same station and handle multiple devices
      const ignoredDevices = (config && config.hasOwnProperty('ignoreDevices')) ? config['ignoreDevices'] : [];
      this.accessoryService.getCamerasOnSameStation(this.accessory.uniqueId, ignoredDevices)
        .then(devices => {
          this.camerasOnSameStation = devices;
          if (this.camerasOnSameStation.length > 1 && !this.ignoreMultipleDevicesWarning) {
            this.value = 3;
            this.update();
          }
        });
    }
  }

  update() {
    // Update the configuration with snapshotHandlingMethod
    this.updateConfig(
      {
        snapshotHandlingMethod: this.value,
      },
      this.accessory,
    );
  }
}