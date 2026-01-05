import React, { useState } from 'react';
import type { BluetoothStats, BluetoothDevice } from '../../../../types/stats';
import { Bluetooth, Headphones, Mouse, Keyboard, Speaker, Battery, Circle, X, Info, Radio, Hash } from 'lucide-react';

interface BluetoothModuleProps {
  data: BluetoothStats;
}

interface DeviceDetailModalProps {
  device: BluetoothDevice;
  isOpen: boolean;
  onClose: () => void;
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

// Filter out system/internal Bluetooth connections and services
const isSystemConnection = (device: BluetoothDevice): boolean => {
  const name = (device.name || '').toLowerCase();
  const type = (device.type || '').toLowerCase();
  const mac = (device.mac || '').toLowerCase();
  
  // System connection patterns
  const systemNamePatterns = [
    'bluetooth adapter',
    'bluetooth device',
    'bluetooth radio',
    'bluetooth controller',
    'system bluetooth',
    'internal bluetooth',
    'local bluetooth',
    'host controller',
    'hci',
    'bt adapter',
    'bt device',
  ];
  
  // Bluetooth Services/Profiles (system services, not actual devices)
  const bluetoothServices = [
    'object push service',
    'personal area network service',
    'pan service',
    'file transfer service',
    'ftp service',
    'obex service',
    'serial port service',
    'spp service',
    'headset service',
    'hands-free service',
    'audio service',
    'avrcp service',
    'a2dp service',
    'hid service',
    'human interface device service',
    'dial-up networking service',
    'dun service',
    'phone book access service',
    'pbap service',
    'message access service',
    'map service',
    'health service',
    'hdp service',
    'device id service',
    'did service',
    'battery service',
    'bas service',
    'generic access service',
    'gap service',
    'generic attribute service',
    'gatt service',
    'link management service',
    'lmp service',
    'service discovery service',
    'sdp service',
  ];
  
  const systemTypePatterns = [
    'adapter',
    'controller',
    'host',
    'system',
    'internal',
    'service',
    'profile',
  ];
  
  // Check for Bluetooth services/profiles
  if (bluetoothServices.some(service => name.includes(service))) {
    return true;
  }
  
  // Check name patterns
  if (systemNamePatterns.some(pattern => name.includes(pattern))) {
    return true;
  }
  
  // Check type patterns
  if (systemTypePatterns.some(pattern => type.includes(pattern))) {
    return true;
  }
  
  // Check for empty or invalid MAC (system connections often have empty MAC)
  if (!mac || mac === '00:00:00:00:00:00' || mac.length < 12) {
    // Only filter if name also suggests system
    if (name.includes('bluetooth') || name.includes('adapter') || name.includes('system') || name.includes('service')) {
      return true;
    }
  }
  
  return false;
};

const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({ device, isOpen, onClose }) => {
  if (!isOpen) return null;

  const DeviceIcon = getDeviceIcon(device.type);
  const signalStrength = getSignalStrength(device.rssi);
  const signalBars = Math.ceil(signalStrength / 25);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-glass-panel)] rounded-xl border border-[var(--color-glass-border)] shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-glass-border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-lg">
              <DeviceIcon className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {device.name || 'Unknown Device'}
              </h3>
              <p className="text-xs text-foreground-muted">Device Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-glass-button-hover)] rounded-lg transition-colors text-foreground-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 fill-cyan-500 text-cyan-500" />
                  <span className="text-sm font-medium text-foreground">Connection Status</span>
                </div>
                <span className="px-2 py-1 bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 rounded text-xs font-medium">
                  {device.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Device Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-500" />
                Device Information
              </h4>
              
              <div className="space-y-2">
                {device.mac && (
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="w-4 h-4 text-foreground-muted" />
                      <span className="text-xs text-foreground-muted">MAC Address</span>
                    </div>
                    <p className="text-sm font-mono text-foreground">{device.mac}</p>
                  </div>
                )}

                {device.type && device.type !== 'unknown' && (
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <div className="flex items-center gap-2 mb-1">
                      <DeviceIcon className="w-4 h-4 text-foreground-muted" />
                      <span className="text-xs text-foreground-muted">Device Type</span>
                    </div>
                    <p className="text-sm font-medium text-foreground capitalize">{device.type}</p>
                  </div>
                )}

                {device.manufacturer && (
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="w-4 h-4 text-foreground-muted" />
                      <span className="text-xs text-foreground-muted">Manufacturer</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{device.manufacturer}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Signal & Battery */}
            <div className="grid grid-cols-2 gap-3">
              {device.rssi !== undefined && (
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Radio className="w-4 h-4 text-foreground-muted" />
                    <span className="text-xs text-foreground-muted">Signal Strength</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={`w-1.5 h-4 rounded-full ${
                            bar <= signalBars
                              ? 'bg-cyan-500'
                              : 'bg-foreground-muted/20'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-mono text-foreground">{device.rssi} dBm</span>
                  </div>
                  <p className="text-xs text-foreground-muted mt-1">
                    {signalStrength >= 75 ? 'Excellent' : 
                     signalStrength >= 50 ? 'Good' : 
                     signalStrength >= 25 ? 'Fair' : 'Weak'}
                  </p>
                </div>
              )}

              {device.battery !== undefined && (
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Battery className="w-4 h-4 text-foreground-muted" />
                    <span className="text-xs text-foreground-muted">Battery Level</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-foreground-muted/20 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          device.battery >= 50 ? 'bg-green-500' :
                          device.battery >= 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${device.battery}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground">{device.battery}%</span>
                  </div>
                  <p className="text-xs text-foreground-muted mt-1">
                    {device.battery >= 80 ? 'High' : 
                     device.battery >= 50 ? 'Medium' : 
                     device.battery >= 20 ? 'Low' : 'Critical'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BluetoothModule: React.FC<BluetoothModuleProps> = React.memo(({ data }) => {
  // Filter out system connections and only show user-connected devices
  const connectedDevices = data.devices.filter(d => 
    d.connected && !isSystemConnection(d)
  );
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeviceClick = (device: BluetoothDevice) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
  };

  // Close modal on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  return (
    <>
      <div className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${data.enabled ? 'bg-cyan-500/10 dark:bg-cyan-500/10' : 'bg-foreground-muted/10'}`}>
              <Bluetooth className={`w-5 h-5 ${data.enabled ? 'text-cyan-500 dark:text-cyan-400' : 'text-foreground-muted'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-foreground">Bluetooth</h3>
                {data.enabled ? (
                  <span className="flex items-center gap-1 text-xs">
                    <Circle className="w-2 h-2 fill-cyan-500 text-cyan-500" />
                    <span className="text-cyan-500 dark:text-cyan-400 font-medium">On</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs">
                    <Circle className="w-2 h-2 fill-foreground-muted text-foreground-muted" />
                    <span className="text-foreground-muted font-medium">Off</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground-muted">
                {data.enabled 
                  ? connectedDevices.length > 0 
                    ? `${connectedDevices.length} device${connectedDevices.length > 1 ? 's' : ''} connected`
                    : 'No devices'
                  : 'Bluetooth disabled'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold font-mono ${data.enabled && connectedDevices.length > 0 ? 'text-cyan-500' : 'text-foreground-muted'}`}>
              {connectedDevices.length}
            </div>
            <div className="text-xs text-foreground-muted">Connected</div>
          </div>
        </div>

        {!data.enabled ? (
          <div className="flex flex-col items-center justify-center py-8 text-foreground-muted">
            <Bluetooth className="w-12 h-12 mb-2 opacity-30" />
            <p className="text-sm font-medium">Bluetooth is disabled</p>
            <p className="text-xs mt-1 opacity-70">Enable Bluetooth to see connected devices</p>
          </div>
        ) : connectedDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-foreground-muted">
            <Bluetooth className="w-12 h-12 mb-2 opacity-30" />
            <p className="text-sm font-medium">No devices connected</p>
            <p className="text-xs mt-1 opacity-70">Connect a Bluetooth device to see it here</p>
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
                  onClick={() => handleDeviceClick(device)}
                  className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)] cursor-pointer hover:bg-[var(--color-glass-button-hover)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <DeviceIcon className="w-4 h-4 text-cyan-500 shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {device.name || 'Unknown Device'}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Circle className="w-1.5 h-1.5 fill-cyan-500 text-cyan-500" />
                        <span className="text-xs text-cyan-500 dark:text-cyan-400">Connected</span>
                      </span>
                    </div>
                    {device.rssi !== undefined && signalStrength > 0 && (
                      <div className="flex items-center gap-0.5 shrink-0">
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
                  <div className="flex items-center justify-between text-xs text-foreground-muted">
                    <div className="flex items-center gap-3">
                      {device.battery !== undefined && (
                        <div className="flex items-center gap-1">
                          <Battery className="w-3 h-3" />
                          <span>{device.battery}%</span>
                        </div>
                      )}
                      {device.type && device.type !== 'unknown' && (
                        <span className="capitalize">{device.type}</span>
                      )}
                    </div>
                    <Info className="w-3 h-3 opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedDevice && (
        <DeviceDetailModal
          device={selectedDevice}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
});

BluetoothModule.displayName = 'BluetoothModule';

export default BluetoothModule;

