import React from 'react';
import type { BluetoothStats } from '../../../../types/stats';
import { Bluetooth, Headphones, Mouse, Keyboard, Speaker, Wifi, Battery, Signal } from 'lucide-react';

interface BluetoothModuleProps {
  data: BluetoothStats;
}

const getDeviceIcon = (type: string) => {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('headphone') || normalizedType.includes('earbud')) {
    return Headphones;
  }
  if (normalizedType.includes('mouse')) {
    return Mouse;
  }
  if (normalizedType.includes('keyboard')) {
    return Keyboard;
  }
  if (normalizedType.includes('speaker') || normalizedType.includes('audio')) {
    return Speaker;
  }
  return Bluetooth;
};

const getSignalStrength = (rssi?: number): number => {
  if (!rssi) return 0;
  // RSSI typically ranges from -100 (weak) to 0 (strong)
  // Convert to 0-100 scale
  if (rssi >= -50) return 100;
  if (rssi >= -60) return 75;
  if (rssi >= -70) return 50;
  if (rssi >= -80) return 25;
  return 10;
};

export const BluetoothModule: React.FC<BluetoothModuleProps> = React.memo(({ data }) => {
  const connectedDevices = data.devices.filter(d => d.connected);

  return (
    <div className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-lg">
            <Bluetooth className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Bluetooth</h3>
            <p className="text-xs text-foreground-muted">
              {data.enabled ? `${connectedDevices.length} connected` : 'Disabled'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold font-mono ${data.enabled ? 'text-cyan-500' : 'text-foreground-muted'}`}>
            {connectedDevices.length}
          </div>
          <div className="text-xs text-foreground-muted">Devices</div>
        </div>
      </div>

      {!data.enabled ? (
        <div className="flex flex-col items-center justify-center py-8 text-foreground-muted">
          <Bluetooth className="w-12 h-12 mb-2 opacity-30" />
          <p className="text-sm">Bluetooth is disabled</p>
        </div>
      ) : connectedDevices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-foreground-muted">
          <Bluetooth className="w-12 h-12 mb-2 opacity-30" />
          <p className="text-sm">No devices connected</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {connectedDevices.map((device, index) => {
            const DeviceIcon = getDeviceIcon(device.type);
            const signalStrength = getSignalStrength(device.rssi);
            const signalBars = Math.ceil(signalStrength / 25);

            return (
              <div
                key={`${device.mac}-${index}`}
                className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <DeviceIcon className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {device.name || 'Unknown Device'}
                    </span>
                  </div>
                  {device.rssi !== undefined && (
                    <div className="flex items-center gap-1 shrink-0">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={`w-1 h-3 rounded-full ${
                            bar <= signalBars
                              ? 'bg-cyan-500'
                              : 'bg-foreground-muted/20'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-foreground-muted">
                    {device.battery !== undefined && (
                      <div className="flex items-center gap-1">
                        <Battery className="w-3 h-3" />
                        <span>{device.battery}%</span>
                      </div>
                    )}
                    {device.manufacturer && (
                      <span className="truncate max-w-[100px]">{device.manufacturer}</span>
                    )}
                  </div>
                  {device.type && device.type !== 'unknown' && (
                    <span className="text-foreground-muted capitalize">{device.type}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

BluetoothModule.displayName = 'BluetoothModule';

export default BluetoothModule;

