import { Duplex, Writable } from 'stream';

import { EufySecurityPlatform } from '../platform';
import { Device, Station } from 'eufy-security-client';
import { log } from './utils';

export class TalkbackStream extends Duplex {

  private platform: EufySecurityPlatform;
  private camera: Device;

  private cacheData: Array<Buffer> = [];
  private talkbackStarted = false;
  private stopTalkbackTimeout?: NodeJS.Timeout;

  private targetStream?: Writable;

  constructor(platform: EufySecurityPlatform, camera: Device) {
    super();

    this.platform = platform;
    this.camera = camera;

    this.platform.eufyClient.on('station talkback start', this.onTalkbackStarted.bind(this));
    this.platform.eufyClient.on('station talkback stop', this.onTalkbackStopped.bind(this));
  }

  private onTalkbackStarted(station: Station, device: Device, stream: Writable) {
    if (device.getSerial() !== this.camera.getSerial()) {
      return;
    }

    log.debug(this.camera.getName(), 'talkback started event from station ' + station.getName());

    if (this.targetStream) {
      this.unpipe(this.targetStream);
    }

    this.targetStream = stream;
    this.pipe(this.targetStream);
  }

  private onTalkbackStopped(station: Station, device: Device) {
    if (device.getSerial() !== this.camera.getSerial()) {
      return;
    }

    log.debug(this.camera.getName(), 'talkback stopped event from station ' + station.getName());

    if (this.targetStream) {
      this.unpipe(this.targetStream);
    }
    this.targetStream = undefined;
  }

  public stopTalkbackStream(): void {
    this.stopTalkback();
    this.unpipe();
    this.destroy();
  }

  override _read(): void {
    let pushReturn = true;
    while (this.cacheData.length > 0 && pushReturn) {
      const data = this.cacheData.shift();
      pushReturn = this.push(data);
    }
  }

  override _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {

    if (this.stopTalkbackTimeout) {
      clearTimeout(this.stopTalkbackTimeout);
    }

    this.stopTalkbackTimeout = setTimeout(() => {
      this.stopTalkback();
    }, 2000);

    if (this.targetStream) {
      this.push(chunk);
    } else {
      this.cacheData.push(chunk);
      this.startTalkback();
    }
    callback();
  }

  private startTalkback() {
    if (!this.talkbackStarted) {
      this.talkbackStarted = true;
      log.debug(this.camera.getName(), 'starting talkback');
      this.platform.eufyClient.startStationTalkback(this.camera.getSerial())
        .catch(err => {
          log.error(this.camera.getName(), 'talkback could not be started: ' + err);
        });
    }
  }

  private stopTalkback() {
    if (this.talkbackStarted) {
      this.talkbackStarted = false;
      log.debug(this.camera.getName(), 'stopping talkback');
      this.platform.eufyClient.stopStationTalkback(this.camera.getSerial())
        .catch(err => {
          log.error(this.camera.getName(), 'talkback could not be stopped: ' + err);
        });
    }
  }
}